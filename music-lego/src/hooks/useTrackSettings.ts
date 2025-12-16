import { useState, useMemo } from "react";
import type { Note, ScaleName } from "../types/music";
import type { TimeSig, TrackSettings } from "../types/track";
import { beatsForTimeSig } from "../utils/time";
import { clamp } from "../utils/math";

export function useTrackSettings() {
  const [trackName, setTrackName] = useState("");
  const [keyRoot, setKeyRoot] = useState<Note>("C");
  const [scaleName, setScaleName] = useState<ScaleName>("Major");
  const [bpm, setBpm] = useState(90);
  const [timeSig, setTimeSig] = useState<TimeSig>("4/4");

  const slotCount = useMemo(() => beatsForTimeSig(timeSig), [timeSig]);

  const settings: TrackSettings = useMemo(
    () => ({
      trackName,
      keyRoot,
      scaleName,
      bpm,
      timeSig,
    }),
    [trackName, keyRoot, scaleName, bpm, timeSig]
  );

  function tempoMinus() {
    setBpm((v) => clamp(v - 1, 40, 240));
  }

  function tempoPlus() {
    setBpm((v) => clamp(v + 1, 40, 240));
  }

  function changeTimeSig(sig: TimeSig) {
    setTimeSig(sig);
    return beatsForTimeSig(sig);
  }

  return {
    settings,
    slotCount,
    setTrackName,
    setKeyRoot,
    setScaleName,
    setBpm,
    setTimeSig,
    tempoMinus,
    tempoPlus,
    changeTimeSig,
  };
}

