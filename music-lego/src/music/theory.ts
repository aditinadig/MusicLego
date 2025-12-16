import { NOTES, type Note, type Quality, type Chord, type ScaleName, SCALES } from "../types/music";

export const NOTE_TO_PC: Record<Note, number> = Object.fromEntries(
  NOTES.map((n, i) => [n, i])
) as Record<Note, number>;

export function pcToNote(pc: number): Note {
  return NOTES[((pc % 12) + 12) % 12];
}

export function buildDiatonicChords(keyRoot: Note, scaleName: ScaleName): Chord[] {
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

export function buildAllTriads(): Chord[] {
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

export function chordToMidiTriad(chord: Chord, octave = 3): number[] {
  const rootPc = NOTE_TO_PC[chord.root];
  const rootMidi = 12 * (octave + 1) + rootPc;
  const third = chord.quality === "maj" ? 4 : 3;
  const fifth = chord.quality === "dim" ? 6 : 7;
  return [rootMidi, rootMidi + third, rootMidi + fifth];
}