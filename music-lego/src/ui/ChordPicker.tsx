import type { Chord, Note, ScaleName } from "../types/music";

type ChordPickerProps = {
  keyRoot: Note;
  scaleName: ScaleName;
  scaleChords: Chord[];
  allChords: Chord[];
  showAllChords: boolean;
  onChordPick: (chord: Chord) => void;
  onToggleShowAll: () => void;
};

export function ChordPicker({
  keyRoot,
  scaleName,
  scaleChords,
  allChords,
  showAllChords,
  onChordPick,
  onToggleShowAll,
}: ChordPickerProps) {
  return (
    <div style={{ 
      background: "rgba(42, 42, 42, 0.6)", 
      backdropFilter: "blur(10px)",
      border: "1px solid rgba(255, 255, 255, 0.1)",
      borderRadius: 20, 
      padding: 20 
    }}>
      <h2 style={{ fontSize: 18, margin: 0, fontWeight: 600, letterSpacing: "-0.2px" }}>Chords</h2>
      <p style={{ marginTop: 8, opacity: 0.7, fontSize: 13, lineHeight: 1.5 }}>
        Tap to hear • Click a slot, then tap a chord to place it
      </p>

      <h3 style={{ marginTop: 16, marginBottom: 12, fontSize: 14, fontWeight: 500, opacity: 0.9, textTransform: "uppercase", letterSpacing: "0.5px" }}>
        {keyRoot} {scaleName}
      </h3>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {scaleChords.map((ch) => (
          <button
            key={ch.id}
            onClick={() => onChordPick(ch)}
            style={{
              padding: "12px 18px",
              borderRadius: 12,
              border: 0,
              cursor: "pointer",
              fontWeight: 700,
              background: "#ff8c42",
              color: "white",
              fontSize: 15,
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            {ch.label}
          </button>
        ))}
      </div>

      <button
        onClick={onToggleShowAll}
        style={{
          marginTop: 16,
          padding: "8px 12px",
          borderRadius: 8,
          border: "1px solid rgba(255,255,255,0.15)",
          cursor: "pointer",
          fontWeight: 500,
          background: "rgba(0,0,0,0.2)",
          color: "white",
          fontSize: 12,
          width: "100%",
          transition: "all 0.2s",
        }}
      >
        {showAllChords ? "▼ Hide" : "▶ Show"} all chords
      </button>

      {showAllChords && (
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 500, opacity: 0.9, marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.5px" }}>All Triads</h3>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 6,
              maxHeight: "300px",
              overflowY: "auto",
            }}
          >
            {allChords.map((ch) => (
              <button
                key={ch.id}
                onClick={() => onChordPick(ch)}
                style={{
                  padding: "8px 14px",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontWeight: 500,
                  background: "rgba(0,0,0,0.3)",
                  color: "white",
                  border: "1px solid rgba(255,255,255,0.1)",
                  fontSize: 13,
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255, 140, 66, 0.2)";
                  e.currentTarget.style.borderColor = "rgba(255, 140, 66, 0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(0,0,0,0.3)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                }}
              >
                {ch.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

