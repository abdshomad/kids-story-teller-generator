

import { useState, useEffect, useCallback, useRef } from 'react';
import { ELEVENLABS_API_KEY } from '../env';

const VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // Rachel - good for storytelling
const API_URL = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`;

// Polyfill for webkit browsers
const AudioContext = window.AudioContext || (window as any).webkitAudioContext;

export const useTextToSpeech = (language: string) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    // Check if the browser supports Web Audio API
    if (AudioContext) {
      setIsSupported(true);
      // Initialize AudioContext. It's best practice to create it once.
      audioContextRef.current = new AudioContext();
    } else {
      setIsSupported(false);
      console.warn('Web Audio API is not supported in this browser.');
    }

    // Cleanup function to cancel speech and close audio context
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
      // Stop the sound. The onended event will fire, which handles cleanup.
      audioSourceRef.current.onended = null; // Prevent onEnd from firing on manual cancel
      audioSourceRef.current.stop();
      audioSourceRef.current = null;
    }
    setIsSpeaking(false);
  }, []);

  const speak = useCallback(async (text: string, onEnd: () => void) => {
    if (!ELEVENLABS_API_KEY) {
      console.error("ELEVENLABS_API_KEY not found. Text-to-speech will fail.");
      onEnd();
      return;
    }

    if (!isSupported || isSpeaking || !audioContextRef.current) return;
    
    // Resume AudioContext if it's suspended (browser autoplay policies)
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }

    setIsSpeaking(true);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text: text,
          model_id: 'eleven_multilingual_v2', // Good for both English and Indonesian
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(`ElevenLabs API error: ${response.status} - ${JSON.stringify(errorBody)}`);
      }
      
      const audioData = await response.arrayBuffer();
      const audioBuffer = await audioContextRef.current.decodeAudioData(audioData);

      // If a sound is already playing, stop it before starting the new one.
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
      console.error('Text-to-speech error:', error);
      setIsSpeaking(false);
      // call onEnd to allow the app to proceed even if TTS fails for one page
      onEnd();
    }
  }, [isSupported, isSpeaking, language]);

  return { isSpeaking, speak, cancel, isSupported };
};