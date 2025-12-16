import { useMemo, useState } from "react";

import { buildAllTriads, buildDiatonicChords } from "./music/theory";
import type { Chord, Note, ScaleName } from "./types/music";

import { GuitarWavEngine } from "./audio/guitarWavEngine";

type TimeSig = "4/4" | "3/3" | "2/2";

function beatsForTimeSig(sig: TimeSig) {
  if (sig === "4/4") return 4;
  if (sig === "3/3") return 3;
  return 2; // 2/2
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export default function App() {
  // Audio engine once
  const engine = useMemo(() => new GuitarWavEngine(), []);
  const [guitarLoaded, setGuitarLoaded] = useState(false);

  // Setup fields
  const [progressionName, setProgressionName] = useState("");
  const [keyRoot, setKeyRoot] = useState<Note>("C");
  const [scaleName, setScaleName] = useState<ScaleName>("Major");
  const [bpm, setBpm] = useState(90);
  const [timeSig, setTimeSig] = useState<TimeSig>("4/4");

  // UI toggles
  const [showAllChords, setShowAllChords] = useState(false);

  // Created progression state
  const [created, setCreated] = useState(false);

  // Slots: fixed length based on time signature
  const slotCount = beatsForTimeSig(timeSig);

  // We store chord instances so duplicates are allowed
  const [slots, setSlots] = useState<(Chord | null)[]>(
    Array(slotCount).fill(null)
  );

  // Rebuild chords when key/scale changes
  const scaleChords = useMemo(
    () => buildDiatonicChords(keyRoot, scaleName),
    [keyRoot, scaleName]
  );
  const allChords = useMemo(() => buildAllTriads(), []);

  // If user changes time signature AFTER creating, reset template to new size
  // (for now, simplest + predictable)
  function resetSlotsForSig(sig: TimeSig) {
    const count = beatsForTimeSig(sig);
    setSlots(Array(count).fill(null));
  }

  async function ensureGuitar() {
    await engine.load();
    setGuitarLoaded(true);
  }

  function compact(arr: (Chord | null)[]) {
    const only = arr.filter((x): x is Chord => x !== null);
    const out: (Chord | null)[] = [...only];
    while (out.length < arr.length) out.push(null);
    return out;
  }

  async function onChordPick(ch: Chord) {
    // Always audition, because user needs to hear
    await ensureGuitar();

    // Create an instance id so duplicates work
    const inst: Chord = { ...ch, id: `${ch.id}-inst-${crypto.randomUUID()}` };

    // Play the chord immediately
    engine.playChord(inst);

    // If not created yet, do nothing else (user is still in setup)
    if (!created) return;

    // Fill next available slot from left to right
    setSlots((prev) => {
      const next = [...prev];
      const idx = next.findIndex((x) => x === null);
      if (idx === -1) return prev; // full
      next[idx] = inst;
      return next;
    });
  }

  function deleteSlot(index: number) {
    setSlots((prev) => {
      const next = [...prev];
      next[index] = null;
      return compact(next); // keep ascending order (no gaps)
    });
  }

  async function createProgression() {
    // Basic validation
    const nameOk = progressionName.trim().length > 0;
    if (!nameOk) {
      alert("Please enter a chord progression name.");
      return;
    }

    await ensureGuitar(); // optional, but nice so audio works immediately

    setCreated(true);
    // reset slots (fresh template)
    setSlots(Array(slotCount).fill(null));
  }

  function tempoMinus() {
    setBpm((v) => clamp(v - 1, 40, 240));
  }
  function tempoPlus() {
    setBpm((v) => clamp(v + 1, 40, 240));
  }

  async function playSlotsAsOneBar() {
    // Plays the template from left to right, each slot = 1 beat (MVP)
    // IMPORTANT: we do NOT stop samples early. They sustain fully and overlap.
    await ensureGuitar();

    const secPerBeat = 60 / bpm;

    let offset = 0;
    for (const s of slots) {
      if (s) {
        // NO stopAtSec passed → sample plays for full WAV duration
        await engine.playChord(s, offset);
      }
      offset += secPerBeat;
    }
  }

  return (
    <div
      style={{
        maxWidth: 1050,
        margin: "0 auto",
        padding: 18,
        color: "white",
        fontFamily: "system-ui",
      }}
    >
      <h1 style={{ margin: 0 }}>Chord Progression Maker (Guitar WAV)</h1>
      <p style={{ marginTop: 8, opacity: 0.8 }}>
        Step 1: set name, key, scale, tempo, and time signature. Step 2: tap
        chords to fill the template.
      </p>

      {/* ---------- SETUP SECTION ---------- */}
      <div
        style={{
          marginTop: 16,
          background: "#2a2a2a",
          borderRadius: 16,
          padding: 14,
        }}
      >
        <h2 style={{ fontSize: 18, margin: 0 }}>
          1) Create a chord progression
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 1fr 1fr",
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
              Progression name
            </label>
            <input
              value={progressionName}
              onChange={(e) => setProgressionName(e.target.value)}
              placeholder="e.g., Verse, Chorus, Bridge..."
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
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 12,
            marginTop: 12,
          }}
        >
          {/* Tempo stepper */}
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
                aria-label="Tempo down"
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
                aria-label="Tempo up"
              >
                +
              </button>

              <span style={{ opacity: 0.8 }}>BPM</span>
            </div>

            <div style={{ marginTop: 6, opacity: 0.6, fontSize: 12 }}>
              Range: 40–240
            </div>
          </div>

          {/* Time signature */}
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
                    onClick={() => {
                      setTimeSig(sig);
                      if (created) resetSlotsForSig(sig);
                    }}
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

            <div style={{ marginTop: 6, opacity: 0.6, fontSize: 12 }}>
              This controls how many chord slots you get per template.
            </div>
          </div>

          {/* Create */}
          <div style={{ display: "flex", alignItems: "flex-end", gap: 10 }}>
            <button
              onClick={createProgression}
              style={{
                padding: "12px 14px",
                borderRadius: 12,
                border: 0,
                cursor: "pointer",
                fontWeight: 900,
                width: "100%",
              }}
            >
              {created ? "Recreate progression" : "Create progression"}
            </button>

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
              title="Loads your E2/E3/E4/E5 WAV samples"
            >
              {guitarLoaded ? "Guitar Loaded" : "Load Guitar"}
            </button>
          </div>
        </div>
      </div>

      {/* ---------- BUILDER SECTION (appears after create) ---------- */}
      {created && (
        <div
          style={{
            marginTop: 16,
            display: "grid",
            gridTemplateColumns: "1fr 1.2fr",
            gap: 18,
          }}
        >
          {/* Chord picker */}
          <div style={{ background: "#2a2a2a", borderRadius: 16, padding: 14 }}>
            <h2 style={{ fontSize: 18, margin: 0 }}>2) Pick chords</h2>
            <p style={{ marginTop: 6, opacity: 0.75 }}>
              Tap a chord to hear it and add it to the next empty slot.
            </p>

            <div style={{ marginTop: 10 }}>
              <h3 style={{ margin: 0, fontSize: 16 }}>
                Chords in {keyRoot} {scaleName}
              </h3>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 10,
                  marginTop: 10,
                }}
              >
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
                Use this for outside-the-scale chords.
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

          {/* Slot template */}
          <div style={{ background: "#2a2a2a", borderRadius: 16, padding: 14 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: 12,
              }}
            >
              <div>
                <h2 style={{ fontSize: 18, margin: 0 }}>
                  {progressionName.trim()}
                </h2>
                <p style={{ marginTop: 6, opacity: 0.75 }}>
                  Template: {timeSig} ({slotCount} slots). Chords fill left to
                  right.
                </p>
              </div>

              <button
                onClick={playSlotsAsOneBar}
                style={{
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: 0,
                  cursor: "pointer",
                  fontWeight: 900,
                }}
                title="Plays the current template from left to right"
              >
                ▶ Play
              </button>
            </div>

            <div
              style={{
                marginTop: 14,
                display: "grid",
                gridTemplateColumns: `repeat(${slotCount}, minmax(0, 1fr))`,
                gap: 10,
              }}
            >
              {slots.map((s, i) => (
                <div
                  key={i}
                  style={{
                    background: "#1f1f1f",
                    borderRadius: 14,
                    border: "1px solid rgba(255,255,255,0.12)",
                    padding: 12,
                    minHeight: 70,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: 10,
                  }}
                >
                  <div style={{ opacity: 0.65, fontSize: 12 }}>
                    Slot {i + 1}
                  </div>

                  {s ? (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 10,
                      }}
                    >
                      <button
                        onClick={() =>
                          ensureGuitar().then(() => engine.playChord(s))
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
                        title="Tap to audition this chord"
                      >
                        {s.label}
                      </button>

                      <button
                        onClick={() => deleteSlot(i)}
                        style={{
                          padding: "10px 12px",
                          borderRadius: 12,
                          border: "1px solid rgba(255,255,255,0.12)",
                          cursor: "pointer",
                          background: "#2a2a2a",
                          color: "white",
                          fontWeight: 900,
                        }}
                        title="Delete this chord"
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <div style={{ opacity: 0.55, fontSize: 13 }}>Empty</div>
                  )}
                </div>
              ))}
            </div>

            <div style={{ marginTop: 12, opacity: 0.65, fontSize: 13 }}>
              Note: For now, this is one template bar. Next we can add multiple
              bars/phrases (like your demo) and arrangement.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
