import type { Note, ScaleName } from "../types/music";
import { NOTES, SCALES } from "../types/music";

export function ControlsBar({
  keyRoot,
  setKeyRoot,
  scaleName,
  setScaleName,
  bpm,
  setBpm,
  onLoad,
  onPlay,
  onClear,
  loaded,
}: {
  keyRoot: Note;
  setKeyRoot: (n: Note) => void;
  scaleName: ScaleName;
  setScaleName: (s: ScaleName) => void;
  bpm: number;
  setBpm: (n: number) => void;
  onLoad: () => void;
  onPlay: () => void;
  onClear: () => void;
  loaded: boolean;
}) {
  return (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", marginTop: 14 }}>
      <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
        Key
        <select value={keyRoot} onChange={(e) => setKeyRoot(e.target.value as Note)}>
          {NOTES.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
      </label>

      <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
        Scale
        <select value={scaleName} onChange={(e) => setScaleName(e.target.value as ScaleName)}>
          {Object.keys(SCALES).map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </label>

      <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
        Tempo
        <input type="range" min={50} max={180} value={bpm} onChange={(e) => setBpm(parseInt(e.target.value))} />
        <span style={{ width: 64 }}>{bpm} BPM</span>
      </label>

      <button
        onClick={onLoad}
        style={{ padding: "10px 14px", borderRadius: 12, border: 0, cursor: "pointer", fontWeight: 800 }}
      >
        {loaded ? "Guitar Loaded" : "Load Guitar"}
      </button>

      <button
        onClick={onPlay}
        style={{ padding: "10px 14px", borderRadius: 12, border: 0, cursor: "pointer", fontWeight: 900 }}
      >
        ▶ Play
      </button>

      <button
        onClick={onClear}
        style={{ padding: "10px 14px", borderRadius: 12, border: 0, cursor: "pointer", fontWeight: 700, opacity: 0.85 }}
      >
        Clear
      </button>
    </div>
  );
}