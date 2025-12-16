import type { TimeSig } from "../types/track";

export function beatsForTimeSig(sig: TimeSig): number {
  if (sig === "4/4") return 4;
  if (sig === "3/3") return 3;
  return 2;
}

