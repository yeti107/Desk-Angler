import { useEffect, useState } from "react";
import { getRunningApps, type AppInfo } from "../detection";
import "./DistractionSettings.css";

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
    <div className="panel settings">
      <h2>Distraction apps</h2>
      <p className="muted">
        The fisherman pauses while one of these apps is in front.
      </p>

      {distractions.length === 0 ? (
        <p>None yet.</p>
      ) : (
        <ul className="settings-list">
          {distractions.map((app) => (
            <li key={app.id}>
              <span>{app.name}</span>
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
        <div className="settings-add">
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
        <p className="muted">Open the app you want to add, then refresh.</p>
      )}

      <button onClick={refreshRunningApps}>Refresh running apps</button>
    </div>
  );
}

export default DistractionSettings;
