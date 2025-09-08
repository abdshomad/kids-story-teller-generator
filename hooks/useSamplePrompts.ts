
import { useState, useCallback, useEffect } from 'react';
import { generateSamplePrompts } from '../services/analysisService';
import { Language } from '../types';

export const useSamplePrompts = (language: Language) => {
  const [samplePrompts, setSamplePrompts] = useState<{ title: string; prompt: string; }[]>([]);
  const [isLoadingSamples, setIsLoadingSamples] = useState(true);

  const fetchInitialPrompts = useCallback(async () => {
    setIsLoadingSamples(true);
    setSamplePrompts([]);
    try {
        const prompts = await generateSamplePrompts(language);
        setSamplePrompts(prompts);
    } catch (e) {
        console.error("Failed to fetch initial prompts", e);
    } finally {
        setIsLoadingSamples(false);
    }
  }, [language]);

  const addMorePrompts = useCallback(async () => {
    setIsLoadingSamples(true);
    try {
        const newPrompts = await generateSamplePrompts(language, samplePrompts);
        setSamplePrompts(prev => [...prev, ...newPrompts]);
    } catch (e) {
        console.error("Failed to add more prompts", e);
    } finally {
        setIsLoadingSamples(false);
    }
  }, [language, samplePrompts]);
  
  useEffect(() => {
    fetchInitialPrompts();
  }, [fetchInitialPrompts]);

  return { samplePrompts, isLoadingSamples, addMorePrompts };
};
