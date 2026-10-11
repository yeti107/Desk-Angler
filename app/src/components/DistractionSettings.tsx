import { useEffect, useState } from "react";
import { getRunningApps, type AppInfo } from "../detection";

type DistractionSettingsProps = {
  distractions: AppInfo[];
  onChange: (distractions: AppInfo[]) => void;
};

function DistractionSettings({ distractions, onChange }: DistractionSettingsProps) {
  const [runningApps, setRunningApps] = useState<AppInfo[]>([]);
  const [selectedId, setSelectedId] = useState("");

  function refreshRunningApps() {
    getRunningApps().then(setRunningApps);
  }

  useEffect(refreshRunningApps, []);

  // Running apps that aren't on the list yet.
  const choices = runningApps.filter(
    (app) => !distractions.some((distraction) => distraction.id === app.id),
  );
  const selected = choices.find((app) => app.id === selectedId) ?? choices[0];

  return (
    <div>
      <h2>Distraction apps</h2>

      {distractions.length === 0 ? (
        <div>None yet. The fisherman pauses while one of these is in front.</div>
      ) : (
        <ul>
          {distractions.map((app) => (
            <li key={app.id}>
              {app.name}{" "}
              <button
                onClick={() =>
                  onChange(distractions.filter((other) => other.id !== app.id))
                }
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      {selected ? (
        <div>
          <select
            value={selected.id}
            onChange={(event) => setSelectedId(event.target.value)}
          >
            {choices.map((app) => (
              <option key={app.id} value={app.id}>
                {app.name}
              </option>
            ))}
          </select>
          <button onClick={() => onChange([...distractions, selected])}>Add</button>
        </div>
      ) : (
        <div>Open the app you want to add, then refresh.</div>
      )}

      <button onClick={refreshRunningApps}>Refresh running apps</button>
    </div>
  );
}

export default DistractionSettings;
