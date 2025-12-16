import { useMemo, useRef, useState } from "react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

/** ---------- Music Theory (MVP) ---------- **/

const NOTES = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"] as const;
type Note = typeof NOTES[number];

const SCALES = {
  Major: [0, 2, 4, 5, 7, 9, 11],
  "Natural Minor": [0, 2, 3, 5, 7, 8, 10],
} as const;
type ScaleName = keyof typeof SCALES;

type Quality = "maj" | "min" | "dim";
type Chord = {
  id: string;
  root: Note;
  quality: Quality;
  label: string;
  source: "scale" | "all";
};

const NOTE_TO_PC: Record<Note, number> = Object.fromEntries(
  NOTES.map((n, i) => [n, i])
) as Record<Note, number>;

function pcToNote(pc: number): Note {
  return NOTES[((pc % 12) + 12) % 12];
}

function buildDiatonicChords(keyRoot: Note, scaleName: ScaleName): Chord[] {
  const scale = SCALES[scaleName];
  const rootPc = NOTE_TO_PC[keyRoot];
  const pcs = scale.map((interval) => (rootPc + interval) % 12);

  const qualitiesMajor: Quality[] = ["maj","min","min","maj","maj","min","dim"];
  const qualitiesMinor: Quality[] = ["min","dim","maj","min","min","maj","maj"];
  const qualities = scaleName === "Major" ? qualitiesMajor : qualitiesMinor;

  return pcs.map((pc, i) => {
    const root = pcToNote(pc);
    const q = qualities[i];
    const label = q === "maj" ? `${root}` : q === "min" ? `${root}m` : `${root}°`;
    return { id: `scale-${root}-${q}-${i}`, root, quality: q, label, source: "scale" };
  });
}

function buildAllTriads(): Chord[] {
  const qualities: Quality[] = ["maj","min","dim"];
  const suffix = (q: Quality) => (q === "maj" ? "" : q === "min" ? "m" : "°");
  const out: Chord[] = [];
  for (const root of NOTES) {
    for (const q of qualities) {
      out.push({
        id: `all-${root}-${q}`,
        root,
        quality: q,
        label: `${root}${suffix(q)}`,
        source: "all",
      });
    }
  }
  return out;
}

/** ---------- WAV Guitar Engine (your exact approach) ---------- **/

type SampleDef = { name: "E2"|"E3"|"E4"|"E5"; midi: number; url: string };
type LoadedSample = { midi: number; buffer: AudioBuffer };

const SAMPLE_DEFS: SampleDef[] = [
  { name: "E2", midi: 40, url: "/E2.wav" },
  { name: "E3", midi: 52, url: "/E3.wav" },
  { name: "E4", midi: 64, url: "/E4.wav" },
  { name: "E5", midi: 76, url: "/E5.wav" },
];

function chordToMidiTriad(chord: Chord, octave = 3): number[] {
  const rootPc = NOTE_TO_PC[chord.root];
  const rootMidi = 12 * (octave + 1) + rootPc;
  const third = chord.quality === "maj" ? 4 : 3;
  const fifth = chord.quality === "dim" ? 6 : 7;
  return [rootMidi, rootMidi + third, rootMidi + fifth];
}

function midiToPlaybackRate(targetMidi: number, sampleMidi: number) {
  return Math.pow(2, (targetMidi - sampleMidi) / 12);
}

/** ---------- Sortable chip ---------- **/
function SortableChip({
  id,
  label,
  onAudition,
  onRemove,
}: {
  id: string;
  label: string;
  onAudition: () => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        padding: "10px 14px",
        borderRadius: 999,
        background: "#ff6b4a",
        color: "white",
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        opacity: isDragging ? 0.6 : 1,
        userSelect: "none",
        touchAction: "none",
      }}
      {...attributes}
      {...listeners}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onAudition(); }}
        style={{ all: "unset", cursor: "pointer", fontWeight: 800 }}
        title="Tap to audition"
      >
        {label}
      </button>

      <button
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        style={{ all: "unset", cursor: "pointer", fontWeight: 900, opacity: 0.9 }}
        title="Remove"
      >
        ×
      </button>
    </div>
  );
}

/** ---------- App ---------- **/
export default function App() {
  const [keyRoot, setKeyRoot] = useState<Note>("C");
  const [scaleName, setScaleName] = useState<ScaleName>("Major");
  const [bpm, setBpm] = useState(90);
  const [showAll, setShowAll] = useState(false);
  const [progression, setProgression] = useState<Chord[]>([]);

  const scaleChords = useMemo(() => buildDiatonicChords(keyRoot, scaleName), [keyRoot, scaleName]);
  const allChords = useMemo(() => buildAllTriads(), []);

  const audioRef = useRef<{
    ctx: AudioContext;
    loaded: boolean;
    samples: Record<string, LoadedSample>;
  } | null>(null);

  async function ensureAudio() {
    if (!audioRef.current) {
      const audioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      audioRef.current = {
        ctx: new audioContext(),
        loaded: false,
        samples: {},
      };
    }
    const { ctx } = audioRef.current;
    if (ctx.state !== "running") await ctx.resume();
    return audioRef.current;
  }

  async function loadGuitarSamples() {
    const a = await ensureAudio();
    if (a.loaded) return;

    for (const s of SAMPLE_DEFS) {
      const res = await fetch(s.url);
      if (!res.ok) throw new Error(`Failed to load ${s.url} (${res.status})`);
      const arrayBuffer = await res.arrayBuffer();
      const buffer = await a.ctx.decodeAudioData(arrayBuffer);
      a.samples[s.name] = { midi: s.midi, buffer };
    }

    a.loaded = true;
  }

  function closestSample(targetMidi: number, samples: LoadedSample[]) {
    return samples.reduce((best, s) =>
      Math.abs(targetMidi - s.midi) < Math.abs(targetMidi - best.midi) ? s : best
    );
  }

  async function playChordWav(chord: Chord, whenOffsetSec = 0, durOverrideSec?: number) {
    const a = await ensureAudio();
    await loadGuitarSamples();

    const samplesArr = Object.values(a.samples);
    const now = a.ctx.currentTime + 0.02 + whenOffsetSec;

    const notes = chordToMidiTriad(chord, 3);

    notes.forEach((midi) => {
      const sample = closestSample(midi, samplesArr);
      const src = a.ctx.createBufferSource();
      src.buffer = sample.buffer;
      src.playbackRate.value = midiToPlaybackRate(midi, sample.midi);
      src.connect(a.ctx.destination);

      src.start(now);

      // Optional: if you want a hard stop during progression playback
      // (keep undefined to preserve full sustain "as is")
      if (durOverrideSec != null) {
        src.stop(now + durOverrideSec);
      }
    });
  }

  function addChordToProgression(chord: Chord) {
    const instance: Chord = { ...chord, id: `${chord.id}-inst-${crypto.randomUUID()}` };
    setProgression((p) => [...p, instance]);
    playChordWav(instance); // audition on add
  }

  function removeFromProgression(id: string) {
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

  async function playProgression() {
    await ensureAudio();
    await loadGuitarSamples();

    const secondsPerBeat = 60 / bpm;
    const barSec = 4 * secondsPerBeat;

    // If you want to preserve full sustain, don't force stop.
    // BUT overlapping long sustains can get messy, so a common choice is:
    const stopEachAt = barSec * 0.98;

    let t = 0;
    for (const ch of progression) {
      await playChordWav(ch, t, stopEachAt);
      t += barSec;
    }
  }

  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: 18, color: "white", fontFamily: "system-ui" }}>
      <h1 style={{ margin: 0 }}>Chord Progression Maker (Guitar WAV)</h1>
      <p style={{ marginTop: 8, opacity: 0.8 }}>
        Choose a key + scale. Tap chords to hear them. Build your progression by adding and dragging.
      </p>

      {/* Controls */}
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

        <button onClick={() => loadGuitarSamples()} style={{ padding: "10px 14px", borderRadius: 12, border: 0, cursor: "pointer", fontWeight: 800 }}>
          Load Guitar
        </button>

        <button onClick={playProgression} style={{ padding: "10px 14px", borderRadius: 12, border: 0, cursor: "pointer", fontWeight: 900 }}>
          ▶ Play
        </button>

        <button onClick={() => setProgression([])} style={{ padding: "10px 14px", borderRadius: 12, border: 0, cursor: "pointer", fontWeight: 700, opacity: 0.85 }}>
          Clear
        </button>
      </div>

      {/* Layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 18, marginTop: 18 }}>
        {/* Left: palette */}
        <div style={{ background: "#2a2a2a", borderRadius: 16, padding: 14 }}>
          <h3 style={{ marginTop: 0 }}>Chords in {keyRoot} {scaleName}</h3>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            {scaleChords.map((ch) => (
              <button
                key={ch.id}
                onClick={() => addChordToProgression(ch)}
                style={{ padding: "10px 14px", borderRadius: 999, border: 0, cursor: "pointer", fontWeight: 800 }}
                title="Tap to add (auditions too)"
              >
                {ch.label}
              </button>
            ))}
          </div>

          <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 10 }}>
            <button
              onClick={() => setShowAll((v) => !v)}
              style={{ padding: "10px 14px", borderRadius: 12, border: 0, cursor: "pointer", fontWeight: 800 }}
            >
              {showAll ? "Hide" : "Show"} all chords
            </button>
            <span style={{ opacity: 0.75, fontSize: 13 }}>
              Use this for outside-the-scale chords.
            </span>
          </div>

          {showAll && (
            <div style={{ marginTop: 12 }}>
              <h4 style={{ margin: "10px 0", opacity: 0.9 }}>All triads</h4>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {allChords.map((ch) => (
                  <button
                    key={ch.id}
                    onClick={() => addChordToProgression(ch)}
                    style={{
                      padding: "10px 14px",
                      borderRadius: 999,
                      border: "1px solid rgba(255,255,255,0.15)",
                      cursor: "pointer",
                      background: "#1f1f1f",
                      color: "white",
                      fontWeight: 700,
                    }}
                  >
                    {ch.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: progression */}
        <div style={{ background: "#2a2a2a", borderRadius: 16, padding: 14 }}>
          <h3 style={{ marginTop: 0 }}>Your progression</h3>
          <p style={{ marginTop: 6, opacity: 0.75 }}>
            Drag to reorder. Tap a chord to hear it.
          </p>

          {progression.length === 0 ? (
            <div style={{ padding: 14, borderRadius: 14, background: "#1f1f1f", opacity: 0.85 }}>
              Add chords from the left panel to start.
            </div>
          ) : (
            <DndContext collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={progression.map((c) => c.id)} strategy={horizontalListSortingStrategy}>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", padding: 12, borderRadius: 14, background: "#1f1f1f", minHeight: 64 }}>
                  {progression.map((ch) => (
                    <SortableChip
                      key={ch.id}
                      id={ch.id}
                      label={ch.label}
                      onAudition={() => playChordWav(ch)}
                      onRemove={() => removeFromProgression(ch.id)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>
    </div>
  );
}