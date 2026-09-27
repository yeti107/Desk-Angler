import { useState } from "react";

type FocusState = "idle" | "focusing";

function App() {
  const [focus, setFocus] = useState<FocusState>("idle");

  return (
    <div>
      <h1>Desk Angler</h1>

      <button
        onClick={() => {
          if (focus === "idle") {
            setFocus("focusing");
          } else {
            setFocus("idle");
          }
        }}
      >
        {focus === "idle" ? "Start Focus" : "End Focus"}
      </button>

      {focus === "focusing" && (
        <div>
          Fisherman
        </div>
      )}
    </div>
  );
}

export default App;




