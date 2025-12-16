import { GUITAR_SAMPLE_DEFS, type SampleName } from "../music/chords";
import { chordToMidiTriad } from "../music/theory";
import type { Chord } from "../types/music";

type LoadedSample = { midi: number; buffer: AudioBuffer };

function midiToPlaybackRate(targetMidi: number, sampleMidi: number) {
  return Math.pow(2, (targetMidi - sampleMidi) / 12);
}

function closestSample(targetMidi: number, samples: LoadedSample[]) {
  return samples.reduce((best, s) =>
    Math.abs(targetMidi - s.midi) < Math.abs(targetMidi - best.midi) ? s : best
  );
}

export class GuitarWavEngine {
  private ctx: AudioContext | null = null;
  private loaded = false;
  private samples: Record<string, LoadedSample> = {};

  async ensureAudio() {
    if (!this.ctx)
      this.ctx = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext)();
    if (this.ctx.state !== "running") await this.ctx.resume();
    return this.ctx;
  }

  async load() {
    const ctx = await this.ensureAudio();
    if (this.loaded) return;

    for (const s of GUITAR_SAMPLE_DEFS) {
      const res = await fetch(s.url);
      if (!res.ok) throw new Error(`Failed to load ${s.url} (${res.status})`);
      const arrayBuffer = await res.arrayBuffer();
      const buffer = await ctx.decodeAudioData(arrayBuffer);
      this.samples[s.name] = { midi: s.midi, buffer };
    }

    this.loaded = true;
  }

  isLoaded() {
    return this.loaded;
  }

  async playRawSample(name: SampleName) {
    const ctx = await this.ensureAudio();
    await this.load();

    const sample = this.samples[name];
    if (!sample) return;

    const src = ctx.createBufferSource();
    src.buffer = sample.buffer;
    src.connect(ctx.destination);
    src.start();
  }

  async playChord(chord: Chord, whenOffsetSec = 0, stopAtSec?: number) {
    const ctx = await this.ensureAudio();
    await this.load();

    const samplesArr = Object.values(this.samples);
    const now = ctx.currentTime + 0.02 + whenOffsetSec;

    const notes = chordToMidiTriad(chord, 3);
    notes.forEach((midi) => {
      const sample = closestSample(midi, samplesArr);

      const src = ctx.createBufferSource();
      src.buffer = sample.buffer;
      src.playbackRate.value = midiToPlaybackRate(midi, sample.midi);
      src.connect(ctx.destination);

      src.start(now);
      if (stopAtSec != null) src.stop(now + stopAtSec);
    });
  }

  playMidi(midi: number, whenOffsetSec: number) {
    // Synchronous scheduling - assumes audio is already loaded
    // This prevents microdelays from async operations
    const ctx = this.ctx;
    if (!ctx || !this.loaded) {
      console.warn("Audio not loaded, skipping note");
      return;
    }

    const samplesArr = Object.values(this.samples);
    if (samplesArr.length === 0) return;

    const sample = closestSample(midi, samplesArr);

    const src = ctx.createBufferSource();
    src.buffer = sample.buffer;
    src.playbackRate.value = Math.pow(2, (midi - sample.midi) / 12);
    src.connect(ctx.destination);

    // ✅ IMPORTANT: convert relative offset to absolute AudioContext time
    const when = ctx.currentTime + 0.02 + whenOffsetSec;
    src.start(when);
  }

  async stop() {
    const ctx = this.ctx;
    if (ctx && ctx.state !== "closed") {
      await ctx.suspend();
      // Create a new context for future playback
      this.ctx = null;
    }
  }

  getAudioContext() {
    return this.ctx;
  }
}
