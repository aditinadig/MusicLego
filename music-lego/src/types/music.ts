export const NOTES = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"] as const;
export type Note = typeof NOTES[number];

export const SCALES = {
  Major: [0, 2, 4, 5, 7, 9, 11],
  "Natural Minor": [0, 2, 3, 5, 7, 8, 10],
} as const;

export type ScaleName = keyof typeof SCALES;

export type Quality = "maj" | "min" | "dim";

export type Chord = {
  id: string;
  root: Note;
  quality: Quality;
  label: string;
  source: "scale" | "all";
};