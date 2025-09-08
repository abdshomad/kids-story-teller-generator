import { useState, useEffect, useCallback, useRef } from 'react';

// Polyfill for webkit browsers
const AudioContext = window.AudioContext || (window as any).webkitAudioContext;

export const useTextToSpeech = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    try {
      const context = new AudioContext();
      audioContextRef.current = context;
      setIsSupported(true);
    } catch (e) {
      setIsSupported(false);
      console.warn('Web Audio API is not supported in this browser.');
    }

    return () => {
      if (audioSourceRef.current) {
        audioSourceRef.current.stop();
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(e => console.error("Error closing AudioContext", e));
      }
    };
  }, []);
  
  const cancel = useCallback(() => {
    if (audioSourceRef.current) {
      audioSourceRef.current.onended = null; 
      try {
        audioSourceRef.current.stop();
      } catch(e) {
        // Ignore errors from stopping an already stopped source
      }
      audioSourceRef.current = null;
    }
    setIsSpeaking(false);
  }, []);

  const speak = useCallback(async (audioUrl: string, onEnd: () => void) => {
    if (!isSupported || !audioContextRef.current) {
        onEnd();
        return;
    }
    // Cancel any currently playing audio before starting new playback
    if (isSpeaking) {
        cancel();
    }
    
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }

    setIsSpeaking(true);

    try {
      const response = await fetch(audioUrl);
      if (!response.ok) throw new Error(`Failed to fetch audio: ${response.statusText}`);
      
      const audioData = await response.arrayBuffer();
      // Ensure context is still valid after async operations
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') return;
      
      const audioBuffer = await audioContextRef.current.decodeAudioData(audioData);

      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      
      source.onended = () => {
        setIsSpeaking(false);
        if (audioSourceRef.current === source) { // Ensure it's the current source
          audioSourceRef.current = null;
          onEnd();
        }
      };
      
      source.start(0);
      audioSourceRef.current = source;

    } catch (error) {
      console.error('Audio playback error:', error);
      setIsSpeaking(false);
      onEnd();
    }
  }, [isSupported, isSpeaking, cancel]);

  return { isSpeaking, speak, cancel, isSupported };
};