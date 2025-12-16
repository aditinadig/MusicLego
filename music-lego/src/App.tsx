import { useMemo, useState, useRef } from "react";
import { buildAllTriads, buildDiatonicChords } from "./music/theory";
import type { Chord } from "./types/music";

import { useTrackSettings } from "./hooks/useTrackSettings";
import { usePhrases } from "./hooks/usePhrases";
import { useArrangement } from "./hooks/useArrangement";
import { useAudioEngine } from "./hooks/useAudioEngine";
import { usePlayback } from "./hooks/usePlayback";

import { playPhrase, playArrangement as playArrangementService } from "./services/playbackService";

import { TrackSetup } from "./ui/TrackSetup";
import { PhrasesList } from "./ui/PhrasesList";
import { ChordPicker } from "./ui/ChordPicker";
import { PhraseEditor } from "./ui/PhraseEditor";
import { ArrangementView } from "./ui/ArrangementView";

export default function App() {
  // Hooks
  const trackSettings = useTrackSettings();
  const phrases = usePhrases();
  const arrangement = useArrangement();
  const audio = useAudioEngine();
  const playback = usePlayback(audio.engine);

  // Local state
  const [newPhraseName, setNewPhraseName] = useState("");
  const [showAllChords, setShowAllChords] = useState(false);
  const [playingPhraseId, setPlayingPhraseId] = useState<string | null>(null);
  const playbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Derived data
  const scaleChords = useMemo(
    () => buildDiatonicChords(trackSettings.settings.keyRoot, trackSettings.settings.scaleName),
    [trackSettings.settings.keyRoot, trackSettings.settings.scaleName]
  );

  const allChords = useMemo(() => buildAllTriads(), []);

  // Handlers
  async function handleCreatePhrase() {
    const name = newPhraseName.trim();
    if (!name) {
      alert("Please enter a phrase name (e.g., Verse, Chorus).");
      return;
    }
    phrases.createPhrase(name, trackSettings.slotCount);
    setNewPhraseName("");
  }

  async function handleChordPick(ch: Chord) {
    await audio.ensureLoaded();

    const instance: Chord = {
      ...ch,
      id: `${ch.id}-inst-${crypto.randomUUID()}`,
    };

    audio.engine.playChord(instance);

    if (phrases.selectedPhraseId) {
      // If a specific slot is selected, insert there; otherwise use default ascending order
      if (phrases.selectedSlot && phrases.selectedSlot.phraseId === phrases.selectedPhraseId) {
        phrases.addChordToPhrase(
          phrases.selectedPhraseId,
          instance,
          trackSettings.slotCount,
          phrases.selectedSlot.barIndex,
          phrases.selectedSlot.slotIndex
        );
        // Clear selection after inserting
        phrases.setSelectedSlot(null);
      } else {
        phrases.addChordToPhrase(phrases.selectedPhraseId, instance, trackSettings.slotCount);
      }
    }
  }

  async function handlePlaySelectedPhrase() {
    if (!phrases.selectedPhrase) return;
    await handlePlayPhraseById(phrases.selectedPhrase.id);
  }

  async function handlePlayPhraseById(phraseId: string) {
    const phrase = phrases.phrases.find((p) => p.id === phraseId);
    if (!phrase) return;
    
    if (playback.isPlaying && playingPhraseId === phraseId) {
      if (playbackTimeoutRef.current) {
        clearTimeout(playbackTimeoutRef.current);
        playbackTimeoutRef.current = null;
      }
      await playback.stopPlayback();
      setPlayingPhraseId(null);
      return;
    }

    // If playing a different phrase, stop current first
    if (playback.isPlaying) {
      if (playbackTimeoutRef.current) {
        clearTimeout(playbackTimeoutRef.current);
        playbackTimeoutRef.current = null;
      }
      await playback.stopPlayback();
    }

    await audio.ensureLoaded();
    playback.startPlayback();
    setPlayingPhraseId(phraseId);
    
    // Calculate duration
    const secPerBeat = 60 / trackSettings.settings.bpm;
    const slotDuration = 4 * secPerBeat;
    const barSec = trackSettings.slotCount * slotDuration;
    const totalDuration = phrase.bars.length * barSec;
    
    // Schedule playback end
    playbackTimeoutRef.current = setTimeout(() => {
      playback.stopPlayback();
      setPlayingPhraseId(null);
      playbackTimeoutRef.current = null;
    }, totalDuration * 1000 + 100); // Add small buffer
    
    try {
      await playPhrase(
        audio.engine,
        phrase,
        trackSettings.settings.bpm,
        trackSettings.slotCount,
        0
      );
    } catch {
      if (playbackTimeoutRef.current) {
        clearTimeout(playbackTimeoutRef.current);
        playbackTimeoutRef.current = null;
      }
      playback.stopPlayback();
      setPlayingPhraseId(null);
    }
  }

  async function handlePlayArrangement() {
    if (arrangement.arrangement.length === 0) {
      alert("Add phrases to arrangement first.");
      return;
    }

    if (playback.isPlaying) {
      if (playbackTimeoutRef.current) {
        clearTimeout(playbackTimeoutRef.current);
        playbackTimeoutRef.current = null;
      }
      await playback.stopPlayback();
      setPlayingPhraseId(null);
      return;
    }

    await audio.ensureLoaded();
    playback.startPlayback();
    setPlayingPhraseId(null); // Arrangement playback, not a specific phrase

    // Calculate total duration
    const secPerBeat = 60 / trackSettings.settings.bpm;
    const slotDuration = 4 * secPerBeat;
    const barSec = trackSettings.slotCount * slotDuration;
    let totalDuration = 0;
    for (const item of arrangement.arrangement) {
      const phrase = phrases.phrases.find((p) => p.id === item.phraseId);
      if (phrase) {
        totalDuration += phrase.bars.length * barSec;
      }
    }

    // Schedule playback end
    playbackTimeoutRef.current = setTimeout(() => {
      playback.stopPlayback();
      setPlayingPhraseId(null);
      playbackTimeoutRef.current = null;
    }, totalDuration * 1000 + 100); // Add small buffer

    try {
      await playArrangementService(
        audio.engine,
        phrases.phrases,
        arrangement.arrangement,
        trackSettings.settings.bpm,
        trackSettings.slotCount
      );
    } catch {
      if (playbackTimeoutRef.current) {
        clearTimeout(playbackTimeoutRef.current);
        playbackTimeoutRef.current = null;
      }
      playback.stopPlayback();
      setPlayingPhraseId(null);
    }
  }

  function handleTimeSigChange(sig: Parameters<typeof trackSettings.changeTimeSig>[0]) {
    trackSettings.changeTimeSig(sig);
    phrases.resizePhrasesForTimeSig(sig);
  }

  function handleAddToArrangement() {
    if (!phrases.selectedPhraseId) {
      alert("Select a phrase first.");
      return;
    }
    arrangement.addPhraseToArrangement(phrases.selectedPhraseId);
  }

  return (
    <div
      style={{
        maxWidth: 1400,
        margin: "0 auto",
        padding: "24px 20px",
        color: "#f5f5f5",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
        background: "linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 100%)",
        minHeight: "100vh",
      }}
    >
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ margin: 0, fontSize: 32, fontWeight: 700, letterSpacing: "-0.5px", background: "linear-gradient(135deg, #ff8c42 0%, #ffa366 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
          MusicLego
        </h1>
        <p style={{ marginTop: 8, opacity: 0.7, fontSize: 15, fontWeight: 400 }}>
          Build chord progressions • Create phrases • Arrange your song
        </p>
      </div>

      <TrackSetup
        settings={trackSettings.settings}
        slotCount={trackSettings.slotCount}
        onTrackNameChange={trackSettings.setTrackName}
        onKeyRootChange={trackSettings.setKeyRoot}
        onScaleNameChange={trackSettings.setScaleName}
        onBpmChange={trackSettings.setBpm}
        onTempoMinus={trackSettings.tempoMinus}
        onTempoPlus={trackSettings.tempoPlus}
        onTimeSigChange={handleTimeSigChange}
        onLoadGuitar={audio.ensureLoaded}
        onPlayArrangement={handlePlayArrangement}
        onClearArrangement={arrangement.clear}
        guitarLoaded={audio.loaded}
        isPlaying={playback.isPlaying}
      />

      {/* MAIN WORKFLOW AREA */}
      <div style={{ marginTop: 24 }}>
        {/* STEP 1: Create Chord Progressions */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <div style={{ 
              width: 32, 
              height: 32, 
              borderRadius: "50%", 
              background: "#ff8c42",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 16,
            }}>1</div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>Create Chord Progressions</h2>
            <span style={{ opacity: 0.6, fontSize: 13, marginLeft: 8 }}>Name your progressions (Verse, Chorus, etc.)</span>
          </div>
          <PhrasesList
            phrases={phrases.phrases}
            selectedPhraseId={phrases.selectedPhraseId}
            newPhraseName={newPhraseName}
            onPhraseNameChange={setNewPhraseName}
            onPhraseSelect={phrases.setSelectedPhraseId}
            onCreatePhrase={handleCreatePhrase}
          />
        </div>

        {/* STEP 2: Add Chords to Selected Progression */}
        {phrases.selectedPhrase && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <div style={{ 
                width: 32, 
                height: 32, 
                borderRadius: "50%", 
                background: "#ff8c42",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: 16,
              }}>2</div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>Add Chords to "{phrases.selectedPhrase.name}"</h2>
              <span style={{ opacity: 0.6, fontSize: 13, marginLeft: 8 }}>Select chords and place them in slots</span>
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: 20 }}>
              {/* LEFT: Chord Picker */}
              <div>
                <ChordPicker
                  keyRoot={trackSettings.settings.keyRoot}
                  scaleName={trackSettings.settings.scaleName}
                  scaleChords={scaleChords}
                  allChords={allChords}
                  showAllChords={showAllChords}
                  onChordPick={handleChordPick}
                  onToggleShowAll={() => setShowAllChords((v) => !v)}
                />
              </div>

              {/* RIGHT: Phrase Editor */}
              <div>
                <PhraseEditor
                  phrase={phrases.selectedPhrase}
                  slotCount={trackSettings.slotCount}
                  timeSig={trackSettings.settings.timeSig}
                  selectedSlot={
                    phrases.selectedSlot && phrases.selectedSlot.phraseId === phrases.selectedPhraseId
                      ? { barIndex: phrases.selectedSlot.barIndex, slotIndex: phrases.selectedSlot.slotIndex }
                      : null
                  }
                  onSlotSelect={(barIndex, slotIndex) => {
                    if (phrases.selectedPhraseId) {
                      phrases.setSelectedSlot({
                        phraseId: phrases.selectedPhraseId,
                        barIndex,
                        slotIndex,
                      });
                    }
                  }}
                  onAddBar={() => {
                    if (phrases.selectedPhraseId) {
                      phrases.addBarToPhrase(phrases.selectedPhraseId, trackSettings.slotCount);
                    }
                  }}
                  onDeleteBar={(barIndex) => {
                    if (phrases.selectedPhraseId) {
                      phrases.deleteBar(phrases.selectedPhraseId, barIndex);
                      if (phrases.selectedSlot?.barIndex === barIndex) {
                        phrases.setSelectedSlot(null);
                      }
                    }
                  }}
                  onDeleteChord={(barIndex, slotIndex) => {
                    if (phrases.selectedPhraseId) {
                      phrases.deleteChordInBar(phrases.selectedPhraseId, barIndex, slotIndex);
                      phrases.setSelectedSlot(null);
                    }
                  }}
                  onAuditionChord={(chord) => audio.engine.playChord(chord)}
                  onPresetChange={(preset) => {
                    if (phrases.selectedPhraseId) {
                      phrases.updatePhrasePreset(phrases.selectedPhraseId, preset);
                    }
                  }}
                  onEnsureLoaded={audio.ensureLoaded}
                  onPlayPhrase={handlePlaySelectedPhrase}
                  onAddToArrangement={handleAddToArrangement}
                  isPlaying={playback.isPlaying && playingPhraseId === phrases.selectedPhraseId}
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Build Your Song Arrangement */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <div style={{ 
              width: 32, 
              height: 32, 
              borderRadius: "50%", 
              background: "#ff8c42",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 16,
            }}>3</div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>Build Your Song</h2>
            <span style={{ opacity: 0.6, fontSize: 13, marginLeft: 8 }}>Arrange progressions into your final track</span>
          </div>
          <ArrangementView
            arrangement={arrangement.arrangement}
            phrases={phrases.phrases}
            onMoveItem={arrangement.moveItem}
            onRemoveItem={arrangement.removeItem}
            onPlayArrangement={handlePlayArrangement}
            isPlaying={playback.isPlaying}
          />
        </div>
      </div>

    </div>
  );
}
