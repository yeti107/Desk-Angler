mod apps;
// The old Apple Vision camera. Only built on macOS with the `apple-vision`
// feature (`npm run tauri dev -- --features apple-vision`), as a fallback
// until MediaPipe has been tested on the Mac. Everywhere else, MediaPipe in
// the webview does the analysing and reports to `presence`.
#[cfg(all(target_os = "macos", feature = "apple-vision"))]
mod camera;
mod presence;
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

// Which engine analyses the camera, so the frontend knows whether to run
// MediaPipe itself.
#[tauri::command]
fn camera_engine() -> &'static str {
    if cfg!(all(target_os = "macos", feature = "apple-vision")) {
        "apple-vision"
    } else {
        "mediapipe"
    }
}

// The camera commands are `async` so they run off the main thread: the Apple
// Vision version can wait on the permission prompt, and the window must stay
// responsive. With MediaPipe, the frontend has already opened the camera by
// the time it calls this; this switches the backend's camera state on.
#[tauri::command(async)]
fn start_camera() -> Result<(), String> {
    #[cfg(all(target_os = "macos", feature = "apple-vision"))]
    return camera::start();

    #[cfg(not(all(target_os = "macos", feature = "apple-vision")))]
    {
        presence::start();
        Ok(())
    }
}

#[tauri::command(async)]
fn stop_camera() {
    #[cfg(all(target_os = "macos", feature = "apple-vision"))]
    camera::stop();

    #[cfg(not(all(target_os = "macos", feature = "apple-vision")))]
    presence::stop();
}

// MediaPipe's yes/no for the latest frame, about once a second.
#[tauri::command]
fn report_presence(person_visible: bool) {
    presence::report(person_visible);
}

// `None` while the camera is off.
fn person_visible() -> Option<bool> {
    #[cfg(all(target_os = "macos", feature = "apple-vision"))]
    return camera::person_visible();

    #[cfg(not(all(target_os = "macos", feature = "apple-vision")))]
    presence::person_visible()
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
                    person_visible: person_visible(),
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
            camera_engine,
            start_camera,
            stop_camera,
            report_presence,
            update_session,
            session_info,
            show_main_window
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
