import { useState, useMemo } from "react";
import type { Chord } from "../types/music";
import type { Phrase, TimeSig } from "../types/track";
import type { PhrasePreset } from "../music/phrasePresets";
import { compactBar } from "../utils/phrase";
import { beatsForTimeSig } from "../utils/time";

export function usePhrases() {
  const [phrases, setPhrases] = useState<Phrase[]>([]);
  const [selectedPhraseId, setSelectedPhraseId] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{ phraseId: string; barIndex: number; slotIndex: number } | null>(null);

  const selectedPhrase = useMemo(
    () => phrases.find((p) => p.id === selectedPhraseId) || null,
    [phrases, selectedPhraseId]
  );

  function createPhrase(name: string, slotCount: number): string {
    const id = crypto.randomUUID();
    const emptyBar = Array(slotCount).fill(null) as (Chord | null)[];
    const phrase: Phrase = {
      id,
      name,
      preset: "NORMAL_STRUM" as PhrasePreset,
      bars: [emptyBar],
    };

    setPhrases((p) => [phrase, ...p]);
    setSelectedPhraseId(id);
    return id;
  }

  function addBarToPhrase(phraseId: string, slotCount: number) {
    setPhrases((prev) =>
      prev.map((ph) => {
        if (ph.id !== phraseId) return ph;
        const emptyBar = Array(slotCount).fill(null) as (Chord | null)[];
        return { ...ph, bars: [...ph.bars, emptyBar] };
      })
    );
  }

  function setPhraseBars(phraseId: string, bars: (Chord | null)[][]) {
    setPhrases((prev) =>
      prev.map((ph) => (ph.id === phraseId ? { ...ph, bars } : ph))
    );
  }

  function updatePhrasePreset(phraseId: string, preset: PhrasePreset) {
    setPhrases((prev) =>
      prev.map((ph) => (ph.id === phraseId ? { ...ph, preset } : ph))
    );
  }

  function deleteBar(phraseId: string, barIndex: number) {
    setPhrases((prev) =>
      prev.map((ph) => {
        if (ph.id !== phraseId) return ph;
        if (ph.bars.length === 1) return ph; // keep at least 1 bar
        return {
          ...ph,
          bars: ph.bars.filter((_, i) => i !== barIndex),
        };
      })
    );
  }

  function deleteChordInBar(phraseId: string, barIndex: number, slotIndex: number) {
    setPhrases((prev) =>
      prev.map((ph) => {
        if (ph.id !== phraseId) return ph;
        const bars = ph.bars.map((bar) => [...bar]);
        bars[barIndex][slotIndex] = null;
        bars[barIndex] = compactBar(bars[barIndex]);
        return { ...ph, bars };
      })
    );
  }

  function addChordToPhrase(phraseId: string, chord: Chord, slotCount: number, barIndex?: number, slotIndex?: number) {
    setPhrases((prev) =>
      prev.map((ph) => {
        if (ph.id !== phraseId) return ph;

        const bars = ph.bars.map((bar) => [...bar]);

        // If specific slot is provided, insert there
        if (barIndex !== undefined && slotIndex !== undefined) {
          if (bars[barIndex] && bars[barIndex][slotIndex] !== undefined) {
            bars[barIndex][slotIndex] = chord;
            return { ...ph, bars };
          }
        }

        // Otherwise, try to fill next available slot (ascending order)
        for (let b = 0; b < bars.length; b++) {
          const idx = bars[b].findIndex((x) => x === null);
          if (idx !== -1) {
            bars[b][idx] = chord;
            return { ...ph, bars };
          }
        }

        // If everything is full, add a new bar
        const emptyBar = Array(slotCount).fill(null) as (Chord | null)[];
        emptyBar[0] = chord;
        return { ...ph, bars: [...bars, emptyBar] };
      })
    );
  }

  function resizePhrasesForTimeSig(newTimeSig: TimeSig) {
    const newSlots = beatsForTimeSig(newTimeSig);
    setPhrases((prev) =>
      prev.map((ph) => ({
        ...ph,
        bars: ph.bars.map((bar) => {
          const resized = bar.slice(0, newSlots);
          while (resized.length < newSlots) resized.push(null);
          return resized;
        }),
      }))
    );
  }

  return {
    phrases,
    selectedPhraseId,
    selectedPhrase,
    selectedSlot,
    setSelectedPhraseId,
    setSelectedSlot,
    createPhrase,
    addBarToPhrase,
    setPhraseBars,
    updatePhrasePreset,
    deleteBar,
    deleteChordInBar,
    addChordToPhrase,
    resizePhrasesForTimeSig,
  };
}

