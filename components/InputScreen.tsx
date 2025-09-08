
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StoryOptions, Character } from '../types';
import { AGE_GROUPS, THEMES, STORY_LENGTHS, ILLUSTRATION_STYLES, LANGUAGES } from '../constants';
import { useAppContext } from '../App';
import { useSpeechToText } from '../hooks/useSpeechToText';
import { Mic, Sparkles, UserRound, SlidersHorizontal, Loader2, Plus } from 'lucide-react';
import FullscreenCanvas from './FullscreenCanvas';
import { extractAndGenerateCharacters } from '../services/geminiService';
import Section from './input/Section';
import CharacterCard from './input/CharacterCard';
import OptionSelector from './input/OptionSelector';

interface InputScreenProps {
  onCreateStory: (options: StoryOptions) => void;
  samplePrompts: { title: string; prompt: string; }[];
  isLoadingSamples: boolean;
  addMorePrompts: () => void;
}

const sampleButtonColors = [
    'bg-rose-400 hover:bg-rose-500',
    'bg-violet-400 hover:bg-violet-500',
    'bg-cyan-400 hover:bg-cyan-500',
    'bg-emerald-400 hover:bg-emerald-500',
];

const createNewCharacter = (): Character => ({
  id: `char-${Date.now()}-${Math.random()}`,
  name: '',
  type: '',
  personality: '',
  visualInspiration: undefined,
});

const InputScreen: React.FC<InputScreenProps> = ({ onCreateStory, samplePrompts, isLoadingSamples, addMorePrompts }) => {
  const { language, setLanguage, t } = useAppContext();
  const [options, setOptions] = useState<StoryOptions>({
    prompt: '',
    ageGroup: AGE_GROUPS[0].value,
    theme: THEMES[0].value,
    length: 'short',
    illustrationStyle: ILLUSTRATION_STYLES[0].value,
    characters: [createNewCharacter()],
    language: language,
  });
  
  const [characterPreviews, setCharacterPreviews] = useState<Record<string, string>>({});
  const [drawingCharacterId, setDrawingCharacterId] = useState<string | null>(null);
  
  const [activeSampleIndex, setActiveSampleIndex] = useState(0);
  const [placeholder, setPlaceholder] = useState('');

  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['character']));
  
  const [characterFieldsEditedByUser, setCharacterFieldsEditedByUser] = useState(false);
  const [isExtractingCharacter, setIsExtractingCharacter] = useState(false);
  const lastExtractedPrompt = useRef('');
  
  const toggleSection = (section: string) => {
    setOpenSections(prev => {
        const newSet = new Set(prev);
        if (newSet.has(section)) {
            newSet.delete(section);
        } else {
            newSet.add(section);
        }
        return newSet;
    });
  };

  const { isListening, isTranscribing, transcript, startListening, stopListening, setTranscript, browserSupportsSpeechRecognition, error, clearError } = useSpeechToText(language);

  const handleInputChange = useCallback(<K extends keyof StoryOptions>(field: K, value: StoryOptions[K]) => {
    if (field === 'prompt' && error) {
      clearError();
    }
    setOptions(prev => ({ ...prev, [field]: value }));
  }, [error, clearError]);
  
  const handleCharacterChange = useCallback((id: string, field: keyof Omit<Character, 'id' | 'visualInspiration'>, value: string) => {
    if (!characterFieldsEditedByUser) {
        setCharacterFieldsEditedByUser(true);
    }
    setOptions(prev => ({
        ...prev,
        characters: prev.characters.map(char =>
            char.id === id ? { ...char, [field]: value } : char
        ),
    }));
  }, [characterFieldsEditedByUser]);

  const handleCharacterInspiration = useCallback((id: string, inspiration: Character['visualInspiration'], previewUrl: string) => {
    setOptions(prev => ({
        ...prev,
        characters: prev.characters.map(char =>
            char.id === id ? { ...char, visualInspiration: inspiration } : char
        ),
    }));
    setCharacterPreviews(prev => ({ ...prev, [id]: previewUrl }));
  }, []);

  const addCharacter = () => {
    setOptions(prev => ({
        ...prev,
        characters: [...prev.characters, createNewCharacter()],
    }));
  };
  
  const removeCharacter = (id: string) => {
    setOptions(prev => ({
        ...prev,
        characters: prev.characters.filter(char => char.id !== id),
    }));
    setCharacterPreviews(prev => {
        const newPreviews = { ...prev };
        delete newPreviews[id];
        return newPreviews;
    });
  };

  useEffect(() => {
    handleInputChange('language', language);
  }, [language, handleInputChange]);

  useEffect(() => {
    if (transcript) {
      setOptions(prev => ({ ...prev, prompt: prev.prompt ? `${prev.prompt} ${transcript}` : transcript }));
      setTranscript('');
    }
  }, [transcript, setTranscript]);

  useEffect(() => {
    const examplePlaceholder = "Lily's favorite teddy bear, Barnaby, seems to be a regular toy. But at night, Barnaby whispers exciting secrets about the day's adventures. What amazing things does he tell Lily?";
    if (samplePrompts.length > 0) {
      const allPlaceholders = [examplePlaceholder, ...samplePrompts.map(p => p.prompt)];
      setPlaceholder(allPlaceholders[activeSampleIndex % allPlaceholders.length]);
    } else {
      setPlaceholder(examplePlaceholder);
    }
  }, [activeSampleIndex, samplePrompts, t]);


  useEffect(() => {
    if (options.prompt || samplePrompts.length === 0) {
        return; 
    }
    const intervalId = setInterval(() => {
        setActiveSampleIndex(prevIndex => {
            const totalPlaceholders = samplePrompts.length + 1; // +1 for the static example
            return (prevIndex + 1) % totalPlaceholders;
        });
    }, 4000);
    return () => clearInterval(intervalId);
  }, [options.prompt, samplePrompts]);
  
  
  useEffect(() => {
    if (options.prompt && !characterFieldsEditedByUser && options.prompt !== lastExtractedPrompt.current) {
        const handler = setTimeout(async () => {
            if (characterFieldsEditedByUser) return;
            
            const currentPrompt = options.prompt;
            lastExtractedPrompt.current = currentPrompt;
            setIsExtractingCharacter(true);

            try {
                const extractedChars: (Partial<Character> & { previewUrl?: string })[] = await extractAndGenerateCharacters(currentPrompt, language);
                
                if (lastExtractedPrompt.current === currentPrompt && !characterFieldsEditedByUser) {
                    if (extractedChars.length > 0) {
                        const newCharacters = extractedChars.map(char => ({
                            id: `char-${Date.now()}-${Math.random()}`,
                            name: char.name || '',
                            type: char.type || '',
                            personality: char.personality || '',
                            visualInspiration: char.visualInspiration,
                        }));
                        
                        const newPreviews = extractedChars.reduce((acc, char, index) => {
                            if (char.previewUrl) {
                                acc[newCharacters[index].id] = char.previewUrl;
                            }
                            return acc;
                        }, {} as Record<string, string>);

                        setOptions(prev => ({ ...prev, characters: newCharacters }));
                        setCharacterPreviews(newPreviews);
                    } else {
                        setOptions(prev => ({...prev, characters: [createNewCharacter()]}));
                        setCharacterPreviews({});
                    }
                }
            } catch (error) {
                console.error("Failed to extract and generate characters:", error);
                 if (lastExtractedPrompt.current === currentPrompt) {
                    setOptions(prev => ({...prev, characters: [createNewCharacter()]}));
                    setCharacterPreviews({});
                 }
            } finally {
                if (lastExtractedPrompt.current === currentPrompt) {
                   setIsExtractingCharacter(false);
                }
            }
        }, 1500); // 1.5 second debounce

        return () => {
            clearTimeout(handler);
        };
    }
}, [options.prompt, language, characterFieldsEditedByUser]);
  
  const handleDrawingDone = (dataUrl: string) => {
    if (drawingCharacterId) {
        const [mimePart, base64Part] = dataUrl.split(',');
        if (mimePart && base64Part) {
            const mimeType = mimePart.split(':')[1].split(';')[0];
            handleCharacterInspiration(drawingCharacterId, { mimeType, data: base64Part }, dataUrl);
        }
    }
    setDrawingCharacterId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (options.prompt.trim()) {
      onCreateStory(options);
    }
  };

  const handleMicClick = useCallback(() => {
    if (isListening) {
      stopListening();
    } else if (!isTranscribing) {
      startListening();
    }
  }, [isListening, isTranscribing, startListening, stopListening]);

  if (drawingCharacterId) {
      return <FullscreenCanvas onDone={handleDrawingDone} onClose={() => setDrawingCharacterId(null)} />;
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-pink-100 via-purple-100 to-blue-200 p-4 sm:p-8 flex items-center justify-center">
      <style>{`
        @keyframes fadeInDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-down {
          animation: fadeInDown 0.3s ease-out forwards;
        }
      `}</style>
      <main className="bg-white/70 backdrop-blur-xl border border-white/30 rounded-3xl shadow-2xl max-w-6xl w-full p-8 sm:p-12">
        <header className="flex flex-col items-center gap-6 mb-8">
          <div className="flex items-center gap-1 bg-gray-200/50 rounded-full p-1 shadow-inner">
            {LANGUAGES.map(lang => (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={`px-3 py-1 text-sm font-bold rounded-full transition-colors ${language === lang.code ? 'bg-white shadow-md text-slate-800' : 'text-slate-500 hover:bg-white/60'}`}
              >
                {lang.label}
              </button>
            ))}
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-800 flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-fuchsia-500" />
            {t('input.title')}
          </h1>
        </header>

        <form onSubmit={handleSubmit} className="space-y-8">
          <section>
            <div className="relative">
              <textarea
                value={options.prompt}
                onChange={(e) => handleInputChange('prompt', e.target.value)}
                placeholder={placeholder}
                className="w-full p-4 pe-16 text-lg bg-white/60 border border-slate-300/80 rounded-xl focus:ring-4 focus:ring-fuchsia-300/50 focus:border-fuchsia-300 transition-all placeholder:text-slate-500 resize-none"
                rows={3}
                required
              />
              {browserSupportsSpeechRecognition && (
                <button
                  type="button"
                  onClick={handleMicClick}
                  disabled={isTranscribing}
                  aria-label={isListening ? 'Stop recording' : (isTranscribing ? 'Processing audio' : 'Start recording')}
                  className={`absolute top-4 end-4 p-3 rounded-full transition-all duration-300 ${
                      isListening
                          ? 'bg-red-500 text-white animate-pulse shadow-lg'
                          : 'bg-white/80 text-slate-600 hover:bg-white'
                  } disabled:bg-slate-200 disabled:cursor-not-allowed`}
                >
                  {isTranscribing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mic className="w-5 h-5" />}
                </button>
              )}
            </div>
             {error && <p className="text-red-600 text-sm mt-2 text-center" role="alert">{t(error)}</p>}
             <div className="flex flex-wrap justify-center items-center gap-x-4 gap-y-4 my-6">
              {(isLoadingSamples && samplePrompts.length === 0) ? (
                Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className={`h-12 w-48 rounded-full animate-pulse ${sampleButtonColors[i % sampleButtonColors.length]}`} />
                ))
              ) : (
                <>
                  {samplePrompts.map((sample, i) => {
                      const isActive = (i + 1) === (activeSampleIndex % (samplePrompts.length + 1)) && !options.prompt;
                      return (
                        <div key={i} className="flex flex-col items-center">
                          <button
                            type="button"
                            onClick={() => handleInputChange('prompt', sample.prompt)}
                            className={`text-sm font-bold text-white px-4 py-2 rounded-full shadow-lg transition-all duration-300 ${sampleButtonColors[i % sampleButtonColors.length]}`}
                          >
                            {sample.title}
                          </button>
                          {isActive && <div className="mt-1 w-2 h-2 bg-slate-500 rounded-full animate-fade-in-down"></div>}
                        </div>
                      );
                  })}
                  <button type="button" onClick={addMorePrompts} disabled={isLoadingSamples} className="text-sm font-bold text-slate-600 hover:text-fuchsia-600 disabled:text-slate-400 transition-colors flex items-center gap-1">
                    {isLoadingSamples ? <Loader2 className="w-4 h-4 animate-spin"/> : <Sparkles className="w-4 h-4"/>}
                    {t('input.samples.addMore')}
                  </button>
                </>
              )}
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Section title={t('input.character.title')} icon={<UserRound />} id="character" isOpen={openSections.has('character')} onToggle={toggleSection} isLoading={isExtractingCharacter}>
              <p className="text-sm text-slate-600 mb-4">{t('input.character.subtitle')}</p>
              <div className="space-y-6">
                {options.characters.map((char) => (
                  <CharacterCard
                    key={char.id}
                    character={char}
                    previewUrl={characterPreviews[char.id]}
                    onChange={handleCharacterChange}
                    onInspirationChange={handleCharacterInspiration}
                    onDrawClick={setDrawingCharacterId}
                    onRemove={options.characters.length > 1 ? removeCharacter : undefined}
                    isOnlyCharacter={options.characters.length === 1}
                  />
                ))}
              </div>
              <button type="button" onClick={addCharacter} className="mt-4 flex items-center gap-2 text-sm font-bold text-fuchsia-600 hover:text-fuchsia-700 transition-colors">
                <Plus className="w-4 h-4" />
                Add Another Character
              </button>
            </Section>

            <Section title={t('input.options.title')} icon={<SlidersHorizontal />} id="options" isOpen={openSections.has('options')} onToggle={toggleSection}>
              <div className="space-y-4">
                <OptionSelector label={t('input.options.age')} value={options.ageGroup} onChange={(v) => handleInputChange('ageGroup', v)} options={AGE_GROUPS.map(o => ({ ...o, label: t(o.labelKey)}))} />
                <OptionSelector label={t('input.options.theme')} value={options.theme} onChange={(v) => handleInputChange('theme', v)} options={THEMES.map(o => ({ ...o, label: t(o.labelKey)}))} />
                <OptionSelector label={t('input.options.length')} value={options.length} onChange={(v) => handleInputChange('length', v as any)} options={STORY_LENGTHS.map(o => ({ ...o, label: t(o.labelKey)}))} />
                <OptionSelector label={t('input.options.style')} value={options.illustrationStyle} onChange={(v) => handleInputChange('illustrationStyle', v)} options={ILLUSTRATION_STYLES.map(o => ({ ...o, label: t(o.labelKey)}))} />
              </div>
            </Section>
          </div>

          <div className="text-center pt-4">
            <button
              type="submit"
              disabled={!options.prompt.trim() || isTranscribing}
              className="px-10 py-4 bg-fuchsia-600 text-white font-extrabold text-lg rounded-full shadow-lg hover:bg-fuchsia-700 transition-all duration-300 disabled:bg-slate-400 disabled:cursor-not-allowed"
            >
              {t('input.button.create')}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default InputScreen;
