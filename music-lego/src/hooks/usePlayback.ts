import { useState, useCallback } from "react";
import type { GuitarWavEngine } from "../audio/guitarWavEngine";

export function usePlayback(engine: GuitarWavEngine) {
  const [isPlaying, setIsPlaying] = useState(false);

  const startPlayback = useCallback(() => {
    setIsPlaying(true);
  }, []);

  const stopPlayback = useCallback(async () => {
    await engine.stop();
    setIsPlaying(false);
  }, [engine]);

  return {
    isPlaying,
    startPlayback,
    stopPlayback,
  };
}

