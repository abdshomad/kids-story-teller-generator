import { useState, useCallback } from 'react';
import { StoryOptions, Character, Language } from '../types';
import { AGE_GROUPS, THEMES, ILLUSTRATION_STYLES } from '../constants';

const createNewCharacter = (): Character => ({
  id: `char-${Date.now()}-${Math.random()}`,
  name: '',
  type: '',
  personality: '',
  visualInspiration: undefined,
});

export const useStoryOptions = (initialLanguage: Language) => {
  const [options, setOptions] = useState<StoryOptions>({
    prompt: '',
    ageGroup: AGE_GROUPS[0].value,
    theme: THEMES[0].value,
    length: 'short',
    illustrationStyle: ILLUSTRATION_STYLES[0].value,
    characters: [createNewCharacter()],
    language: initialLanguage,
  });

  const [characterPreviews, setCharacterPreviews] = useState<Record<string, string>>({});

  const handleInputChange = useCallback(<K extends keyof StoryOptions>(field: K, value: StoryOptions[K]) => {
    setOptions(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleCharacterChange = useCallback((id: string, field: keyof Omit<Character, 'id' | 'visualInspiration'>, value: string) => {
    setOptions(prev => ({
      ...prev,
      characters: prev.characters.map(char =>
        char.id === id ? { ...char, [field]: value } : char
      ),
    }));
  }, []);

  const handleCharacterInspiration = useCallback((id: string, inspiration: Character['visualInspiration'], previewUrl: string) => {
    setOptions(prev => ({
      ...prev,
      characters: prev.characters.map(char =>
        char.id === id ? { ...char, visualInspiration: inspiration } : char
      ),
    }));
    setCharacterPreviews(prev => ({ ...prev, [id]: previewUrl }));
  }, []);

  const addCharacter = useCallback(() => {
    setOptions(prev => ({ ...prev, characters: [...prev.characters, createNewCharacter()] }));
  }, []);

  const removeCharacter = useCallback((id: string) => {
    setOptions(prev => ({ ...prev, characters: prev.characters.filter(char => char.id !== id) }));
    setCharacterPreviews(prev => {
      const newPreviews = { ...prev };
      delete newPreviews[id];
      return newPreviews;
    });
  }, []);
  
  const setCharacters = useCallback((characters: Character[], previews: Record<string, string>) => {
      setOptions(prev => ({ ...prev, characters }));
      setCharacterPreviews(previews);
  }, []);

  return { options, setOptions, characterPreviews, handleInputChange, handleCharacterChange, handleCharacterInspiration, addCharacter, removeCharacter, setCharacters };
};
