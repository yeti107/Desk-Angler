import { listen } from "@tauri-apps/api/event";

// Listens for an event from the Rust side or from another window. Returns a
// function that stops listening, which is the shape useEffect wants for its
// cleanup.
export function subscribe<T>(event: string, handler: (payload: T) => void) {
  const unlisten = listen<T>(event, (received) => handler(received.payload));

  return () => {
    unlisten.then((stop) => stop());
  };
}
