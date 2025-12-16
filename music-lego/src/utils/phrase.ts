import type { Chord } from "../types/music";

export function compactBar(bar: (Chord | null)[]): (Chord | null)[] {
  const only = bar.filter((x): x is Chord => x !== null);
  const out: (Chord | null)[] = [...only];
  while (out.length < bar.length) out.push(null);
  return out;
}

