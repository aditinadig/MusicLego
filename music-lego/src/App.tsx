import { useMemo, useState } from "react";
import { buildAllTriads, buildDiatonicChords } from "./music/theory";
import type { Chord, Note, ScaleName } from "./types/music";
import { GuitarWavEngine } from "./audio/guitarWavEngine";
import { generatePhraseEvents, PHRASE_PRESETS } from "./music/phrasePresets";
import type { PhrasePreset } from "./music/phrasePresets";

type TimeSig = "4/4" | "3/3" | "2/2";

function beatsForTimeSig(sig: TimeSig) {
  if (sig === "4/4") return 4;
  if (sig === "3/3") return 3;
  return 2;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

type Phrase = {
  id: string;
  name: string;
  preset: PhrasePreset;
  bars: (Chord | null)[][];
};

type ArrangementItem = {
  id: string; // instance id
  phraseId: string;
};

function compactBar(bar: (Chord | null)[]) {
  const only = bar.filter((x): x is Chord => x !== null);
  const out: (Chord | null)[] = [...only];
  while (out.length < bar.length) out.push(null);
  return out;
}

export default function App() {
  const engine = useMemo(() => new GuitarWavEngine(), []);
  const [guitarLoaded, setGuitarLoaded] = useState(false);

  // Track (global) settings
  const [trackName, setTrackName] = useState("");
  const [keyRoot, setKeyRoot] = useState<Note>("C");
  const [scaleName, setScaleName] = useState<ScaleName>("Major");
  const [bpm, setBpm] = useState(90);
  const [timeSig, setTimeSig] = useState<TimeSig>("4/4");

  const slotCount = beatsForTimeSig(timeSig);

  // Chord palette
  const [showAllChords, setShowAllChords] = useState(false);
  const scaleChords = useMemo(
    () => buildDiatonicChords(keyRoot, scaleName),
    [keyRoot, scaleName]
  );
  const allChords = useMemo(() => buildAllTriads(), []);

  // Phrases
  const [phrases, setPhrases] = useState<Phrase[]>([]);
  const [newPhraseName, setNewPhraseName] = useState("");
  const [selectedPhraseId, setSelectedPhraseId] = useState<string | null>(null);

  // Arrangement (song order)
  const [arrangement, setArrangement] = useState<ArrangementItem[]>([]);

  async function ensureGuitar() {
    await engine.load();
    setGuitarLoaded(true);
  }

  function tempoMinus() {
    setBpm((v) => clamp(v - 1, 40, 240));
  }
  function tempoPlus() {
    setBpm((v) => clamp(v + 1, 40, 240));
  }

  function createPhrase() {
    const name = newPhraseName.trim();
    if (!name) {
      alert("Please enter a phrase name (e.g., Verse, Chorus).");
      return;
    }

    const id = crypto.randomUUID();
    const emptyBar = Array(slotCount).fill(null) as (Chord | null)[];
    const phrase: Phrase = {
      id,
      name,
      preset: "SUSTAIN_PAD",
      bars: [emptyBar],
    };

    setPhrases((p) => [phrase, ...p]);
    setSelectedPhraseId(id);
    setNewPhraseName("");
  }

  function addBarToSelectedPhrase() {
    if (!selectedPhraseId) return;

    setPhrases((prev) =>
      prev.map((ph) => {
        if (ph.id !== selectedPhraseId) return ph;
        const emptyBar = Array(slotCount).fill(null) as (Chord | null)[];
        return { ...ph, bars: [...ph.bars, emptyBar] };
      })
    );
  }

  function setSelectedPhraseBars(nextBars: (Chord | null)[][]) {
    if (!selectedPhraseId) return;
    setPhrases((prev) =>
      prev.map((ph) =>
        ph.id === selectedPhraseId ? { ...ph, bars: nextBars } : ph
      )
    );
  }

  const selectedPhrase = useMemo(
    () => phrases.find((p) => p.id === selectedPhraseId) || null,
    [phrases, selectedPhraseId]
  );

  async function onChordPick(ch: Chord) {
    // audition always
    await ensureGuitar();

    const inst: Chord = { ...ch, id: `${ch.id}-inst-${crypto.randomUUID()}` };
    engine.playChord(inst);

    if (!selectedPhrase) return;

    // Fill next available slot across bars, left->right
    const bars = selectedPhrase.bars.map((bar) => [...bar]);

    for (let b = 0; b < bars.length; b++) {
      const idx = bars[b].findIndex((x) => x === null);
      if (idx !== -1) {
        bars[b][idx] = inst;
        setSelectedPhraseBars(bars);
        return;
      }
    }

    // If everything is full, optionally add a new bar automatically
    // (Feels natural for users)
    const emptyBar = Array(slotCount).fill(null) as (Chord | null)[];
    emptyBar[0] = inst;
    setSelectedPhraseBars([...bars, emptyBar]);
  }

  function deleteChordInBar(barIndex: number, slotIndex: number) {
    if (!selectedPhrase) return;

    const bars = selectedPhrase.bars.map((bar) => [...bar]);
    bars[barIndex][slotIndex] = null;
    bars[barIndex] = compactBar(bars[barIndex]); // keep ascending order within bar
    setSelectedPhraseBars(bars);
  }

  function deleteBar(barIndex: number) {
    if (!selectedPhrase) return;
    if (selectedPhrase.bars.length === 1) return; // keep at least 1 bar

    const bars = selectedPhrase.bars.filter((_, i) => i !== barIndex);
    setSelectedPhraseBars(bars);
  }

  function addSelectedPhraseToArrangement() {
    if (!selectedPhraseId) {
      alert("Select a phrase first.");
      return;
    }
    setArrangement((a) => [
      ...a,
      { id: crypto.randomUUID(), phraseId: selectedPhraseId },
    ]);
  }

  function moveArrangementItem(index: number, dir: -1 | 1) {
    setArrangement((prev) => {
      const next = [...prev];
      const j = index + dir;
      if (j < 0 || j >= next.length) return prev;
      const tmp = next[index];
      next[index] = next[j];
      next[j] = tmp;
      return next;
    });
  }

  function removeArrangementItem(id: string) {
    setArrangement((prev) => prev.filter((x) => x.id !== id));
  }

  function changeTimeSig(sig: TimeSig) {
    setTimeSig(sig);

    // Important: time signature controls slot template length.
    // For now we reset bars in every phrase to match new slot count.
    // (Later we can implement a smarter conversion.)
    const newSlots = beatsForTimeSig(sig);

    setPhrases((prev) =>
      prev.map((ph) => ({
        ...ph,
        bars: ph.bars.map((bar) => {
          const resized = bar.slice(0, newSlots);
          while (resized.length < newSlots) resized.push(null);
          return resized;
        }),
      }))
    );
  }

  function playPhrase(phrase: Phrase, startOffsetSec: number) {
    const secPerBeat = 60 / bpm;
    const slotDuration = 2 * secPerBeat;
    const barSec = slotCount * slotDuration;

    let offset = startOffsetSec;

    for (const bar of phrase.bars) {
      let slotOffset = 0;

      for (const slot of bar) {
        if (slot) {
          const events = generatePhraseEvents(
            phrase.preset,
            slot,
            slotDuration
          );
          for (const ev of events) {
            engine.playMidi(ev.midi, offset + slotOffset + ev.timeOffset);
          }
        }
        slotOffset += slotDuration;
      }
      offset += barSec;
    }

    return offset;
  }

  async function playArrangement() {
    if (arrangement.length === 0) {
      alert("Add phrases to arrangement first.");
      return;
    }
    await ensureGuitar();

    let offset = 0;

    for (const item of arrangement) {
      const phrase = phrases.find((p) => p.id === item.phraseId);
      if (!phrase) continue;
      offset = await playPhrase(phrase, offset);
    }
  }

  async function playSelectedPhrase() {
    if (!selectedPhrase) return;
    await ensureGuitar();
    await playPhrase(selectedPhrase, 0);
  }

  return (
    <div
      style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: 18,
        color: "white",
        fontFamily: "system-ui",
      }}
    >
      <h1 style={{ margin: 0 }}>Chord Progression Maker (Guitar WAV)</h1>
      <p style={{ marginTop: 8, opacity: 0.8 }}>
        Create multiple phrases (verse/chorus), fill bars using a slot template,
        and arrange them into a full track.
      </p>

      {/* TRACK SETUP */}
      <div
        style={{
          marginTop: 16,
          background: "#2a2a2a",
          borderRadius: 16,
          padding: 14,
        }}
      >
        <h2 style={{ fontSize: 18, margin: 0 }}>Track setup</h2>

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
              value={trackName}
              onChange={(e) => setTrackName(e.target.value)}
              placeholder="e.g., My song"
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.12)",
                background: "#1f1f1f",
                color: "white",
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
              value={keyRoot}
              onChange={(e) => setKeyRoot(e.target.value as Note)}
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: 12,
                background: "#1f1f1f",
                color: "white",
              }}
            >
              {[
                "C",
                "C#",
                "D",
                "D#",
                "E",
                "F",
                "F#",
                "G",
                "G#",
                "A",
                "A#",
                "B",
              ].map((n) => (
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
              value={scaleName}
              onChange={(e) => setScaleName(e.target.value as ScaleName)}
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
                onClick={tempoMinus}
                style={{
                  padding: "10px 14px",
                  borderRadius: 12,
                  border: 0,
                  cursor: "pointer",
                  fontWeight: 900,
                }}
              >
                −
              </button>

              <input
                type="number"
                value={bpm}
                onChange={(e) =>
                  setBpm(clamp(parseInt(e.target.value || "0", 10), 40, 240))
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
                onClick={tempoPlus}
                style={{
                  padding: "10px 14px",
                  borderRadius: 12,
                  border: 0,
                  cursor: "pointer",
                  fontWeight: 900,
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
                const active = sig === timeSig;
                return (
                  <button
                    key={sig}
                    onClick={() => changeTimeSig(sig)}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 12,
                      border: active
                        ? "2px solid rgba(255,255,255,0.35)"
                        : "1px solid rgba(255,255,255,0.12)",
                      background: active ? "#ff6b4a" : "#1f1f1f",
                      color: "white",
                      cursor: "pointer",
                      fontWeight: 800,
                      minWidth: 80,
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
              onClick={() => ensureGuitar()}
              style={{
                padding: "12px 14px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.12)",
                cursor: "pointer",
                fontWeight: 800,
                background: guitarLoaded ? "#3a3a3a" : "#1f1f1f",
                width: "100%",
              }}
            >
              {guitarLoaded ? "Guitar Loaded" : "Load Guitar"}
            </button>

            <button
              onClick={playArrangement}
              style={{
                padding: "12px 14px",
                borderRadius: 12,
                border: 0,
                cursor: "pointer",
                fontWeight: 900,
                width: "100%",
              }}
              title="Plays your full arranged track"
            >
              ▶ Play Track
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "flex-end" }}>
            <button
              onClick={() => setArrangement([])}
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

      {/* MAIN AREA */}
      <div
        style={{
          marginTop: 16,
          display: "grid",
          gridTemplateColumns: "1fr 1.2fr",
          gap: 18,
        }}
      >
        {/* LEFT: phrases + chord picker */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Phrases list */}
          <div style={{ background: "#2a2a2a", borderRadius: 16, padding: 14 }}>
            <h2 style={{ fontSize: 18, margin: 0 }}>Phrases</h2>
            <p style={{ marginTop: 6, opacity: 0.75 }}>
              Create multiple chord progressions (Verse, Chorus, Bridge).
            </p>

            <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
              <input
                value={newPhraseName}
                onChange={(e) => setNewPhraseName(e.target.value)}
                placeholder="New phrase name..."
                style={{
                  flex: 1,
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "#1f1f1f",
                  color: "white",
                }}
              />
              <button
                onClick={createPhrase}
                style={{
                  padding: "10px 14px",
                  borderRadius: 12,
                  border: 0,
                  cursor: "pointer",
                  fontWeight: 900,
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
                  No phrases yet. Add “Verse” or “Chorus”.
                </div>
              ) : (
                phrases.map((p) => {
                  const active = p.id === selectedPhraseId;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPhraseId(p.id)}
                      style={{
                        textAlign: "left",
                        padding: "12px 12px",
                        borderRadius: 14,
                        border: active
                          ? "2px solid rgba(255,255,255,0.35)"
                          : "1px solid rgba(255,255,255,0.12)",
                        background: active ? "#1f1f1f" : "#2a2a2a",
                        cursor: "pointer",
                        fontWeight: 800,
                      }}
                    >
                      {p.name}{" "}
                      <span style={{ opacity: 0.65, fontWeight: 600 }}>
                        ({p.bars.length} bar{p.bars.length > 1 ? "s" : ""})
                      </span>
                    </button>
                  );
                })
              )}
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
              <button
                onClick={addSelectedPhraseToArrangement}
                style={{
                  padding: "10px 14px",
                  borderRadius: 12,
                  border: 0,
                  cursor: "pointer",
                  fontWeight: 900,
                  width: "100%",
                }}
              >
                + Add to Arrangement
              </button>

              <button
                onClick={playSelectedPhrase}
                style={{
                  padding: "10px 14px",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.12)",
                  cursor: "pointer",
                  fontWeight: 900,
                  background: "#1f1f1f",
                  width: "100%",
                }}
                disabled={!selectedPhrase}
                title="Plays the currently selected phrase"
              >
                ▶ Play Phrase
              </button>
            </div>
          </div>

          {/* Chord picker */}
          <div style={{ background: "#2a2a2a", borderRadius: 16, padding: 14 }}>
            <h2 style={{ fontSize: 18, margin: 0 }}>Chord picker</h2>
            <p style={{ marginTop: 6, opacity: 0.75 }}>
              Tap a chord to hear it. If a phrase is selected, it also fills the
              next slot.
            </p>

            <h3 style={{ marginTop: 12, marginBottom: 8, fontSize: 16 }}>
              Chords in {keyRoot} {scaleName}
            </h3>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {scaleChords.map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => onChordPick(ch)}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 999,
                    border: 0,
                    cursor: "pointer",
                    fontWeight: 900,
                    background: "#ff6b4a",
                    color: "white",
                  }}
                >
                  {ch.label}
                </button>
              ))}
            </div>

            <div
              style={{
                marginTop: 16,
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <button
                onClick={() => setShowAllChords((v) => !v)}
                style={{
                  padding: "10px 14px",
                  borderRadius: 12,
                  border: 0,
                  cursor: "pointer",
                  fontWeight: 900,
                }}
              >
                {showAllChords ? "Hide" : "Show"} all chords
              </button>
              <span style={{ opacity: 0.75, fontSize: 13 }}>
                Outside-the-scale chords.
              </span>
            </div>

            {showAllChords && (
              <div style={{ marginTop: 12 }}>
                <h3 style={{ margin: 0, fontSize: 16 }}>All triads</h3>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 10,
                    marginTop: 10,
                  }}
                >
                  {allChords.map((ch) => (
                    <button
                      key={ch.id}
                      onClick={() => onChordPick(ch)}
                      style={{
                        padding: "10px 14px",
                        borderRadius: 999,
                        cursor: "pointer",
                        fontWeight: 800,
                        background: "#1f1f1f",
                        color: "white",
                        border: "1px solid rgba(255,255,255,0.12)",
                      }}
                    >
                      {ch.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: phrase editor + arrangement */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Phrase editor */}
          <div style={{ background: "#2a2a2a", borderRadius: 16, padding: 14 }}>
            <h2 style={{ fontSize: 18, margin: 0 }}>Phrase editor</h2>

            {!selectedPhrase ? (
              <div
                style={{
                  marginTop: 12,
                  padding: 14,
                  borderRadius: 14,
                  background: "#1f1f1f",
                  opacity: 0.85,
                }}
              >
                Select a phrase to start filling bars.
              </div>
            ) : (
              <>
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
                    <h3 style={{ margin: 0 }}>{selectedPhrase.name}</h3>
                    <p style={{ marginTop: 6, opacity: 0.75 }}>
                      {timeSig} template • {slotCount} slots per bar • each slot
                      = 2 beats • {selectedPhrase.bars.length} bar(s)
                    </p>
                  </div>

                  <button
                    onClick={addBarToSelectedPhrase}
                    style={{
                      padding: "10px 14px",
                      borderRadius: 12,
                      border: 0,
                      cursor: "pointer",
                      fontWeight: 900,
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
                  {selectedPhrase.bars.map((bar, barIndex) => (
                    <div
                      key={barIndex}
                      style={{
                        background: "#1f1f1f",
                        borderRadius: 14,
                        border: "1px solid rgba(255,255,255,0.12)",
                        padding: 12,
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
                          onClick={() => deleteBar(barIndex)}
                          disabled={selectedPhrase.bars.length === 1}
                          style={{
                            padding: "8px 10px",
                            borderRadius: 10,
                            border: "1px solid rgba(255,255,255,0.12)",
                            cursor:
                              selectedPhrase.bars.length === 1
                                ? "not-allowed"
                                : "pointer",
                            fontWeight: 900,
                            background: "#2a2a2a",
                            opacity: selectedPhrase.bars.length === 1 ? 0.5 : 1,
                          }}
                          title={
                            selectedPhrase.bars.length === 1
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
                        {bar.map((slot, slotIndex) => (
                          <div
                            key={slotIndex}
                            style={{
                              background: "#2a2a2a",
                              borderRadius: 14,
                              border: "1px solid rgba(255,255,255,0.10)",
                              padding: 12,
                              minHeight: 72,
                              display: "flex",
                              flexDirection: "column",
                              justifyContent: "space-between",
                              gap: 10,
                            }}
                          >
                            <div style={{ opacity: 0.6, fontSize: 12 }}>
                              Slot {slotIndex + 1}
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
                                    ensureGuitar().then(() =>
                                      engine.playChord(slot)
                                    )
                                  }
                                  style={{
                                    padding: "10px 12px",
                                    borderRadius: 999,
                                    border: 0,
                                    cursor: "pointer",
                                    fontWeight: 900,
                                    background: "#ff6b4a",
                                    color: "white",
                                    flex: 1,
                                  }}
                                  title="Tap to audition"
                                >
                                  {slot.label}
                                </button>

                                <button
                                  onClick={() =>
                                    deleteChordInBar(barIndex, slotIndex)
                                  }
                                  style={{
                                    padding: "10px 12px",
                                    borderRadius: 12,
                                    border: "1px solid rgba(255,255,255,0.12)",
                                    cursor: "pointer",
                                    background: "#1f1f1f",
                                    fontWeight: 900,
                                  }}
                                  title="Delete this chord"
                                >
                                  ×
                                </button>
                              </div>
                            ) : (
                              <div style={{ opacity: 0.55, fontSize: 13 }}>
                                Empty
                              </div>
                            )}
                          </div>
                        ))}
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
                    value={selectedPhrase.preset}
                    onChange={(e) => {
                      const preset = e.target.value as PhrasePreset;
                      setPhrases((prev) =>
                        prev.map((p) =>
                          p.id === selectedPhrase.id ? { ...p, preset } : p
                        )
                      );
                    }}
                    style={{
                      padding: "8px 10px",
                      borderRadius: 10,
                      background: "#1f1f1f",
                      color: "white",
                      border: "1px solid rgba(255,255,255,0.15)",
                      fontWeight: 700,
                    }}
                  >
                    {Object.entries(PHRASE_PRESETS).map(([k, label]) => (
                      <option key={k} value={k}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ marginTop: 12, opacity: 0.7, fontSize: 13 }}>
                  Tip: keep tapping chords. If all bars fill up, we auto-add a
                  new bar.
                </div>
              </>
            )}
          </div>

          {/* Arrangement */}
          <div style={{ background: "#2a2a2a", borderRadius: 16, padding: 14 }}>
            <h2 style={{ fontSize: 18, margin: 0 }}>Arrangement</h2>
            <p style={{ marginTop: 6, opacity: 0.75 }}>
              This is the final track order. Add phrases and reorder them.
            </p>

            {arrangement.length === 0 ? (
              <div
                style={{
                  marginTop: 12,
                  padding: 14,
                  borderRadius: 14,
                  background: "#1f1f1f",
                  opacity: 0.85,
                }}
              >
                No arrangement yet. Select a phrase and click “Add to
                Arrangement”.
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
                        background: "#1f1f1f",
                        borderRadius: 14,
                        border: "1px solid rgba(255,255,255,0.12)",
                        padding: 12,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                      }}
                    >
                      <div style={{ fontWeight: 900 }}>
                        {idx + 1}. {phrase ? phrase.name : "Missing phrase"}
                        {phrase && (
                          <span style={{ opacity: 0.65, fontWeight: 700 }}>
                            {" "}
                            • {phrase.bars.length} bar(s)
                          </span>
                        )}
                      </div>

                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={() => moveArrangementItem(idx, -1)}
                          style={{
                            padding: "10px 12px",
                            borderRadius: 12,
                            border: 0,
                            cursor: "pointer",
                            fontWeight: 900,
                          }}
                          title="Move up"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => moveArrangementItem(idx, 1)}
                          style={{
                            padding: "10px 12px",
                            borderRadius: 12,
                            border: 0,
                            cursor: "pointer",
                            fontWeight: 900,
                          }}
                          title="Move down"
                        >
                          ↓
                        </button>
                        <button
                          onClick={() => removeArrangementItem(item.id)}
                          style={{
                            padding: "10px 12px",
                            borderRadius: 12,
                            border: "1px solid rgba(255,255,255,0.12)",
                            cursor: "pointer",
                            background: "#2a2a2a",
                            fontWeight: 900,
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
                onClick={playArrangement}
                style={{
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: 0,
                  cursor: "pointer",
                  fontWeight: 900,
                  width: "100%",
                }}
              >
                ▶ Play Arrangement
              </button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 14, opacity: 0.6, fontSize: 12 }}>
        Note: each slot equals 2 beats (each visual bar = 2 real bars). Chords
        sustain fully and overlap. Next step: add rhythmic patterns + piano roll
        per chord.
      </div>
    </div>
  );
}
