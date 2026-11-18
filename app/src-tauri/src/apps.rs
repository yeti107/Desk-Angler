// Asks the system which apps are running and which one is in front.
//
// Only macOS is implemented so far. On other systems these return
// placeholders so the app still builds and behaves sensibly.

#[cfg(target_os = "macos")]
use objc2::rc::autoreleasepool;
#[cfg(target_os = "macos")]
use objc2_app_kit::{NSApplicationActivationPolicy, NSRunningApplication, NSWorkspace};

#[derive(Clone, serde::Serialize)]
pub struct AppInfo {
    // The bundle identifier, e.g. "com.apple.Safari". Unlike the name, it never
    // changes with the system language, so it is what we compare apps by.
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

// Placeholders until real Windows app tracking is built.

// Nothing is ever seen in front, so the distraction list never pauses.
#[cfg(not(target_os = "macos"))]
pub fn frontmost_app() -> Option<AppInfo> {
    None
}

// Treat Desk Angler as always in front, so the widget only appears when the
// main window is minimised or hidden, never on top of it.
#[cfg(not(target_os = "macos"))]
pub fn desk_angler_is_active() -> bool {
    true
}

// The distraction picker shows an empty list.
#[cfg(not(target_os = "macos"))]
pub fn running_apps() -> Vec<AppInfo> {
    Vec::new()
}
