import type { Phrase, ArrangementItem } from "../types/track";

type ArrangementViewProps = {
  arrangement: ArrangementItem[];
  phrases: Phrase[];
  onMoveItem: (index: number, dir: -1 | 1) => void;
  onRemoveItem: (id: string) => void;
  onPlayArrangement: () => void;
  isPlaying: boolean;
};

export function ArrangementView({
  arrangement,
  phrases,
  onMoveItem,
  onRemoveItem,
  onPlayArrangement,
  isPlaying,
}: ArrangementViewProps) {
  return (
    <div style={{ 
      background: "rgba(42, 42, 42, 0.6)", 
      backdropFilter: "blur(10px)",
      border: "1px solid rgba(255, 255, 255, 0.1)",
      borderRadius: 20, 
      padding: 20 
    }}>
      <p style={{ marginTop: 0, opacity: 0.7, fontSize: 13, lineHeight: 1.5 }}>
        Add progressions to build your song. Reorder them to create your arrangement.
      </p>

      {arrangement.length === 0 ? (
        <div
          style={{
            marginTop: 16,
            padding: 24,
            borderRadius: 12,
            background: "rgba(0,0,0,0.2)",
            opacity: 0.8,
            textAlign: "center",
            fontSize: 13,
          }}
        >
          No arrangement yet. Select a phrase and click "Add to Arrangement".
        </div>
      ) : (
        <div
          style={{
            marginTop: 12,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          {arrangement.map((item, idx) => {
            const phrase = phrases.find((p) => p.id === item.phraseId);
            return (
                    <div
                      key={item.id}
                      style={{
                        background: "rgba(0,0,0,0.3)",
                        borderRadius: 12,
                        border: "1px solid rgba(255,255,255,0.1)",
                        padding: 14,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                        transition: "all 0.2s",
                      }}
                    >
                <div style={{ fontWeight: 600, fontSize: 14 }}>
                  <span style={{ opacity: 0.6, marginRight: 8 }}>{idx + 1}.</span>
                  {phrase ? phrase.name : "Missing phrase"}
                  {phrase && (
                    <span style={{ opacity: 0.5, fontWeight: 400, marginLeft: 8, fontSize: 12 }}>
                      {phrase.bars.length} bar{phrase.bars.length > 1 ? "s" : ""}
                    </span>
                  )}
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => onMoveItem(idx, -1)}
                        style={{
                          padding: "8px 12px",
                          borderRadius: 8,
                          border: "1px solid rgba(255,255,255,0.15)",
                          cursor: "pointer",
                          fontWeight: 600,
                          background: "rgba(0,0,0,0.2)",
                          color: "white",
                          fontSize: 14,
                          transition: "all 0.2s",
                        }}
                    title="Move up"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => onMoveItem(idx, 1)}
                        style={{
                          padding: "8px 12px",
                          borderRadius: 8,
                          border: "1px solid rgba(255,255,255,0.15)",
                          cursor: "pointer",
                          fontWeight: 600,
                          background: "rgba(0,0,0,0.2)",
                          color: "white",
                          fontSize: 14,
                          transition: "all 0.2s",
                        }}
                    title="Move down"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => onRemoveItem(item.id)}
                        style={{
                          padding: "8px 12px",
                          borderRadius: 8,
                          border: "1px solid rgba(255,255,255,0.15)",
                          cursor: "pointer",
                          background: "rgba(0,0,0,0.2)",
                          fontWeight: 600,
                          fontSize: 14,
                          transition: "all 0.2s",
                        }}
                    title="Remove"
                  >
                    ×
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
        <button
          onClick={onPlayArrangement}
          style={{
            padding: "12px 16px",
            borderRadius: 10,
            border: 0,
            cursor: "pointer",
            fontWeight: 600,
            width: "100%",
            background: isPlaying 
              ? "#dc2626" 
              : "#ff8c42",
            color: "white",
            fontSize: 14,
            transition: "all 0.2s",
          }}
          title={isPlaying ? "Stop playback" : "Play arrangement"}
        >
          {isPlaying ? "⏹ Stop" : "▶ Play Arrangement"}
        </button>
      </div>
    </div>
  );
}

