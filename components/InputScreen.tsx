

import React, { useState, useEffect, useCallback, useRef, FC } from 'react';
import { StoryOptions } from '../types';
import { AGE_GROUPS, THEMES, STORY_LENGTHS, ILLUSTRATION_STYLES, LANGUAGES } from '../constants';
import { useAppContext } from '../App';
import { useSpeechToText } from '../hooks/useSpeechToText';
import { Mic, Sparkles, Upload, UserRound, Image, SlidersHorizontal, PenSquare, Loader2, ChevronDown } from 'lucide-react';
import FullscreenCanvas from './FullscreenCanvas';
import { extractCharacterDetails, generateSamplePrompts } from '../services/geminiService';

interface InputScreenProps {
  onCreateStory: (options: StoryOptions) => void;
}

const fileToBase64 = (file: File): Promise<{mimeType: string, data: string}> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
        const result = reader.result as string;
        const [mimePart, base64Part] = result.split(',');
        const mimeType = mimePart.split(':')[1].split(';')[0];
        resolve({ mimeType, data: base64Part });
    };
    reader.onerror = (error) => reject(error);
  });
};

const sampleButtonColors = [
    'bg-rose-400 hover:bg-rose-500',
    'bg-violet-400 hover:bg-violet-500',
    'bg-cyan-400 hover:bg-cyan-500',
    'bg-emerald-400 hover:bg-emerald-500',
];

const InputScreen: React.FC<InputScreenProps> = ({ onCreateStory }) => {
  const { language, setLanguage, t } = useAppContext();
  const [options, setOptions] = useState<StoryOptions>({
    prompt: '',
    ageGroup: AGE_GROUPS[0].value,
    theme: THEMES[0].value,
    length: 'short',
    illustrationStyle: ILLUSTRATION_STYLES[0].value,
    characterName: '',
    characterType: '',
    characterPersonality: '',
    language: language,
  });
  const [visualInspirationPreview, setVisualInspirationPreview] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  
  const [samplePrompts, setSamplePrompts] = useState<{ title: string; prompt: string; }[]>([]);
  const [isLoadingSamples, setIsLoadingSamples] = useState(true);
  const [activeSampleIndex, setActiveSampleIndex] = useState(0);
  const [placeholder, setPlaceholder] = useState('');

  const [openSections, setOpenSections] = useState<Set<string>>(new Set());
  
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
  
  const handleCharacterInputChange = useCallback((field: 'characterName' | 'characterType' | 'characterPersonality', value: string) => {
    if (!characterFieldsEditedByUser) {
      setCharacterFieldsEditedByUser(true);
    }
    handleInputChange(field, value);
  }, [characterFieldsEditedByUser, handleInputChange]);

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
    const fetchPrompts = async () => {
      setIsLoadingSamples(true);
      setSamplePrompts([]);
      const prompts = await generateSamplePrompts(language);
      setSamplePrompts(prompts);
      setIsLoadingSamples(false);
    };
    fetchPrompts();
  }, [language]);


  useEffect(() => {
    if (samplePrompts.length > 0) {
      setPlaceholder(samplePrompts[activeSampleIndex % samplePrompts.length].prompt);
    } else {
      setPlaceholder(t('input.prompt.placeholder'));
    }
  }, [activeSampleIndex, samplePrompts, t]);

  useEffect(() => {
    if (options.prompt || samplePrompts.length === 0) {
        return; 
    }
    const intervalId = setInterval(() => {
        setActiveSampleIndex(prevIndex => (prevIndex + 1) % samplePrompts.length);
    }, 4000);
    return () => clearInterval(intervalId);
  }, [options.prompt, samplePrompts]);
  
  useEffect(() => {
    // This effect handles auto-filling character details from the prompt.
    // It only runs if the prompt is not empty and the user has not manually edited the character fields.
    if (options.prompt && !characterFieldsEditedByUser && options.prompt !== lastExtractedPrompt.current) {
        const handler = setTimeout(async () => {
            // Re-check in case the user started editing during the debounce timeout
            if (characterFieldsEditedByUser) return;
            
            const currentPrompt = options.prompt;
            lastExtractedPrompt.current = currentPrompt;
            setIsExtractingCharacter(true);

            try {
                const details = await extractCharacterDetails(currentPrompt, language);
                
                // Final check before setting state to prevent race conditions
                setOptions(prev => {
                    if (prev.prompt === currentPrompt && !characterFieldsEditedByUser) {
                        return {
                            ...prev,
                            characterName: details.characterName || '',
                            characterType: details.characterType || '',
                            characterPersonality: details.characterPersonality || '',
                        };
                    }
                    return prev;
                });
            } catch (error) {
                console.error("Failed to extract character details:", error);
            } finally {
                // Only stop the spinner if this was the last request sent
                if (lastExtractedPrompt.current === currentPrompt) {
                   setIsExtractingCharacter(false);
                }
            }
        }, 1500); // 1.5 second debounce after user stops typing

        return () => {
            clearTimeout(handler);
        };
    }
  }, [options.prompt, language, characterFieldsEditedByUser]);


  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const { mimeType, data } = await fileToBase64(file);
        handleInputChange('visualInspiration', { mimeType, data });
        setVisualInspirationPreview(URL.createObjectURL(file));
      } catch (error) {
        console.error("Error converting file to base64", error);
      }
    }
  };
  
  const handleDrawingDone = (dataUrl: string) => {
    const [mimePart, base64Part] = dataUrl.split(',');
    if (mimePart && base64Part) {
      const mimeType = mimePart.split(':')[1].split(';')[0];
      handleInputChange('visualInspiration', { mimeType, data: base64Part });
      setVisualInspirationPreview(dataUrl);
    }
    setIsDrawing(false);
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

  if (isDrawing) {
      return <FullscreenCanvas onDone={handleDrawingDone} onClose={() => setIsDrawing(false)} />;
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
             <div className="flex flex-wrap justify-center gap-8 my-6">
              {isLoadingSamples ? (
                Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className={`h-10 w-56 rounded-full animate-pulse ${sampleButtonColors[i % sampleButtonColors.length]}`} />
                ))
              ) : (
                samplePrompts.map((sample, i) => {
                    const isActive = i === activeSampleIndex && !options.prompt;
                    return (
                        <button
                            type="button"
                            key={i}
                            onClick={() => handleInputChange('prompt', sample.prompt)}
                            className={`px-5 py-3 text-white font-semibold rounded-full text-sm shadow-md transition-all duration-300 hover:scale-105 whitespace-nowrap ${sampleButtonColors[i % sampleButtonColors.length]} ${isActive ? 'ring-4 ring-offset-2 ring-violet-400 scale-110' : ''}`}
                        >
                            {sample.title}
                        </button>
                    );
                })
              )}
            </div>
          </section>
          
          <div className="grid lg:grid-cols-2 gap-x-12 gap-y-4">
            <div className="space-y-4">
                <section>
                    <button type="button" onClick={() => toggleSection('character')} className="w-full flex justify-between items-center text-xl font-bold text-slate-700 py-2">
                        <span className="flex items-center gap-2">
                            <UserRound className="w-6 h-6 text-purple-500" />
                            {t('input.character.title')}
                            {isExtractingCharacter && <Loader2 className="w-5 h-5 text-purple-500 animate-spin" />}
                        </span>
                        <ChevronDown className={`w-6 h-6 text-slate-500 transition-transform ${openSections.has('character') ? 'rotate-180' : ''}`} />
                    </button>
                    {openSections.has('character') && (
                        <div className="ps-8 animate-fade-in-down">
                            <p className="text-sm text-slate-500 mb-3">{t('input.character.subtitle')}</p>
                            <div className="space-y-1">
                                <input type="text" value={options.characterName} onChange={(e) => handleCharacterInputChange('characterName', e.target.value)} placeholder={t('input.character.name')} className="w-full p-3 bg-white/60 border border-slate-300/80 rounded-lg focus:ring-2 focus:ring-purple-300/50 focus:border-purple-300 transition-all placeholder:text-slate-500"/>
                                <input type="text" value={options.characterType} onChange={(e) => handleCharacterInputChange('characterType', e.target.value)} placeholder={t('input.character.type')} className="w-full p-3 bg-white/60 border border-slate-300/80 rounded-lg focus:ring-2 focus:ring-purple-300/50 focus:border-purple-300 transition-all placeholder:text-slate-500"/>
                                <input type="text" value={options.characterPersonality} onChange={(e) => handleCharacterInputChange('characterPersonality', e.target.value)} placeholder={t('input.character.personality')} className="w-full p-3 bg-white/60 border border-slate-300/80 rounded-lg focus:ring-2 focus:ring-purple-300/50 focus:border-purple-300 transition-all placeholder:text-slate-500"/>
                            </div>
                        </div>
                    )}
                </section>
                <div className="border-t border-slate-300/70"></div>
                <section>
                    <button type="button" onClick={() => toggleSection('visual')} className="w-full flex justify-between items-center text-xl font-bold text-slate-700 py-2">
                        <span className="flex items-center gap-2">
                            <Image className="w-6 h-6 text-sky-500" />
                            {t('input.visualInspiration.label')}
                        </span>
                        <ChevronDown className={`w-6 h-6 text-slate-500 transition-transform ${openSections.has('visual') ? 'rotate-180' : ''}`} />
                    </button>
                    {openSections.has('visual') && (
                        <div className="ps-8 animate-fade-in-down">
                            <div className="bg-slate-100/40 p-4 rounded-xl flex flex-col sm:flex-row items-center justify-center gap-4 text-center">
                                <label className="w-full sm:w-auto cursor-pointer flex items-center justify-center gap-3 p-4 border-2 border-dashed border-slate-300/80 rounded-lg text-slate-600 hover:bg-white/80 hover:border-sky-500 hover:text-sky-600 transition-colors">
                                <Upload className="w-5 h-5" />
                                <span className="font-semibold">{t('input.visualInspiration.uploadDescription')}</span>
                                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                                </label>
                                
                                <span className="font-semibold text-slate-500">or</span>

                                <button type="button" onClick={() => setIsDrawing(true)} className="w-full sm:w-auto cursor-pointer flex items-center justify-center gap-3 p-4 border-2 border-dashed border-slate-300/80 rounded-lg text-slate-600 hover:bg-white/80 hover:border-purple-500 hover:text-purple-600 transition-colors">
                                <PenSquare className="w-5 h-5" />
                                <span className="font-semibold">{t('input.visualInspiration.drawDescription')}</span>
                                </button>
                                
                                {visualInspirationPreview && (
                                <div className="w-full sm:w-auto sm:ms-4 pt-4 sm:pt-0">
                                    <img src={visualInspirationPreview} alt="Preview" className="rounded-lg object-cover h-24 w-24 mx-auto shadow-md"/>
                                </div>
                                )}
                            </div>
                        </div>
                    )}
                </section>
                <div className="border-t border-slate-300/70"></div>
            </div>

            <section>
              <button type="button" onClick={() => toggleSection('options')} className="w-full flex justify-between items-center text-xl font-bold text-slate-700 py-2">
                  <span className="flex items-center gap-2">
                      <SlidersHorizontal className="w-6 h-6 text-emerald-500" />
                      {t('input.options.title')}
                  </span>
                  <ChevronDown className={`w-6 h-6 text-slate-500 transition-transform ${openSections.has('options') ? 'rotate-180' : ''}`} />
              </button>
              {openSections.has('options') && (
                  <div className="space-y-6 pt-2 ps-8 animate-fade-in-down">
                    
                    <div>
                      <label className="block text-sm font-bold text-slate-600 mb-2">{t('input.options.age')}</label>
                      <div className="grid grid-cols-2 gap-3">
                        {AGE_GROUPS.map(opt => (
                          <button
                            type="button"
                            key={opt.value}
                            onClick={() => handleInputChange('ageGroup', opt.value)}
                            className={`w-full p-3 rounded-lg text-sm font-bold transition-all text-center border ${
                              options.ageGroup === opt.value
                                ? 'bg-purple-500 text-white shadow-md border-purple-500'
                                : 'bg-white/60 text-slate-700 hover:bg-white/90 border-slate-300/80'
                            }`}
                          >
                            {t(opt.labelKey)}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-600 mb-2">{t('input.options.theme')}</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {THEMES.map(opt => {
                          const Icon = opt.icon;
                          return (
                            <button
                              type="button"
                              key={opt.value}
                              onClick={() => handleInputChange('theme', opt.value)}
                              className={`w-full p-3 rounded-lg text-sm font-bold transition-all border flex flex-col items-center gap-2 ${
                                options.theme === opt.value
                                  ? 'bg-purple-500 text-white shadow-md border-purple-500'
                                  : 'bg-white/60 text-slate-700 hover:bg-white/90 border-slate-300/80'
                              }`}
                            >
                              <Icon className="w-6 h-6" />
                              <span>{t(opt.labelKey)}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-bold text-slate-600 mb-2">{t('input.options.length')}</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {STORY_LENGTHS.map(opt => (
                          <button
                            type="button"
                            key={opt.value}
                            onClick={() => handleInputChange('length', opt.value as StoryOptions['length'])}
                            className={`w-full p-3 rounded-lg text-sm font-bold transition-all text-center border ${
                              options.length === opt.value
                                ? 'bg-purple-500 text-white shadow-md border-purple-500'
                                : 'bg-white/60 text-slate-700 hover:bg-white/90 border-slate-300/80'
                            }`}
                          >
                            {t(opt.labelKey)}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-slate-600 mb-2">{t('input.options.style')}</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {ILLUSTRATION_STYLES.map(opt => {
                          const Icon = opt.icon;
                          return (
                            <button
                              type="button"
                              key={opt.value}
                              onClick={() => handleInputChange('illustrationStyle', opt.value)}
                              className={`w-full p-3 rounded-lg text-sm font-bold transition-all border flex flex-col items-center gap-2 ${
                                options.illustrationStyle === opt.value
                                  ? 'bg-purple-500 text-white shadow-md border-purple-500'
                                  : 'bg-white/60 text-slate-700 hover:bg-white/90 border-slate-300/80'
                              }`}
                            >
                              <Icon className="w-6 h-6" />
                              <span>{t(opt.labelKey)}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                  </div>
              )}
            </section>
          </div>
          
          <div className="text-center pt-2">
            <button type="submit" className="w-full sm:w-auto bg-fuchsia-600 text-white font-bold tracking-wider py-4 px-10 rounded-full hover:bg-fuchsia-700 focus:outline-none focus:ring-4 focus:ring-fuchsia-300 transition-all duration-300 shadow-lg text-lg">
              {t('input.button.create')}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default InputScreen;