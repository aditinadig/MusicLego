import type { Chord } from "../types/music";

export function ChordPalette({
  title,
  chords,
  onAdd,
  variant = "primary",
}: {
  title: string;
  chords: Chord[];
  onAdd: (ch: Chord) => void;
  variant?: "primary" | "secondary";
}) {
  return (
    <div>
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        {chords.map((ch) => (
          <button
            key={ch.id}
            onClick={() => onAdd(ch)}
            style={{
              padding: "10px 14px",
              borderRadius: 999,
              border: variant === "secondary" ? "1px solid rgba(255,255,255,0.15)" : 0,
              cursor: "pointer",
              background: variant === "secondary" ? "#1f1f1f" : undefined,
              color: "white",
              fontWeight: 800,
            }}
          >
            {ch.label}
          </button>
        ))}
      </div>
    </div>
  );
}