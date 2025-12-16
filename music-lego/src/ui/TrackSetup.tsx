import type { Note, ScaleName } from "../types/music";
import type { TimeSig, TrackSettings } from "../types/track";
import { NOTES } from "../types/music";

type TrackSetupProps = {
  settings: TrackSettings;
  slotCount: number;
  onTrackNameChange: (name: string) => void;
  onKeyRootChange: (key: Note) => void;
  onScaleNameChange: (scale: ScaleName) => void;
  onBpmChange: (bpm: number) => void;
  onTempoMinus: () => void;
  onTempoPlus: () => void;
  onTimeSigChange: (sig: TimeSig) => void;
  onLoadGuitar: () => void;
  onPlayArrangement: () => void;
  onClearArrangement: () => void;
  guitarLoaded: boolean;
  isPlaying: boolean;
};

export function TrackSetup({
  settings,
  slotCount,
  onTrackNameChange,
  onKeyRootChange,
  onScaleNameChange,
  onBpmChange,
  onTempoMinus,
  onTempoPlus,
  onTimeSigChange,
  onLoadGuitar,
  onPlayArrangement,
  onClearArrangement,
  guitarLoaded,
  isPlaying,
}: TrackSetupProps) {
  return (
    <div
      style={{
        background: "rgba(42, 42, 42, 0.6)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        borderRadius: 20,
        padding: 20,
        backdropFilter: "blur(10px)",
      }}
    >
      <h2 style={{ fontSize: 20, margin: 0, fontWeight: 600, letterSpacing: "-0.3px" }}>Track Settings</h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.2fr 1fr 1fr 1fr",
          gap: 12,
          marginTop: 12,
        }}
      >
        <div>
          <label
            style={{
              display: "block",
              opacity: 0.8,
              fontSize: 13,
              marginBottom: 6,
            }}
          >
            Track name
          </label>
          <input
            value={settings.trackName}
            onChange={(e) => onTrackNameChange(e.target.value)}
            placeholder="e.g., My song"
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.1)",
              background: "rgba(0,0,0,0.3)",
              color: "white",
              fontSize: 14,
            }}
          />
        </div>

        <div>
          <label
            style={{
              display: "block",
              opacity: 0.8,
              fontSize: 13,
              marginBottom: 6,
            }}
          >
            Key
          </label>
          <select
            value={settings.keyRoot}
            onChange={(e) => onKeyRootChange(e.target.value as Note)}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 12,
              background: "#1f1f1f",
              color: "white",
            }}
          >
            {NOTES.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            style={{
              display: "block",
              opacity: 0.8,
              fontSize: 13,
              marginBottom: 6,
            }}
          >
            Scale
          </label>
          <select
            value={settings.scaleName}
            onChange={(e) => onScaleNameChange(e.target.value as ScaleName)}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: 12,
              background: "#1f1f1f",
              color: "white",
            }}
          >
            <option value="Major">Major</option>
            <option value="Natural Minor">Natural Minor</option>
          </select>
        </div>

        <div>
          <label
            style={{
              display: "block",
              opacity: 0.8,
              fontSize: 13,
              marginBottom: 6,
            }}
          >
            Tempo (BPM)
          </label>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button
              onClick={onTempoMinus}
              style={{
                padding: "10px 16px",
                borderRadius: 10,
                border: 0,
                cursor: "pointer",
                fontWeight: 600,
                background: "rgba(255, 255, 255, 0.1)",
                color: "white",
                fontSize: 18,
                transition: "all 0.2s",
              }}
            >
              −
            </button>

            <input
              type="number"
              value={settings.bpm}
              onChange={(e) =>
                onBpmChange(
                  Math.max(40, Math.min(240, parseInt(e.target.value || "0", 10)))
                )
              }
              style={{
                width: 110,
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "#1f1f1f",
                color: "white",
              }}
            />

            <button
              onClick={onTempoPlus}
              style={{
                padding: "10px 16px",
                borderRadius: 10,
                border: 0,
                cursor: "pointer",
                fontWeight: 600,
                background: "rgba(255, 255, 255, 0.1)",
                color: "white",
                fontSize: 18,
                transition: "all 0.2s",
              }}
            >
              +
            </button>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 12,
          marginTop: 12,
        }}
      >
        <div>
          <label
            style={{
              display: "block",
              opacity: 0.8,
              fontSize: 13,
              marginBottom: 6,
            }}
          >
            Time signature
          </label>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {(["4/4", "3/3", "2/2"] as TimeSig[]).map((sig) => {
              const active = sig === settings.timeSig;
              return (
                <button
                  key={sig}
                  onClick={() => onTimeSigChange(sig)}
                  style={{
                    padding: "10px 16px",
                    borderRadius: 10,
                    border: active
                      ? "2px solid rgba(255, 140, 66, 0.6)"
                      : "1px solid rgba(255,255,255,0.15)",
                    background: active 
                      ? "#ff8c42" 
                      : "rgba(0,0,0,0.3)",
                    color: "white",
                    cursor: "pointer",
                    fontWeight: 600,
                    minWidth: 80,
                    fontSize: 14,
                    transition: "all 0.2s",
                  }}
                >
                  {sig}
                </button>
              );
            })}
          </div>
          <div style={{ marginTop: 6, opacity: 0.65, fontSize: 12 }}>
            Slots per bar = {slotCount}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", gap: 10 }}>
          <button
            onClick={onLoadGuitar}
              style={{
                padding: "12px 14px",
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.15)",
                cursor: "pointer",
                fontWeight: 600,
                background: guitarLoaded ? "rgba(255, 140, 66, 0.2)" : "rgba(0,0,0,0.3)",
                width: "100%",
                transition: "all 0.2s",
              }}
          >
            {guitarLoaded ? "Guitar Loaded" : "Load Guitar"}
          </button>

          <button
            onClick={onPlayArrangement}
              style={{
                padding: "12px 14px",
                borderRadius: 10,
                border: 0,
                cursor: "pointer",
                fontWeight: 700,
                width: "100%",
                background: isPlaying 
                  ? "#dc2626" 
                  : "#ff8c42",
                transition: "all 0.2s",
              }}
            title={isPlaying ? "Stop playback" : "Plays your full arranged track"}
          >
            {isPlaying ? "⏹ Stop" : "▶ Play Track"}
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "flex-end" }}>
          <button
            onClick={onClearArrangement}
            style={{
              padding: "12px 14px",
              borderRadius: 12,
              border: "1px solid rgba(255,255,255,0.12)",
              cursor: "pointer",
              fontWeight: 800,
              background: "#1f1f1f",
              width: "100%",
            }}
          >
            Clear Arrangement
          </button>
        </div>
      </div>
    </div>
  );
}

