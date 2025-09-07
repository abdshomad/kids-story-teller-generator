import React, { useState, useEffect, useCallback, useRef, FC } from 'react';
import { StoryOptions } from '../types';
import { AGE_GROUPS, THEMES, STORY_LENGTHS, ILLUSTRATION_STYLES, SAMPLE_PROMPTS, LANGUAGES } from '../constants';
import { useAppContext } from '../App';
import { useSpeechToText } from '../hooks/useSpeechToText';
import { Mic, Sparkles, Upload, UserRound, Image, SlidersHorizontal, PenSquare, Loader2, Globe, Search } from 'lucide-react';
import FullscreenCanvas from './FullscreenCanvas';

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
  
  const [activeSampleIndex, setActiveSampleIndex] = useState(0);
  const [placeholder, setPlaceholder] = useState('');

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const primaryLanguages = LANGUAGES.filter(l => l.primary);
  const secondaryLanguages = LANGUAGES.filter(l => !l.primary)
    .filter(lang => lang.label.toLowerCase().includes(searchQuery.toLowerCase()));
  const currentLanguageDetails = LANGUAGES.find(l => l.code === language);
  const isSecondaryLanguageSelected = currentLanguageDetails && !currentLanguageDetails.primary;


  const { isListening, isTranscribing, transcript, startListening, stopListening, setTranscript, browserSupportsSpeechRecognition, error, clearError } = useSpeechToText(language);

  const handleInputChange = useCallback(<K extends keyof StoryOptions>(field: K, value: StoryOptions[K]) => {
    if (field === 'prompt' && error) {
      clearError();
    }
    setOptions(prev => ({ ...prev, [field]: value }));
  }, [error, clearError]);

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
    // Update placeholder whenever active index or language changes
    setPlaceholder(t(SAMPLE_PROMPTS[activeSampleIndex]));
  }, [activeSampleIndex, t]);

  useEffect(() => {
    if (options.prompt) {
        return; 
    }
    const intervalId = setInterval(() => {
        setActiveSampleIndex(prevIndex => (prevIndex + 1) % SAMPLE_PROMPTS.length);
    }, 4000);
    return () => clearInterval(intervalId);
  }, [options.prompt]);
  

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
      <main className="bg-white/70 backdrop-blur-xl border border-white/30 rounded-3xl shadow-2xl max-w-6xl w-full p-8 sm:p-12">
        <header className="flex flex-col sm:flex-row justify-between items-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-800 flex items-center gap-3 mb-4 sm:mb-0">
            <Sparkles className="w-8 h-8 text-fuchsia-500" />
            {t('input.title')}
          </h1>
          <div className="flex items-center gap-1 bg-gray-200/50 rounded-full p-1 shadow-inner">
            {primaryLanguages.map(lang => (
              <button
                key={lang.code}
                onClick={() => { setLanguage(lang.code); setIsDropdownOpen(false); setSearchQuery(''); }}
                className={`px-3 py-1 text-sm font-bold rounded-full transition-colors ${language === lang.code ? 'bg-white shadow-md text-slate-800' : 'text-slate-500 hover:bg-white/60'}`}
              >
                {lang.label}
              </button>
            ))}
             <div className="relative" ref={dropdownRef}>
                <button
                    onClick={() => setIsDropdownOpen(prev => {
                        if (prev) setSearchQuery('');
                        return !prev;
                    })}
                    className={`w-10 h-8 flex items-center justify-center rounded-full transition-colors ${isSecondaryLanguageSelected ? 'bg-white shadow-md' : 'text-slate-500 hover:bg-white/60'}`}
                    aria-haspopup="true"
                    aria-expanded={isDropdownOpen}
                >
                    {isSecondaryLanguageSelected && currentLanguageDetails ? (
                      <span className="text-lg">{currentLanguageDetails.flag}</span>
                    ) : (
                      <Globe className="w-5 h-5" />
                    )}
                </button>
                {isDropdownOpen && (
                    <div className="absolute top-full mt-2 end-0 bg-white rounded-xl shadow-lg border border-slate-200/80 z-20 w-52">
                        <div className="p-2 relative">
                            <Search className="w-4 h-4 text-slate-400 absolute top-1/2 left-5 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder={t('common.search')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full ps-9 p-2 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-fuchsia-300 focus:border-fuchsia-300"
                                autoFocus
                            />
                        </div>
                        <div className="max-h-48 overflow-y-auto p-2 pt-0">
                            {secondaryLanguages.map(lang => (
                                <button
                                    key={lang.code}
                                    onClick={() => { setLanguage(lang.code); setIsDropdownOpen(false); setSearchQuery(''); }}
                                    className={`w-full flex items-center gap-3 text-start p-2 rounded-lg text-sm transition-colors ${language === lang.code ? 'bg-slate-100 font-bold text-slate-800' : 'text-slate-600 hover:bg-slate-50'}`}
                                >
                                    <span className="text-lg">{lang.flag}</span>
                                    <span>{lang.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
          </div>
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
              {SAMPLE_PROMPTS.map((promptKey, i) => {
                const isActive = i === activeSampleIndex && !options.prompt;
                return (
                    <button
                        type="button"
                        key={promptKey}
                        onClick={() => handleInputChange('prompt', t(promptKey))}
                        className={`px-5 py-3 text-white font-semibold rounded-full text-sm shadow-md transition-all duration-300 hover:scale-105 ${sampleButtonColors[i % sampleButtonColors.length]} ${isActive ? 'ring-4 ring-offset-2 ring-violet-400 scale-110' : ''}`}
                    >
                        {t(promptKey)}
                    </button>
                );
              })}
            </div>
          </section>
          
          <div className="grid lg:grid-cols-2 gap-12">
            <div className="space-y-8">
                <section>
                  <h2 className="text-xl font-bold text-slate-700 mb-3 flex items-center gap-2"><UserRound className="w-6 h-6 text-purple-500" />{t('input.character.title')}</h2>
                  <div className="space-y-1">
                    <input type="text" value={options.characterName} onChange={(e) => handleInputChange('characterName', e.target.value)} placeholder={t('input.character.name')} className="w-full p-3 bg-white/60 border border-slate-300/80 rounded-lg focus:ring-2 focus:ring-purple-300/50 focus:border-purple-300 transition-all placeholder:text-slate-500"/>
                    <input type="text" value={options.characterType} onChange={(e) => handleInputChange('characterType', e.target.value)} placeholder={t('input.character.type')} className="w-full p-3 bg-white/60 border border-slate-300/80 rounded-lg focus:ring-2 focus:ring-purple-300/50 focus:border-purple-300 transition-all placeholder:text-slate-500"/>
                    <input type="text" value={options.characterPersonality} onChange={(e) => handleInputChange('characterPersonality', e.target.value)} placeholder={t('input.character.personality')} className="w-full p-3 bg-white/60 border border-slate-300/80 rounded-lg focus:ring-2 focus:ring-purple-300/50 focus:border-purple-300 transition-all placeholder:text-slate-500"/>
                  </div>
                </section>
                <section>
                    <h2 className="text-xl font-bold text-slate-700 mb-3 flex items-center gap-2"><Image className="w-6 h-6 text-sky-500" />{t('input.visualInspiration.label')}</h2>
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
                </section>
            </div>

            <section>
              <h2 className="text-xl font-bold text-slate-700 mb-4 flex items-center gap-2"><SlidersHorizontal className="w-6 h-6 text-emerald-500" />{t('input.options.title')}</h2>
              <div className="space-y-6">
                
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
                  <div className="grid grid-cols-3 gap-3">
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