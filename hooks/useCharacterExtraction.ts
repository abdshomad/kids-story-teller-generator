import { useState, useRef, useEffect } from 'react';
import { extractAndGenerateCharacters } from '../services/analysisService';
import { Character, Language } from '../types';
import { CHARACTER_VOICES } from '../constants';

type SetterFn = (characters: Character[], previews: Record<string, string>) => void;
// FIX: Added missing 'voiceId' property to conform to the Character type.
const createNewCharacter = (): Character => ({ id: `char-${Date.now()}`, name: '', type: '', personality: '', voiceId: CHARACTER_VOICES[0].id });

export const useCharacterExtraction = (prompt: string, language: Language, setCharacters: SetterFn, characterFieldsEdited: boolean) => {
  const [isExtractingCharacter, setIsExtractingCharacter] = useState(false);
  const lastExtractedPrompt = useRef('');

  useEffect(() => {
    if (prompt && !characterFieldsEdited && prompt !== lastExtractedPrompt.current) {
      const handler = setTimeout(async () => {
        if (characterFieldsEdited) return;
        const currentPrompt = prompt;
        lastExtractedPrompt.current = currentPrompt;
        setIsExtractingCharacter(true);

        try {
          const extracted = await extractAndGenerateCharacters(currentPrompt, language);
          if (lastExtractedPrompt.current === currentPrompt && !characterFieldsEdited) {
            if (extracted.length > 0) {
              // FIX: Added missing 'voiceId' property to conform to the Character type.
              const newChars = extracted.map(c => ({ id: `char-${Date.now()}-${Math.random()}`, name: c.name || '', type: c.type || '', personality: c.personality || '', visualInspiration: c.visualInspiration, voiceId: CHARACTER_VOICES[0].id }));
              const newPreviews = extracted.reduce((acc, char, i) => {
                if (char.previewUrl) acc[newChars[i].id] = char.previewUrl;
                return acc;
              }, {} as Record<string, string>);
              setCharacters(newChars, newPreviews);
            } else {
              setCharacters([createNewCharacter()], {});
            }
          }
        } catch (error) {
          console.error("Failed to extract characters:", error);
        } finally {
          if (lastExtractedPrompt.current === currentPrompt) setIsExtractingCharacter(false);
        }
      }, 1500);

      return () => clearTimeout(handler);
    }
  }, [prompt, language, characterFieldsEdited, setCharacters]);

  return { isExtractingCharacter };
};