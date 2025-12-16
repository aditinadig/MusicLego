import { useMemo, useState } from "react";
import { GuitarWavEngine } from "../audio/guitarWavEngine";

export function useAudioEngine() {
  const engine = useMemo(() => new GuitarWavEngine(), []);
  const [loaded, setLoaded] = useState(false);

  async function ensureLoaded() {
    await engine.load();
    setLoaded(true);
  }

  return {
    engine,
    loaded,
    ensureLoaded,
  };
}

