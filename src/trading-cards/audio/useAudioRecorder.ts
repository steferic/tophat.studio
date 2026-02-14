import { useState, useRef, useCallback, useEffect } from 'react';

export interface UseAudioRecorderReturn {
  isRecording: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<ArrayBuffer>;
  error: string | null;
}

export function useAudioRecorder(): UseAudioRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const resolveRef = useRef<((buf: ArrayBuffer) => void) | null>(null);

  // Clean up stream tracks on unmount
  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const startRecording = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        const buf = await blob.arrayBuffer();
        // Stop all tracks
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        resolveRef.current?.(buf);
        resolveRef.current = null;
      };

      recorder.start();
      setIsRecording(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Microphone access denied');
    }
  }, []);

  const stopRecording = useCallback((): Promise<ArrayBuffer> => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    });
  }, []);

  return { isRecording, startRecording, stopRecording, error };
}
