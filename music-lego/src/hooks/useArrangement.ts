import { useState } from "react";
import type { ArrangementItem } from "../types/track";

export function useArrangement() {
  const [arrangement, setArrangement] = useState<ArrangementItem[]>([]);

  function addPhraseToArrangement(phraseId: string) {
    setArrangement((a) => [
      ...a,
      { id: crypto.randomUUID(), phraseId },
    ]);
  }

  function moveItem(index: number, dir: -1 | 1) {
    setArrangement((prev) => {
      const next = [...prev];
      const j = index + dir;
      if (j < 0 || j >= next.length) return prev;
      const tmp = next[index];
      next[index] = next[j];
      next[j] = tmp;
      return next;
    });
  }

  function removeItem(id: string) {
    setArrangement((prev) => prev.filter((x) => x.id !== id));
  }

  function clear() {
    setArrangement([]);
  }

  return {
    arrangement,
    addPhraseToArrangement,
    moveItem,
    removeItem,
    clear,
  };
}

