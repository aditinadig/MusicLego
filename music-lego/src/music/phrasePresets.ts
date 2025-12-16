// src/music/phrasePresets.ts
import type { Chord } from "../types/music";
import { chordToMidiTriad } from "./theory";

export type PhrasePreset =
  | "SUSTAIN_PAD"
  | "DOWN_STRUM"
  | "UP_DOWN_STRUM"
  | "BROKEN_ARP"
  | "PULSE_ROOT"
  | "WIDE_ARP";

export const PHRASE_PRESETS: Record<PhrasePreset, string> = {
  SUSTAIN_PAD: "Sustain Pad",
  DOWN_STRUM: "Down Strum",
  UP_DOWN_STRUM: "Up–Down Strum",
  BROKEN_ARP: "Broken Arpeggio",
  PULSE_ROOT: "Pulse Root",
  WIDE_ARP: "Wide Arpeggio",
};

export function generatePhraseEvents(
  preset: PhrasePreset,
  chord: Chord,
  slotDuration: number
): { midi: number; timeOffset: number }[] {
  const notes = chordToMidiTriad(chord, 3);
  const [root, third, fifth] = notes;

  switch (preset) {
    case "SUSTAIN_PAD":
      return notes.map((m) => ({ midi: m, timeOffset: 0 }));

    case "DOWN_STRUM":
      return notes.map((m, i) => ({
        midi: m,
        timeOffset: i * 0.02,
      }));

    case "UP_DOWN_STRUM":
      return [
        ...notes.map((m, i) => ({ midi: m, timeOffset: i * 0.02 })),
        ...notes
          .slice()
          .reverse()
          .map((m, i) => ({
            midi: m,
            timeOffset: slotDuration / 2 + i * 0.02,
          })),
      ];

    case "BROKEN_ARP":
      return [
        { midi: root, timeOffset: 0 },
        { midi: third, timeOffset: slotDuration * 0.25 },
        { midi: fifth, timeOffset: slotDuration * 0.5 },
        { midi: third, timeOffset: slotDuration * 0.75 },
      ];

    case "PULSE_ROOT":
      return [
        { midi: root, timeOffset: 0 },
        { midi: root, timeOffset: slotDuration / 2 },
      ];

    case "WIDE_ARP":
      return [
        { midi: root, timeOffset: 0 },
        { midi: fifth, timeOffset: slotDuration * 0.33 },
        { midi: fifth, timeOffset: slotDuration * 0.66 },
        { midi: root, timeOffset: slotDuration * 0.9 },
      ];
  }
}