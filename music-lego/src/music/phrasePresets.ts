import type { Chord } from "../types/music";
import { chordToMidiTriad } from "./theory";

export type PhrasePreset =
  | "ASCENDING_SILENCE"
  | "NORMAL_STRUM";

export const PHRASE_PRESETS: Record<PhrasePreset, string> = {
  ASCENDING_SILENCE: "Ascending + Silence",
  NORMAL_STRUM: "Normal Strum",
};

export function generatePhraseEvents(
  preset: PhrasePreset,
  chord: Chord,
  slotDuration: number
): { midi: number; timeOffset: number }[] {
  const [root, third, fifth] = chordToMidiTriad(chord, 3);

  const q = slotDuration / 4; // quarter note (1 beat)
  const e = slotDuration / 8; // eighth note (0.5 beats)

  switch (preset) {
    case "ASCENDING_SILENCE": {
      // 4 notes in ascending order at twice the speed (first 2 beats), then silence (remaining 2 beats)
      // Total: 4 beats per slot
      const halfBeat = q / 2; // half beat (0.5 beats) - twice as fast
      return [
        { midi: root, timeOffset: 0 },              // note 1 at beat 0
        { midi: third, timeOffset: halfBeat },      // note 2 at beat 0.5
        { midi: fifth, timeOffset: halfBeat * 2 },  // note 3 at beat 1.0
        { midi: root + 12, timeOffset: halfBeat * 3 }, // note 4 at beat 1.5
        // Silence from beat 2.0 to 4.0 (no events)
      ];
    }

    case "NORMAL_STRUM":
      // Normal strum - all notes hit together with slight stagger
      return [
        { midi: root, timeOffset: 0 },
        { midi: third, timeOffset: e / 2 },
        { midi: fifth, timeOffset: e },
      ];
  }
}