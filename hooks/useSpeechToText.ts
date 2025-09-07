import { useState, useRef, useCallback } from 'react';
import { transcribeAudio } from '../services/geminiService';
import { Language } from '../types';

const blobToBase64 = (blob: Blob): Promise<{ mimeType: string; data: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const [mimePart, base64Part] = result.split(',');
      if (!mimePart || !base64Part) {
        reject(new Error("Invalid data URL format"));
        return;
      }
      const mimeType = mimePart.split(':')[1].split(';')[0];
      resolve({ mimeType, data: base64Part });
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const useSpeechToText = (language: Language) => {
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const browserSupportsSpeechRecognition = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

  const stopListening = useCallback(async () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const startListening = useCallback(async () => {
    if (isListening || isTranscribing || !browserSupportsSpeechRecognition) return;

    setTranscript('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const options = { mimeType: 'audio/webm' };
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        console.warn(`${options.mimeType} is not supported. Trying default.`);
      }
      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: options.mimeType });
        
        stream.getTracks().forEach(track => track.stop());

        setIsListening(false);
        setIsTranscribing(true);
        try {
          const audioData = await blobToBase64(audioBlob);
          const result = await transcribeAudio(audioData, language);
          setTranscript(result);
        } catch (error) {
          console.error('Error transcribing audio:', error);
        } finally {
          setIsTranscribing(false);
        }
      };

      mediaRecorder.start();
      setIsListening(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  }, [isListening, isTranscribing, browserSupportsSpeechRecognition, language]);

  return {
    isListening,
    isTranscribing,
    transcript,
    startListening,
    stopListening,
    setTranscript,
    browserSupportsSpeechRecognition,
  };
};
