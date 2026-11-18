// Asks Windows which apps have windows open and which one is in front.
//
// Windows has nothing like the Mac's bundle identifier, so an app is
// identified by its program file name, e.g. "chrome.exe". Unlike the full
// path, it stays the same when apps like Discord update into a new folder.

use std::path::Path;

use windows::core::{BOOL, HSTRING, PCWSTR, PWSTR};
use windows::Win32::Foundation::{CloseHandle, HWND, LPARAM};
use windows::Win32::Graphics::Dwm::{DwmGetWindowAttribute, DWMWA_CLOAKED};
use windows::Win32::Storage::FileSystem::{
    GetFileVersionInfoSizeW, GetFileVersionInfoW, VerQueryValueW,
};
use windows::Win32::System::Threading::{
    GetCurrentProcessId, OpenProcess, QueryFullProcessImageNameW, PROCESS_NAME_WIN32,
    PROCESS_QUERY_LIMITED_INFORMATION,
};
use windows::Win32::UI::WindowsAndMessaging::{
    EnumChildWindows, EnumWindows, GetForegroundWindow, GetWindow, GetWindowLongW,
    GetWindowTextLengthW, GetWindowThreadProcessId, IsWindowVisible, GWL_EXSTYLE, GW_OWNER,
    WS_EX_TOOLWINDOW,
};

use super::AppInfo;

// Microsoft Store apps draw inside a window owned by this shared host program,
// so the real app has to be found inside it.
const STORE_APP_HOST: &str = "applicationframehost.exe";

pub fn frontmost_app() -> Option<AppInfo> {
    let window = unsafe { GetForegroundWindow() };
    if window.is_invalid() {
        return None;
    }
    app_for_window(window)
}

// Whether Desk Angler itself is the app in front.
pub fn desk_angler_is_active() -> bool {
    let window = unsafe { GetForegroundWindow() };
    !window.is_invalid() && process_id(window) == unsafe { GetCurrentProcessId() }
}

// Only apps with a window you'd see on the taskbar, sorted by name. This
// leaves out background helpers the user would never recognise.
pub fn running_apps() -> Vec<AppInfo> {
    let mut apps: Vec<AppInfo> = Vec::new();

    for window in top_level_windows() {
        if !is_app_window(window) {
            continue;
        }
        let Some(app) = app_for_window(window) else {
            continue;
        };
        // An app with several windows open is listed once.
        if !apps.iter().any(|listed| listed.id == app.id) {
            apps.push(app);
        }
    }

    apps.sort_by_key(|app| app.name.to_lowercase());
    apps
}

fn app_for_window(window: HWND) -> Option<AppInfo> {
    let mut pid = process_id(window);
    let mut path = process_path(pid)?;

    if file_name(&path) == STORE_APP_HOST {
        // The real Store app's window sits inside the host's window. If it
        // can't be found (e.g. the app is suspended), skip it rather than
        // report every Store app as "Application Frame Host".
        pid = store_app_process(window, pid)?;
        path = process_path(pid)?;
    }

    let id = file_name(&path);
    let name = file_description(&path).unwrap_or_else(|| {
        // No description built in, so use the file name without ".exe".
        Path::new(&path)
            .file_stem()
            .map_or_else(|| id.clone(), |stem| stem.to_string_lossy().into_owned())
    });

    Some(AppInfo { id, name })
}

// Whether a window is one the user would think of as an app: visible, not
// hidden by Windows ("cloaked", like suspended Store apps or windows on
// another virtual desktop), not owned by another window (like a dialog), not
// a tool window, and has a title.
fn is_app_window(window: HWND) -> bool {
    unsafe {
        if !IsWindowVisible(window).as_bool() {
            return false;
        }
        if GetWindow(window, GW_OWNER).is_ok_and(|owner| !owner.is_invalid()) {
            return false;
        }
        if GetWindowLongW(window, GWL_EXSTYLE) as u32 & WS_EX_TOOLWINDOW.0 != 0 {
            return false;
        }
        if GetWindowTextLengthW(window) == 0 {
            return false;
        }

        let mut cloaked: u32 = 0;
        let cloak_check = DwmGetWindowAttribute(
            window,
            DWMWA_CLOAKED,
            (&raw mut cloaked).cast(),
            size_of::<u32>() as u32,
        );
        cloak_check.is_err() || cloaked == 0
    }
}

fn top_level_windows() -> Vec<HWND> {
    unsafe extern "system" fn collect(window: HWND, list: LPARAM) -> BOOL {
        // SAFETY: `list` is the Vec passed to EnumWindows below, which
        // outlives the call.
        let list = unsafe { &mut *(list.0 as *mut Vec<HWND>) };
        list.push(window);
        true.into()
    }

    let mut windows: Vec<HWND> = Vec::new();
    let _ = unsafe { EnumWindows(Some(collect), LPARAM(&raw mut windows as isize)) };
    windows
}

// Finds the process of the Store app drawing inside a host window: the first
// child window that belongs to a different process than the host.
fn store_app_process(host_window: HWND, host_pid: u32) -> Option<u32> {
    struct Search {
        host_pid: u32,
        found: Option<u32>,
    }

    unsafe extern "system" fn check(window: HWND, search: LPARAM) -> BOOL {
        // SAFETY: `search` is the Search below, which outlives the call.
        let search = unsafe { &mut *(search.0 as *mut Search) };
        let pid = process_id(window);
        if pid != search.host_pid {
            search.found = Some(pid);
            return false.into(); // Found it; stop looking.
        }
        true.into()
    }

    let mut search = Search {
        host_pid,
        found: None,
    };
    let _ = unsafe {
        EnumChildWindows(Some(host_window), Some(check), LPARAM(&raw mut search as isize))
    };
    search.found
}

fn process_id(window: HWND) -> u32 {
    let mut pid = 0;
    unsafe { GetWindowThreadProcessId(window, Some(&mut pid)) };
    pid
}

// The full path of a process's program file. `None` if Windows won't say,
// e.g. for some protected system processes.
fn process_path(pid: u32) -> Option<String> {
    unsafe {
        let process = OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, false, pid).ok()?;

        let mut buffer = [0u16; 1024];
        let mut length = buffer.len() as u32;
        let result = QueryFullProcessImageNameW(
            process,
            PROCESS_NAME_WIN32,
            PWSTR(buffer.as_mut_ptr()),
            &mut length,
        );
        let _ = CloseHandle(process);

        result.ok()?;
        Some(String::from_utf16_lossy(&buffer[..length as usize]))
    }
}

// "C:\...\Chrome.exe" -> "chrome.exe". Lowercased because Windows file names
// ignore case, so the same app always gets the same id.
fn file_name(path: &str) -> String {
    Path::new(path)
        .file_name()
        .map_or_else(String::new, |name| name.to_string_lossy().to_lowercase())
}

// The "File description" built into a program file, e.g. "Google Chrome" for
// chrome.exe.
fn file_description(path: &str) -> Option<String> {
    unsafe {
        let path = HSTRING::from(path);
        let size = GetFileVersionInfoSizeW(PCWSTR(path.as_ptr()), None);
        if size == 0 {
            return None;
        }

        let mut info = vec![0u8; size as usize];
        GetFileVersionInfoW(PCWSTR(path.as_ptr()), None, size, info.as_mut_ptr().cast()).ok()?;

        // The description is stored per language. Try the languages the file
        // says it has, then US English as a fallback.
        let mut languages = Vec::new();
        if let Some(translations) = query_value(&info, "\\VarFileInfo\\Translation", Units::Bytes)
        {
            // Pairs of (language, code page).
            for pair in translations.chunks_exact(2) {
                languages.push(format!("{:04x}{:04x}", pair[0], pair[1]));
            }
        }
        languages.push("040904b0".into());
        languages.push("040904e4".into());

        for language in languages {
            let key = format!("\\StringFileInfo\\{language}\\FileDescription");
            if let Some(text) = query_value(&info, &key, Units::Characters) {
                // Stop at the first null character: some programs report a
                // length that runs past the end of the text.
                let text = text.split(|&unit| unit == 0).next().unwrap_or_default();
                let text = String::from_utf16_lossy(text);
                let text = text.trim();
                if !text.is_empty() {
                    return Some(text.to_owned());
                }
            }
        }
        None
    }
}

// How Windows reports the length of a version information entry: text
// entries in characters, the language table in bytes.
enum Units {
    Characters,
    Bytes,
}

// Looks up one entry in a program's version information, as 16-bit units.
fn query_value<'a>(info: &'a [u8], key: &str, units: Units) -> Option<&'a [u16]> {
    let key = HSTRING::from(key);
    let mut value = std::ptr::null_mut();
    let mut length = 0u32;

    unsafe {
        let found = VerQueryValueW(
            info.as_ptr().cast(),
            PCWSTR(key.as_ptr()),
            &mut value,
            &mut length,
        );
        if !found.as_bool() || value.is_null() || length == 0 {
            return None;
        }

        let count = match units {
            Units::Characters => length as usize,
            Units::Bytes => length as usize / 2,
        };
        // SAFETY: the pointer points inside `info`, which outlives the slice.
        Some(std::slice::from_raw_parts(value as *const u16, count))
    }
}
