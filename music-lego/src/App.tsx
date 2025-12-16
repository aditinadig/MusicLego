import { useMemo, useState } from "react";
import type { DragEndEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";

import { buildAllTriads, buildDiatonicChords } from "./music/theory";
import type { Chord, Note, ScaleName } from "./types/music";

import { GuitarWavEngine } from "./audio/guitarWavEngine";
import { ControlsBar } from "./ui/ControlsBar";
import { ProgressionLane } from "./ui/ProgressionLane";
import { ChordPalette } from "./ui/ChordPalette";

export default function App() {
  /* =========================
     State
     ========================= */

  const [keyRoot, setKeyRoot] = useState<Note>("C");
  const [scaleName, setScaleName] = useState<ScaleName>("Major");
  const [bpm, setBpm] = useState(90);
  const [showAll, setShowAll] = useState(false);
  const [progression, setProgression] = useState<Chord[]>([]);
  const [loaded, setLoaded] = useState(false);

  /* =========================
     Derived data
     ========================= */

  const scaleChords = useMemo(
    () => buildDiatonicChords(keyRoot, scaleName),
    [keyRoot, scaleName]
  );

  const allChords = useMemo(() => buildAllTriads(), []);

  /* =========================
     Audio engine (created once)
     ========================= */

  const engine = useMemo(() => new GuitarWavEngine(), []);

  /* =========================
     Actions
     ========================= */

  function addChord(chord: Chord) {
    const instance: Chord = {
      ...chord,
      id: `${chord.id}-inst-${crypto.randomUUID()}`,
    };

    setProgression((p) => [...p, instance]);

    // Audition immediately (non-theory users)
    engine.playChord(instance);
  }

  function removeChord(id: string) {
    setProgression((p) => p.filter((c) => c.id !== id));
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setProgression((items) => {
      const oldIndex = items.findIndex((c) => c.id === active.id);
      const newIndex = items.findIndex((c) => c.id === over.id);
      return arrayMove(items, oldIndex, newIndex);
    });
  }

  async function loadGuitar() {
    await engine.load();
    setLoaded(true);
  }

  async function playProgression() {
    await engine.load();
    setLoaded(true);

    const secondsPerBeat = 60 / bpm;
    const barSec = 4 * secondsPerBeat;

    // Prevent long sustains from stacking endlessly
    const stopEachAt = barSec * 0.98;

    let offset = 0;
    for (const ch of progression) {
      await engine.playChord(ch, offset, stopEachAt);
      offset += barSec;
    }
  }

  /* =========================
     Render
     ========================= */

  return (
    <div
      style={{
        maxWidth: 980,
        margin: "0 auto",
        padding: 18,
        color: "white",
        fontFamily: "system-ui",
      }}
    >
      <h1 style={{ margin: 0 }}>Chord Progression Maker (Guitar WAV)</h1>

      <p style={{ marginTop: 8, opacity: 0.8 }}>
        Choose a key and scale. Tap chords to hear them. Add and drag to build
        your progression.
      </p>

      <ControlsBar
        keyRoot={keyRoot}
        setKeyRoot={setKeyRoot}
        scaleName={scaleName}
        setScaleName={setScaleName}
        bpm={bpm}
        setBpm={setBpm}
        onLoad={loadGuitar}
        onPlay={playProgression}
        onClear={() => setProgression([])}
        loaded={loaded}
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1.2fr",
          gap: 18,
          marginTop: 18,
        }}
      >
        {/* LEFT: chord palette */}
        <div
          style={{
            background: "#2a2a2a",
            borderRadius: 16,
            padding: 14,
          }}
        >
          <ChordPalette
            title={`Chords in ${keyRoot} ${scaleName}`}
            chords={scaleChords}
            onAdd={addChord}
          />

          <div
            style={{
              marginTop: 16,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <button
              onClick={() => setShowAll((v) => !v)}
              style={{
                padding: "10px 14px",
                borderRadius: 12,
                border: 0,
                cursor: "pointer",
                fontWeight: 800,
              }}
            >
              {showAll ? "Hide" : "Show"} all chords
            </button>

            <span style={{ opacity: 0.75, fontSize: 13 }}>
              Use this for outside-the-scale chords.
            </span>
          </div>

          {showAll && (
            <div style={{ marginTop: 12 }}>
              <ChordPalette
                title="All triads"
                chords={allChords}
                onAdd={addChord}
                variant="secondary"
              />
            </div>
          )}
        </div>

        {/* RIGHT: progression */}
        <div
          style={{
            background: "#2a2a2a",
            borderRadius: 16,
            padding: 14,
          }}
        >
          <h3 style={{ marginTop: 0 }}>Your progression</h3>

          <p style={{ marginTop: 6, opacity: 0.75 }}>
            Drag to reorder. Tap a chord to hear it.
          </p>

          <ProgressionLane
            progression={progression}
            onDragEnd={onDragEnd}
            onAudition={(ch) => engine.playChord(ch)}
            onRemove={removeChord}
          />
        </div>
      </div>
    </div>
  );
}