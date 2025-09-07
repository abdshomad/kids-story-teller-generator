


import { useState, useEffect, useCallback, useRef } from 'react';

// Polyfill for webkit browsers
const AudioContext = window.AudioContext || (window as any).webkitAudioContext;

export const useTextToSpeech = (language: string) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    if (AudioContext) {
      setIsSupported(true);
      audioContextRef.current = new AudioContext();
    } else {
      setIsSupported(false);
      console.warn('Web Audio API is not supported in this browser.');
    }

    return () => {
      if (audioSourceRef.current) {
        audioSourceRef.current.stop();
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);
  
  const cancel = useCallback(() => {
    if (audioSourceRef.current) {
      audioSourceRef.current.onended = null; 
      audioSourceRef.current.stop();
      audioSourceRef.current = null;
    }
    setIsSpeaking(false);
  }, []);

  const speak = useCallback(async (audioUrl: string, onEnd: () => void) => {
    if (!isSupported || isSpeaking || !audioContextRef.current) {
        onEnd();
        return;
    }
    
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }

    setIsSpeaking(true);

    try {
      const response = await fetch(audioUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch audio from URL: ${response.statusText}`);
      }
      
      const audioData = await response.arrayBuffer();
      const audioBuffer = await audioContextRef.current.decodeAudioData(audioData);

      if (audioSourceRef.current) {
        audioSourceRef.current.stop();
      }
      
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      
      source.onended = () => {
        setIsSpeaking(false);
        audioSourceRef.current = null;
        onEnd();
      };
      
      source.start(0);
      audioSourceRef.current = source;

    } catch (error) {
      console.error('Audio playback error:', error);
      setIsSpeaking(false);
      onEnd();
    }
  }, [isSupported, isSpeaking, language]);

  return { isSpeaking, speak, cancel, isSupported };
};