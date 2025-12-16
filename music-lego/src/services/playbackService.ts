import type { Phrase } from "../types/track";
import { generatePhraseEvents } from "../music/phrasePresets";
import type { GuitarWavEngine } from "../audio/guitarWavEngine";

export async function playPhrase(
  engine: GuitarWavEngine,
  phrase: Phrase,
  bpm: number,
  slotCount: number,
  startOffsetSec: number
): Promise<number> {
  const secPerBeat = 60 / bpm;
  const slotDuration = 4 * secPerBeat;
  const barSec = slotCount * slotDuration;

  let offset = startOffsetSec;

  for (const bar of phrase.bars) {
    let slotOffset = 0;

    for (const slot of bar) {
      if (slot) {
        const events = generatePhraseEvents(
          phrase.preset,
          slot,
          slotDuration
        );
        for (const ev of events) {
          engine.playMidi(ev.midi, offset + slotOffset + ev.timeOffset);
        }
      }
      slotOffset += slotDuration;
    }
    offset += barSec;
  }

  return offset;
}

export async function playArrangement(
  engine: GuitarWavEngine,
  phrases: Phrase[],
  arrangement: Array<{ phraseId: string }>,
  bpm: number,
  slotCount: number,
  onProgress?: () => void
): Promise<void> {
  let offset = 0;

  for (const item of arrangement) {
    const phrase = phrases.find((p) => p.id === item.phraseId);
    if (!phrase) continue;
    offset = await playPhrase(engine, phrase, bpm, slotCount, offset);
    onProgress?.();
  }
}

