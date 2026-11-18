// Holds what the camera last saw: whether a person is at the desk.
//
// The frames are analysed by MediaPipe in the webview (see src/camera.ts),
// which reports a yes/no here about once a second. This file owns the camera
// state so the rest of the backend, like the tick, reads it from one place.
// No images ever reach this file, only the yes/no.

// Not used when the Apple Vision camera is built in, which keeps its own state.
#![cfg_attr(all(target_os = "macos", feature = "apple-vision"), allow(dead_code))]

use std::sync::Mutex;
use std::time::{Duration, Instant};

// If no reading has arrived for this long, assume the camera has stopped
// and report nobody in view.
const STALE_AFTER: Duration = Duration::from_secs(5);

struct Reading {
    person_visible: bool,
    received_at: Instant,
}

// `None` while the camera is off.
static LATEST: Mutex<Option<Reading>> = Mutex::new(None);

pub fn start() {
    // Assume the person is there until the first reading says otherwise;
    // they have just pressed Start.
    *LATEST.lock().unwrap() = Some(Reading {
        person_visible: true,
        received_at: Instant::now(),
    });
}

pub fn stop() {
    *LATEST.lock().unwrap() = None;
}

pub fn report(person_visible: bool) {
    // A reading that arrives after the camera was stopped is ignored, so it
    // can't switch the camera back on.
    if let Some(latest) = LATEST.lock().unwrap().as_mut() {
        latest.person_visible = person_visible;
        latest.received_at = Instant::now();
    }
}

// `None` while the camera is off.
pub fn person_visible() -> Option<bool> {
    let latest = LATEST.lock().unwrap();
    let latest = latest.as_ref()?;

    Some(latest.person_visible && latest.received_at.elapsed() < STALE_AFTER)
}
