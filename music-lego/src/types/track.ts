import type { Chord, Note, ScaleName } from "./music";
import type { PhrasePreset } from "../music/phrasePresets";

export type TimeSig = "4/4" | "3/3" | "2/2";

export type Phrase = {
  id: string;
  name: string;
  preset: PhrasePreset;
  bars: (Chord | null)[][];
};

export type ArrangementItem = {
  id: string;
  phraseId: string;
};

export type TrackSettings = {
  trackName: string;
  keyRoot: Note;
  scaleName: ScaleName;
  bpm: number;
  timeSig: TimeSig;
};

