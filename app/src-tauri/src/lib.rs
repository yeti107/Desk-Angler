mod apps;
mod camera;
mod widget;

use std::{thread, time::Duration};
use tauri::{AppHandle, Emitter, Manager, WindowEvent};

// Sent to the frontend once a second. It is the app's clock, and it carries
// what the detection signals saw at that moment.
#[derive(Clone, serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct Tick {
    frontmost_app: Option<apps::AppInfo>,
    // `None` while the camera is off.
    person_visible: Option<bool>,
}

#[tauri::command]
fn running_apps() -> Vec<apps::AppInfo> {
    apps::running_apps()
}

// The camera commands are `async` so they run off the main thread: starting
// can wait on the permission prompt, and the window must stay responsive.
#[tauri::command(async)]
fn start_camera() -> Result<(), String> {
    camera::start()
}

#[tauri::command(async)]
fn stop_camera() {
    camera::stop()
}

// The main window reports the session here so the widget can draw it.
#[tauri::command]
fn update_session(app: AppHandle, info: widget::SessionInfo) {
    widget::update_session(&app, info);
}

#[tauri::command]
fn session_info() -> widget::SessionInfo {
    widget::session_info()
}

#[tauri::command]
fn show_main_window(app: AppHandle) {
    if let Some(main) = app.get_webview_window("main") {
        let _ = main.unminimize();
        let _ = main.show();
        let _ = main.set_focus();
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let handle = app.handle().clone();

            thread::spawn(move || loop {
                thread::sleep(Duration::from_secs(1));

                let tick = Tick {
                    frontmost_app: apps::frontmost_app(),
                    person_visible: camera::person_visible(),
                };
                let _ = handle.emit("tick", tick);
            });

            if let (Some(widget), Some(main)) = (
                app.get_webview_window("widget"),
                app.get_webview_window("main"),
            ) {
                widget::make_floating_panel(&widget);
                widget::place_in_corner(&widget, &main);
            }
            widget::watch(app.handle().clone());

            Ok(())
        })
        .on_window_event(|window, event| {
            if window.label() != "main" {
                return;
            }

            if let WindowEvent::CloseRequested { api, .. } = event {
                if widget::session_active() {
                    // Closing mid-session would lose it, so tuck the window
                    // away and let the widget take over.
                    api.prevent_close();
                    let _ = window.minimize();
                } else {
                    // The hidden widget window would otherwise keep the app alive.
                    window.app_handle().exit(0);
                }
            }
        })
        .invoke_handler(tauri::generate_handler![
            running_apps,
            start_camera,
            stop_camera,
            update_session,
            session_info,
            show_main_window
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
