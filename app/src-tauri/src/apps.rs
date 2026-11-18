// Asks the system which apps are running and which one is in front.
//
// The macOS version is below; the Windows version is in apps/win.rs. On other
// systems these return placeholders so the app still builds.

#[cfg(target_os = "macos")]
use objc2::rc::autoreleasepool;
#[cfg(target_os = "macos")]
use objc2_app_kit::{NSApplicationActivationPolicy, NSRunningApplication, NSWorkspace};

#[cfg(windows)]
mod win;
#[cfg(windows)]
pub use win::{desk_angler_is_active, frontmost_app, running_apps};

#[derive(Clone, serde::Serialize)]
pub struct AppInfo {
    // What apps are compared by. Unlike the name, it never changes with the
    // system language. On macOS it is the bundle identifier, e.g.
    // "com.apple.Safari"; on Windows the program file name, e.g. "chrome.exe".
    pub id: String,
    pub name: String,
}

#[cfg(target_os = "macos")]
fn app_info(app: &NSRunningApplication) -> Option<AppInfo> {
    let id = app.bundleIdentifier()?.to_string();
    let name = app.localizedName()?.to_string();
    Some(AppInfo { id, name })
}

#[cfg(target_os = "macos")]
pub fn frontmost_app() -> Option<AppInfo> {
    autoreleasepool(|_| {
        let app = NSWorkspace::sharedWorkspace().frontmostApplication()?;
        app_info(&app)
    })
}

// Whether Desk Angler itself is the app in front.
#[cfg(target_os = "macos")]
pub fn desk_angler_is_active() -> bool {
    autoreleasepool(|_| NSRunningApplication::currentApplication().isActive())
}

// Only apps that show in the Dock, sorted by name. This leaves out background
// helpers the user would never recognise.
#[cfg(target_os = "macos")]
pub fn running_apps() -> Vec<AppInfo> {
    autoreleasepool(|_| {
        let mut apps: Vec<AppInfo> = NSWorkspace::sharedWorkspace()
            .runningApplications()
            .iter()
            .filter(|app| app.activationPolicy() == NSApplicationActivationPolicy::Regular)
            .filter_map(|app| app_info(&app))
            .collect();

        apps.sort_by_key(|app| app.name.to_lowercase());
        apps
    })
}

// Placeholders for systems that are neither macOS nor Windows.

// Nothing is ever seen in front, so the distraction list never pauses.
#[cfg(not(any(target_os = "macos", windows)))]
pub fn frontmost_app() -> Option<AppInfo> {
    None
}

// Treat Desk Angler as always in front, so the widget only appears when the
// main window is minimised or hidden, never on top of it.
#[cfg(not(any(target_os = "macos", windows)))]
pub fn desk_angler_is_active() -> bool {
    true
}

// The distraction picker shows an empty list.
#[cfg(not(any(target_os = "macos", windows)))]
pub fn running_apps() -> Vec<AppInfo> {
    Vec::new()
}
