
import { useState, useEffect, useCallback } from 'react';

export const useTextToSpeech = (language: string) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    setIsSupported(typeof window !== 'undefined' && 'speechSynthesis' in window);
    // Cleanup function to cancel speech when component unmounts or language changes
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speak = useCallback((text: string, onEnd: () => void) => {
    if (!isSupported || isSpeaking) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'id' ? 'id-ID' : 'en-US';
    
    // Find a suitable voice
    const voices = window.speechSynthesis.getVoices();
    let selectedVoice = voices.find(voice => voice.lang === utterance.lang);
    if (!selectedVoice) {
        selectedVoice = voices.find(voice => voice.lang.startsWith(language));
    }
    if(selectedVoice) {
        utterance.voice = selectedVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      onEnd();
    };
    utterance.onerror = (e) => {
      console.error('Speech synthesis error', e);
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  }, [isSupported, isSpeaking, language]);

  const cancel = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [isSupported]);

  return { isSpeaking, speak, cancel, isSupported };
};
