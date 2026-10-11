// Watches the camera and works out whether a person is in view.
//
// Frames are analysed on this Mac by Apple's Vision framework. They are never
// saved or sent anywhere; the only thing that leaves this file is a yes/no.

use std::sync::{mpsc, Mutex};
use std::time::{Duration, Instant};

use block2::RcBlock;
use dispatch2::{DispatchQueue, DispatchRetained};
use objc2::rc::Retained;
use objc2::runtime::{Bool, NSObject, NSObjectProtocol, ProtocolObject};
use objc2::{define_class, msg_send, AllocAnyThread};
use objc2_av_foundation::{
    AVAuthorizationStatus, AVCaptureConnection, AVCaptureDevice, AVCaptureDeviceInput,
    AVCaptureOutput, AVCaptureSession, AVCaptureSessionPreset640x480, AVCaptureVideoDataOutput,
    AVCaptureVideoDataOutputSampleBufferDelegate, AVMediaTypeVideo,
};
use objc2_core_media::CMSampleBuffer;
use objc2_foundation::{NSArray, NSDictionary};
use objc2_vision::{
    VNDetectFaceRectanglesRequest, VNDetectHumanRectanglesRequest, VNImageRequestHandler,
    VNRequest,
};

// The camera delivers many frames a second; we only look at one per interval.
const CHECK_INTERVAL: Duration = Duration::from_secs(1);
// If no frame has been analysed for this long, assume the camera has stopped
// and report nobody in view.
const STALE_AFTER: Duration = Duration::from_secs(5);

struct Presence {
    person_visible: bool,
    last_check: Instant,
}

// `None` while the camera is off.
static PRESENCE: Mutex<Option<Presence>> = Mutex::new(None);

struct Camera {
    session: Retained<AVCaptureSession>,
    // Held so they stay alive for as long as the session runs.
    _delegate: Retained<FrameDelegate>,
    _queue: DispatchRetained<DispatchQueue>,
}

// SAFETY: the session is only started and stopped while holding the CAMERA
// lock, and AVCaptureSession allows those calls from any thread.
unsafe impl Send for Camera {}

static CAMERA: Mutex<Option<Camera>> = Mutex::new(None);

define_class!(
    // The object macOS hands each camera frame to.
    //
    // SAFETY: NSObject has no subclassing requirements and this type has no
    // Drop implementation.
    #[unsafe(super(NSObject))]
    #[name = "DeskAnglerFrameDelegate"]
    struct FrameDelegate;

    unsafe impl NSObjectProtocol for FrameDelegate {}

    unsafe impl AVCaptureVideoDataOutputSampleBufferDelegate for FrameDelegate {
        #[unsafe(method(captureOutput:didOutputSampleBuffer:fromConnection:))]
        fn capture_output(
            &self,
            _output: &AVCaptureOutput,
            sample_buffer: &CMSampleBuffer,
            _connection: &AVCaptureConnection,
        ) {
            let is_due = PRESENCE
                .lock()
                .unwrap()
                .as_ref()
                .is_some_and(|presence| presence.last_check.elapsed() >= CHECK_INTERVAL);
            if !is_due {
                return;
            }

            let Some(person_visible) = person_in_frame(sample_buffer) else {
                return;
            };

            if let Some(presence) = PRESENCE.lock().unwrap().as_mut() {
                presence.person_visible = person_visible;
                presence.last_check = Instant::now();
            }
        }
    }
);

impl FrameDelegate {
    fn new() -> Retained<Self> {
        let this = Self::alloc().set_ivars(());
        unsafe { msg_send![super(this), init] }
    }
}

// Runs two detectors on one frame: a body detector, which still works when
// the person is looking down at a book, and a face detector as a second
// opinion. Returns `None` if the frame could not be analysed.
fn person_in_frame(sample_buffer: &CMSampleBuffer) -> Option<bool> {
    let image = unsafe { sample_buffer.image_buffer() }?;

    let body_request = unsafe { VNDetectHumanRectanglesRequest::new() };
    let face_request = unsafe { VNDetectFaceRectanglesRequest::new() };
    let requests: [&VNRequest; 2] = [&body_request, &face_request];

    let handler = unsafe {
        VNImageRequestHandler::initWithCVPixelBuffer_options(
            VNImageRequestHandler::alloc(),
            &image,
            &NSDictionary::new(),
        )
    };
    handler
        .performRequests_error(&NSArray::from_slice(&requests))
        .ok()?;

    let bodies = unsafe { body_request.results() }.map_or(0, |found| found.len());
    let faces = unsafe { face_request.results() }.map_or(0, |found| found.len());

    Some(bodies + faces > 0)
}

// Checks camera permission, showing the macOS prompt the first time. This
// waits for the user's answer, so it must not be called on the main thread.
fn has_permission() -> bool {
    let Some(media_type) = (unsafe { AVMediaTypeVideo }) else {
        return false;
    };

    let status = unsafe { AVCaptureDevice::authorizationStatusForMediaType(media_type) };
    if status == AVAuthorizationStatus::Authorized {
        return true;
    }
    if status != AVAuthorizationStatus::NotDetermined {
        return false;
    }

    let (sender, receiver) = mpsc::channel();
    let handler = RcBlock::new(move |granted: Bool| {
        let _ = sender.send(granted.as_bool());
    });
    unsafe { AVCaptureDevice::requestAccessForMediaType_completionHandler(media_type, &handler) };

    receiver.recv().unwrap_or(false)
}

pub fn start() -> Result<(), String> {
    let mut camera = CAMERA.lock().unwrap();
    if camera.is_some() {
        return Ok(());
    }

    if !has_permission() {
        return Err(
            "Camera access is off. Allow it in System Settings > Privacy & Security > Camera."
                .into(),
        );
    }

    unsafe {
        let media_type = AVMediaTypeVideo.ok_or("No camera was found.")?;
        let device =
            AVCaptureDevice::defaultDeviceWithMediaType(media_type).ok_or("No camera was found.")?;
        let input = AVCaptureDeviceInput::deviceInputWithDevice_error(&device)
            .map_err(|error| error.localizedDescription().to_string())?;

        let output = AVCaptureVideoDataOutput::new();
        output.setAlwaysDiscardsLateVideoFrames(true);

        let delegate = FrameDelegate::new();
        let queue = DispatchQueue::new("deskangler.camera", None);
        output.setSampleBufferDelegate_queue(Some(ProtocolObject::from_ref(&*delegate)), Some(&queue));

        let session = AVCaptureSession::new();
        // A small picture is plenty for spotting a person and is cheaper to analyse.
        if session.canSetSessionPreset(AVCaptureSessionPreset640x480) {
            session.setSessionPreset(AVCaptureSessionPreset640x480);
        }
        if !session.canAddInput(&input) || !session.canAddOutput(&output) {
            return Err("The camera could not be set up.".into());
        }
        session.addInput(&input);
        session.addOutput(&output);

        // Assume the person is there until the first frame says otherwise;
        // they have just pressed Start.
        *PRESENCE.lock().unwrap() = Some(Presence {
            person_visible: true,
            last_check: Instant::now(),
        });

        session.startRunning();

        *camera = Some(Camera {
            session,
            _delegate: delegate,
            _queue: queue,
        });
    }

    Ok(())
}

pub fn stop() {
    if let Some(camera) = CAMERA.lock().unwrap().take() {
        unsafe { camera.session.stopRunning() };
    }
    *PRESENCE.lock().unwrap() = None;
}

// `None` while the camera is off.
pub fn person_visible() -> Option<bool> {
    let presence = PRESENCE.lock().unwrap();
    let presence = presence.as_ref()?;

    Some(presence.person_visible && presence.last_check.elapsed() < STALE_AFTER)
}
