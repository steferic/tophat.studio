import React, { useEffect, useState, useCallback } from 'react';
import { SOUND_SLOTS, type SoundSlotId } from '../audio/soundSlots';
import {
  loadCardRecordings,
  getCachedRecording,
  saveRecording,
  deleteRecording,
  playCustomSound,
  DEFAULT_EFFECTS,
  type StoredRecording,
  type AudioEffects,
} from '../audio/recordingStore';
import { useAudioRecorder } from '../audio/useAudioRecorder';
import { SoundSlotEditor } from './SoundSlotEditor';

interface AudioEditorPanelProps {
  cardId: string;
}

export const AudioEditorPanel: React.FC<AudioEditorPanelProps> = ({ cardId }) => {
  const [loaded, setLoaded] = useState(false);
  const [recordings, setRecordings] = useState<Record<SoundSlotId, StoredRecording | null>>({
    'battle-cry': null,
    'hit-react': null,
    'status-react': null,
  });
  const [activeSlot, setActiveSlot] = useState<SoundSlotId | null>(null);
  const { isRecording, startRecording, stopRecording, error } = useAudioRecorder();

  // Load recordings from IndexedDB on mount
  useEffect(() => {
    loadCardRecordings(cardId).then(() => {
      setRecordings({
        'battle-cry': getCachedRecording(cardId, 'battle-cry'),
        'hit-react': getCachedRecording(cardId, 'hit-react'),
        'status-react': getCachedRecording(cardId, 'status-react'),
      });
      setLoaded(true);
    });
  }, [cardId]);

  const refreshSlot = useCallback(
    (slotId: SoundSlotId) => {
      setRecordings((prev) => ({
        ...prev,
        [slotId]: getCachedRecording(cardId, slotId),
      }));
    },
    [cardId],
  );

  const handleRecord = useCallback(
    async (slotId: SoundSlotId) => {
      setActiveSlot(slotId);
      await startRecording();
    },
    [startRecording],
  );

  const handleStopRecord = useCallback(
    async (slotId: SoundSlotId) => {
      const buf = await stopRecording();
      await saveRecording(cardId, slotId, buf, 1.0, DEFAULT_EFFECTS);
      refreshSlot(slotId);
      setActiveSlot(null);
    },
    [stopRecording, cardId, refreshSlot],
  );

  const handlePlay = useCallback(
    (slotId: SoundSlotId) => {
      playCustomSound(cardId, slotId);
    },
    [cardId],
  );

  const handlePitchChange = useCallback(
    async (slotId: SoundSlotId, rate: number) => {
      const rec = getCachedRecording(cardId, slotId);
      if (!rec) return;
      await saveRecording(cardId, slotId, rec.audioData, rate, rec.effects);
      refreshSlot(slotId);
    },
    [cardId, refreshSlot],
  );

  const handleEffectToggle = useCallback(
    async (slotId: SoundSlotId, effect: keyof AudioEffects) => {
      const rec = getCachedRecording(cardId, slotId);
      if (!rec) return;
      const effectParams = rec.effects[effect];
      const updated: AudioEffects = {
        ...rec.effects,
        [effect]: { ...effectParams, enabled: !effectParams.enabled },
      };
      await saveRecording(cardId, slotId, rec.audioData, rec.pitchRate, updated);
      refreshSlot(slotId);
    },
    [cardId, refreshSlot],
  );

  const handleEffectParamChange = useCallback(
    async (slotId: SoundSlotId, effect: keyof AudioEffects, param: string, value: number) => {
      const rec = getCachedRecording(cardId, slotId);
      if (!rec) return;
      const effectParams = rec.effects[effect];
      const updated: AudioEffects = {
        ...rec.effects,
        [effect]: { ...effectParams, [param]: value },
      };
      await saveRecording(cardId, slotId, rec.audioData, rec.pitchRate, updated);
      refreshSlot(slotId);
    },
    [cardId, refreshSlot],
  );

  const handleDelete = useCallback(
    async (slotId: SoundSlotId) => {
      await deleteRecording(cardId, slotId);
      refreshSlot(slotId);
    },
    [cardId, refreshSlot],
  );

  if (!loaded) {
    return (
      <div style={{ padding: 12, color: '#888', fontSize: 10, textAlign: 'center' }}>
        Loading...
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        padding: '8px 6px',
      }}
    >
      <div style={{ fontSize: 10, fontWeight: 700, color: '#e8d44d', textAlign: 'center' }}>
        Voice Recordings
      </div>

      {error && (
        <div style={{ fontSize: 8, color: '#f87171', textAlign: 'center' }}>{error}</div>
      )}

      {SOUND_SLOTS.map((slot) => (
        <SoundSlotEditor
          key={slot.id}
          slot={slot}
          recording={recordings[slot.id]}
          isRecording={isRecording && activeSlot === slot.id}
          onRecord={() => handleRecord(slot.id)}
          onStopRecord={() => handleStopRecord(slot.id)}
          onPlay={() => handlePlay(slot.id)}
          onPitchChange={(rate) => handlePitchChange(slot.id, rate)}
          onEffectToggle={(effect) => handleEffectToggle(slot.id, effect)}
          onEffectParamChange={(effect, param, value) =>
            handleEffectParamChange(slot.id, effect, param, value)
          }
          onDelete={() => handleDelete(slot.id)}
        />
      ))}

      <style>{`
        @keyframes pulse-rec {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};
