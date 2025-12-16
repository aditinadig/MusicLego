import type { Phrase } from "../types/track";
import type { Chord } from "../types/music";
import type { PhrasePreset } from "../music/phrasePresets";
import { PHRASE_PRESETS } from "../music/phrasePresets";

type PhraseEditorProps = {
  phrase: Phrase | null;
  slotCount: number;
  timeSig: string;
  selectedSlot: { barIndex: number; slotIndex: number } | null;
  onSlotSelect: (barIndex: number, slotIndex: number) => void;
  onAddBar: () => void;
  onDeleteBar: (barIndex: number) => void;
  onDeleteChord: (barIndex: number, slotIndex: number) => void;
  onAuditionChord: (chord: Chord) => void;
  onPresetChange: (preset: PhrasePreset) => void;
  onEnsureLoaded: () => Promise<void>;
  onPlayPhrase: () => void;
  onAddToArrangement: () => void;
  isPlaying: boolean;
};

export function PhraseEditor({
  phrase,
  slotCount,
  timeSig,
  selectedSlot,
  onSlotSelect,
  onAddBar,
  onDeleteBar,
  onDeleteChord,
  onAuditionChord,
  onPresetChange,
  onEnsureLoaded,
  onPlayPhrase,
  onAddToArrangement,
  isPlaying,
}: PhraseEditorProps) {
  if (!phrase) {
    return (
      <div style={{ 
        background: "rgba(42, 42, 42, 0.6)", 
        backdropFilter: "blur(10px)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        borderRadius: 20, 
        padding: 20 
      }}>
        <div
          style={{
            padding: 24,
            borderRadius: 12,
            background: "rgba(0,0,0,0.2)",
            opacity: 0.8,
            textAlign: "center",
            fontSize: 14,
          }}
        >
          Select a progression above to start adding chords
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      background: "rgba(42, 42, 42, 0.6)", 
      backdropFilter: "blur(10px)",
      border: "1px solid rgba(255, 255, 255, 0.1)",
      borderRadius: 20, 
      padding: 20 
    }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 12,
          marginTop: 8,
        }}
      >
        <div>
          <h3 style={{ margin: 0 }}>{phrase.name}</h3>
          <p style={{ marginTop: 6, opacity: 0.75 }}>
            {timeSig} template • {slotCount} slots per bar • each slot = 4
            beats • {phrase.bars.length} bar(s)
          </p>
        </div>

        <button
          onClick={onAddBar}
          style={{
            padding: "10px 16px",
            borderRadius: 10,
            border: 0,
            cursor: "pointer",
            fontWeight: 600,
            background: "#ff8c42",
            color: "white",
            fontSize: 14,
            transition: "all 0.2s",
          }}
        >
          + Add Bar
        </button>
      </div>

      <div
        style={{
          marginTop: 14,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {phrase.bars.map((bar, barIndex) => (
          <div
            key={barIndex}
                    style={{
                      background: "rgba(0,0,0,0.3)",
                      borderRadius: 12,
                      border: "1px solid rgba(255,255,255,0.1)",
                      padding: 16,
                    }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 10,
              }}
            >
              <div style={{ opacity: 0.75, fontWeight: 800 }}>
                Bar {barIndex + 1}
              </div>

              <button
                onClick={() => onDeleteBar(barIndex)}
                disabled={phrase.bars.length === 1}
                style={{
                  padding: "8px 10px",
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.12)",
                  cursor:
                    phrase.bars.length === 1 ? "not-allowed" : "pointer",
                  fontWeight: 900,
                  background: "#2a2a2a",
                  opacity: phrase.bars.length === 1 ? 0.5 : 1,
                }}
                title={
                  phrase.bars.length === 1
                    ? "Keep at least 1 bar"
                    : "Delete this bar"
                }
              >
                Delete bar
              </button>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${slotCount}, minmax(0, 1fr))`,
                gap: 10,
              }}
            >
              {bar.map((slot, slotIndex) => {
                const isSelected = selectedSlot?.barIndex === barIndex && selectedSlot?.slotIndex === slotIndex;
                return (
                  <div
                    key={slotIndex}
                    onClick={() => onSlotSelect(barIndex, slotIndex)}
                    style={{
                      background: isSelected 
                        ? "rgba(255, 140, 66, 0.2)" 
                        : "rgba(0,0,0,0.3)",
                      borderRadius: 12,
                      border: isSelected
                        ? "2px solid rgba(255, 140, 66, 0.6)"
                        : "1px solid rgba(255,255,255,0.1)",
                      padding: 14,
                      minHeight: 80,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      gap: 10,
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    <div style={{ opacity: 0.6, fontSize: 12 }}>
                      Slot {slotIndex + 1}
                      {isSelected && <span style={{ marginLeft: 6, opacity: 0.8 }}>• Selected</span>}
                    </div>

                    {slot ? (
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        alignItems: "center",
                      }}
                    >
                      <button
                        onClick={() =>
                          onEnsureLoaded().then(() => onAuditionChord(slot))
                        }
                        style={{
                          padding: "10px 14px",
                          borderRadius: 10,
                          border: 0,
                          cursor: "pointer",
                          fontWeight: 600,
                          background: "#ff8c42",
                          color: "white",
                          flex: 1,
                          fontSize: 14,
                        }}
                        title="Tap to audition"
                      >
                        {slot.label}
                      </button>

                      <button
                        onClick={() => onDeleteChord(barIndex, slotIndex)}
                        style={{
                          padding: "10px 12px",
                          borderRadius: 8,
                          border: "1px solid rgba(255,255,255,0.15)",
                          cursor: "pointer",
                          background: "rgba(0,0,0,0.3)",
                          fontWeight: 600,
                          fontSize: 16,
                          transition: "all 0.2s",
                        }}
                        title="Delete this chord"
                      >
                        ×
                      </button>
                    </div>
                    ) : (
                      <div style={{ opacity: 0.55, fontSize: 13 }}>
                        {isSelected ? "Tap a chord to insert" : "Empty"}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginTop: 6,
        }}
      >
        <span style={{ fontSize: 13, opacity: 0.75 }}>Preset</span>

        <select
          value={phrase.preset}
          onChange={(e) => onPresetChange(e.target.value as PhrasePreset)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 8,
                      background: "rgba(0,0,0,0.3)",
                      color: "white",
                      border: "1px solid rgba(255,255,255,0.15)",
                      fontWeight: 500,
                      fontSize: 13,
                    }}
        >
          {Object.entries(PHRASE_PRESETS).map(([k, label]) => (
            <option key={k} value={k}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
        <button
          onClick={onAddToArrangement}
          style={{
            padding: "12px 16px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.15)",
            cursor: "pointer",
            fontWeight: 500,
            background: "rgba(0,0,0,0.2)",
            color: "white",
            flex: 1,
            fontSize: 14,
            transition: "all 0.2s",
          }}
        >
          + Add to Arrangement
        </button>

        <button
          onClick={onPlayPhrase}
          style={{
            padding: "12px 16px",
            borderRadius: 10,
            border: 0,
            cursor: "pointer",
            fontWeight: 600,
            background: isPlaying 
              ? "#dc2626" 
              : "#ff8c42",
            color: "white",
            flex: 1,
            fontSize: 14,
            transition: "all 0.2s",
          }}
          title={isPlaying ? "Stop playback" : "Play this phrase"}
        >
          {isPlaying ? "⏹ Stop" : "▶ Play Phrase"}
        </button>
      </div>

      <div style={{ marginTop: 12, opacity: 0.7, fontSize: 13 }}>
        Tip: keep tapping chords. If all bars fill up, we auto-add a new bar.
      </div>
    </div>
  );
}

