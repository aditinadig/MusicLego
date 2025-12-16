import type { Phrase } from "../types/track";

type PhrasesListProps = {
  phrases: Phrase[];
  selectedPhraseId: string | null;
  newPhraseName: string;
  onPhraseNameChange: (name: string) => void;
  onPhraseSelect: (id: string) => void;
  onCreatePhrase: () => void;
};

export function PhrasesList({
  phrases,
  selectedPhraseId,
  newPhraseName,
  onPhraseNameChange,
  onPhraseSelect,
  onCreatePhrase,
}: PhrasesListProps) {
  return (
    <div style={{ 
      background: "rgba(42, 42, 42, 0.6)", 
      backdropFilter: "blur(10px)",
      border: "1px solid rgba(255, 255, 255, 0.1)",
      borderRadius: 20, 
      padding: 20 
    }}>
      <p style={{ marginTop: 0, opacity: 0.7, fontSize: 13, lineHeight: 1.5 }}>
        Create a new progression or select an existing one to edit
      </p>

      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <input
          value={newPhraseName}
          onChange={(e) => onPhraseNameChange(e.target.value)}
          placeholder="e.g., Verse, Chorus, Bridge..."
          style={{
            flex: 1,
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(0,0,0,0.3)",
            color: "white",
            fontSize: 14,
          }}
        />
        <button
          onClick={onCreatePhrase}
          style={{
            padding: "10px 16px",
            borderRadius: 10,
            border: 0,
            cursor: "pointer",
            fontWeight: 600,
            background: "#ff8c42",
            color: "white",
            fontSize: 14,
          }}
        >
          + Add
        </button>
      </div>

      <div
        style={{
          marginTop: 12,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {phrases.length === 0 ? (
          <div
            style={{
              opacity: 0.7,
              padding: 10,
              background: "#1f1f1f",
              borderRadius: 12,
            }}
          >
            No phrases yet. Add "Verse" or "Chorus".
          </div>
        ) : (
          phrases.map((p) => {
            const active = p.id === selectedPhraseId;
            return (
              <button
                key={p.id}
                onClick={() => onPhraseSelect(p.id)}
                style={{
                  textAlign: "left",
                  padding: "14px 16px",
                  borderRadius: 12,
                  border: active
                    ? "2px solid rgba(255, 140, 66, 0.6)"
                    : "1px solid rgba(255,255,255,0.1)",
                  background: active 
                    ? "rgba(255, 140, 66, 0.15)" 
                    : "rgba(0,0,0,0.2)",
                  cursor: "pointer",
                  fontWeight: active ? 600 : 500,
                  fontSize: 14,
                  transition: "all 0.2s",
                  width: "100%",
                }}
              >
                <span style={{ display: "block", marginBottom: 4 }}>{p.name}</span>
                <span style={{ opacity: 0.6, fontWeight: 400, fontSize: 12 }}>
                  {p.bars.length} bar{p.bars.length > 1 ? "s" : ""}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

