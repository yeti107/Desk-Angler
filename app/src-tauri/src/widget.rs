// Runs the small always-on-top widget window: when it is shown, where it
// sits, and when it accepts clicks.
//
// The widget normally lets clicks pass through to whatever is underneath. A
// window in that mode receives no mouse events at all, so the page inside it
// cannot tell that the cursor is hovering. This file watches the cursor from
// the outside instead.

use std::sync::Mutex;
use std::thread;
use std::time::{Duration, Instant};

use objc2::runtime::AnyObject;
use objc2::ClassType;
use objc2_app_kit::{
    NSPanel, NSStatusWindowLevel, NSWindow, NSWindowCollectionBehavior, NSWindowStyleMask,
};
use tauri::{AppHandle, Emitter, LogicalPosition, Manager, WebviewWindow};

use crate::apps;

// Must match the widget window's size in tauri.conf.json.
const WIDGET_WIDTH: f64 = 160.0;
const WIDGET_HEIGHT: f64 = 100.0;

const POLL_INTERVAL: Duration = Duration::from_millis(200);
// How long the cursor must rest on the widget before it accepts clicks.
const HOVER_TO_UNLOCK: Duration = Duration::from_secs(3);

// What the main window tells us about the session. The widget draws from it.
#[derive(Clone, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionInfo {
    pub active: bool,
    pub is_fishing: bool,
    pub bite_count: u32,
    pub manually_paused: bool,
}

static SESSION: Mutex<SessionInfo> = Mutex::new(SessionInfo {
    active: false,
    is_fishing: false,
    bite_count: 0,
    manually_paused: false,
});

pub fn session_info() -> SessionInfo {
    SESSION.lock().unwrap().clone()
}

pub fn update_session(app: &AppHandle, info: SessionInfo) {
    *SESSION.lock().unwrap() = info.clone();
    let _ = app.emit("session-info", info);
}

pub fn session_active() -> bool {
    SESSION.lock().unwrap().active
}

// Turns the widget's window into a floating panel. A normal window cannot
// appear on top of another app that is in full-screen mode, and it takes
// keyboard focus when shown; a panel does neither. Must run on the main thread.
pub fn make_floating_panel(widget: &WebviewWindow) {
    let Ok(pointer) = widget.ns_window() else {
        return;
    };

    // SAFETY: the pointer is this window's live NSWindow. NSPanel is a
    // subclass of NSWindow that adds no stored fields, so the object can be
    // switched to that class in place.
    unsafe {
        objc2::ffi::object_setClass(pointer as *mut AnyObject, NSPanel::class());
        let panel = &*(pointer as *const NSPanel);

        panel.setStyleMask(panel.styleMask() | NSWindowStyleMask::NonactivatingPanel);
        panel.setFloatingPanel(true);
        panel.setHidesOnDeactivate(false);
        panel.setLevel(NSStatusWindowLevel);
        panel.setCollectionBehavior(
            NSWindowCollectionBehavior::CanJoinAllSpaces
                | NSWindowCollectionBehavior::FullScreenAuxiliary
                | NSWindowCollectionBehavior::Stationary
                | NSWindowCollectionBehavior::IgnoresCycle,
        );
    }
}

// Puts the widget in the bottom-right corner of the screen the main window
// is on.
//
// Positions here are in "logical" points, not physical pixels. A Retina
// screen has two pixels per point and an ordinary one has one, so pixel
// maths goes wrong as soon as two different screens are involved.
pub fn place_in_corner(widget: &WebviewWindow, main: &WebviewWindow) {
    let monitor = match main.current_monitor() {
        Ok(Some(monitor)) => monitor,
        _ => match widget.primary_monitor() {
            Ok(Some(monitor)) => monitor,
            _ => return,
        },
    };

    let scale = monitor.scale_factor();
    let origin = monitor.position().to_logical::<f64>(scale);
    let size = monitor.size().to_logical::<f64>(scale);

    let margin_right = 24.0;
    // Enough to clear the Dock.
    let margin_bottom = 96.0;

    let x = origin.x + size.width - WIDGET_WIDTH - margin_right;
    let y = origin.y + size.height - WIDGET_HEIGHT - margin_bottom;

    let _ = widget.set_position(LogicalPosition::new(x, y));
}

fn cursor_is_over(app: &AppHandle, widget: &WebviewWindow) -> bool {
    let (Ok(cursor), Ok(Some(primary)), Ok(position), Ok(size), Ok(scale)) = (
        app.cursor_position(),
        app.primary_monitor(),
        widget.outer_position(),
        widget.outer_size(),
        widget.scale_factor(),
    ) else {
        return false;
    };

    // The cursor is reported in the main screen's pixels and the window in
    // its own screen's pixels, so convert both to points before comparing.
    let cursor = cursor.to_logical::<f64>(primary.scale_factor());
    let position = position.to_logical::<f64>(scale);
    let size = size.to_logical::<f64>(scale);

    cursor.x >= position.x
        && cursor.x <= position.x + size.width
        && cursor.y >= position.y
        && cursor.y <= position.y + size.height
}

// Shows the widget without giving it keyboard focus or bringing Desk Angler
// to the front.
fn show(app: &AppHandle, widget: &WebviewWindow) {
    let widget = widget.clone();
    let _ = app.run_on_main_thread(move || {
        if let Ok(pointer) = widget.ns_window() {
            // SAFETY: the pointer is this window's live NSWindow and we are
            // on the main thread.
            unsafe { (*(pointer as *const NSWindow)).orderFrontRegardless() };
        }
    });
}

fn set_interactive(app: &AppHandle, widget: &WebviewWindow, interactive: bool) {
    let _ = widget.set_ignore_cursor_events(!interactive);
    let _ = app.emit("widget-interactive", interactive);
}

pub fn watch(app: AppHandle) {
    thread::spawn(move || {
        let mut shown = false;
        let mut interactive = false;
        let mut hover_started: Option<Instant> = None;

        loop {
            thread::sleep(POLL_INTERVAL);

            let (Some(main), Some(widget)) = (
                app.get_webview_window("main"),
                app.get_webview_window("widget"),
            ) else {
                continue;
            };

            // Show the widget during a session whenever the main window is
            // not being used: another app is in front, or it is minimised or
            // hidden.
            let main_in_use = apps::desk_angler_is_active()
                && main.is_visible().unwrap_or(false)
                && !main.is_minimized().unwrap_or(false);
            let should_show = session_active() && !main_in_use;

            if should_show != shown {
                shown = should_show;
                interactive = false;
                hover_started = None;
                set_interactive(&app, &widget, false);

                if shown {
                    show(&app, &widget);
                } else {
                    let _ = widget.hide();
                }
            }

            if !shown {
                continue;
            }

            if cursor_is_over(&app, &widget) {
                let started = *hover_started.get_or_insert_with(Instant::now);

                if !interactive && started.elapsed() >= HOVER_TO_UNLOCK {
                    interactive = true;
                    set_interactive(&app, &widget, true);
                }
            } else {
                hover_started = None;

                if interactive {
                    interactive = false;
                    set_interactive(&app, &widget, false);
                }
            }
        }
    });
}
