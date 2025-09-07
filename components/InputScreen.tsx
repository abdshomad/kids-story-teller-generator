
import React, { useState, useEffect, useCallback } from 'react';
import { StoryOptions } from '../types';
import { AGE_GROUPS, THEMES, STORY_LENGTHS, ILLUSTRATION_STYLES, SAMPLE_PROMPTS } from '../constants';
import { useAppContext } from '../App';
import { useSpeechToText } from '../hooks/useSpeechToText';
import { Mic, Sparkles, Upload, UserRound, Image, SlidersHorizontal, ChevronDown, PenSquare } from 'lucide-react';
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

const InputScreen: React.FC<InputScreenProps> = ({ onCreateStory }) => {
  const { language, setLanguage, t } = useAppContext();
  const [options, setOptions] = useState<StoryOptions>({
    prompt: '',
    ageGroup: AGE_GROUPS[0].value,
    theme: THEMES[0].value,
    length: 'medium',
    illustrationStyle: ILLUSTRATION_STYLES[0].value,
    characterName: '',
    characterType: '',
    characterPersonality: '',
  });
  const [visualInspirationPreview, setVisualInspirationPreview] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const { isListening, transcript, startListening, stopListening, setTranscript, browserSupportsSpeechRecognition } = useSpeechToText(language);

  useEffect(() => {
    if (transcript) {
      setOptions(prev => ({ ...prev, prompt: prev.prompt + transcript }));
      setTranscript('');
    }
  }, [transcript, setTranscript]);
  
  const handleInputChange = useCallback(<K extends keyof StoryOptions>(field: K, value: StoryOptions[K]) => {
    setOptions(prev => ({ ...prev, [field]: value }));
  }, []);

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

  const handleSamplePrompt = (promptKey: string) => {
    handleInputChange('prompt', t(promptKey));
  };

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
          <div className="flex gap-1 bg-gray-200/50 rounded-full p-1 shadow-inner">
            <button onClick={() => setLanguage('en')} className={`px-3 py-1 text-sm font-bold rounded-full transition-colors ${language === 'en' ? 'bg-white shadow-md text-slate-800' : 'text-slate-500'}`}>EN</button>
            <button onClick={() => setLanguage('id')} className={`px-3 py-1 text-sm font-bold rounded-full transition-colors ${language === 'id' ? 'bg-white shadow-md text-slate-800' : 'text-slate-500'}`}>ID</button>
          </div>
        </header>

        <form onSubmit={handleSubmit} className="space-y-8">
          <section>
            <div className="relative">
              <textarea
                value={options.prompt}
                onChange={(e) => handleInputChange('prompt', e.target.value)}
                placeholder={t('input.prompt.placeholder')}
                className="w-full h-32 p-4 pr-16 text-lg bg-white/60 border border-slate-300/80 rounded-xl focus:ring-4 focus:ring-fuchsia-300/50 focus:border-fuchsia-300 transition-all placeholder:text-slate-500"
                required
              />
              {browserSupportsSpeechRecognition && (
                <button 
                    type="button" 
                    onClick={isListening ? stopListening : startListening}
                    aria-label={isListening ? 'Stop recording' : 'Start recording'}
                    className={`absolute top-4 right-4 p-3 rounded-full transition-all duration-300 ${isListening ? 'bg-red-500 text-white animate-pulse shadow-lg' : 'bg-white/80 text-slate-600 hover:bg-white'}`}
                >
                    <Mic className="w-5 h-5" />
                </button>
              )}
            </div>
             <div className="mt-4 flex flex-col items-center">
                <h3 className="text-sm font-bold text-slate-500 mb-2">{t('input.inspiration')}</h3>
                <div className="flex flex-wrap gap-2 justify-center">
                    {SAMPLE_PROMPTS.map(key => (
                        <button type="button" key={key} onClick={() => handleSamplePrompt(key)} className="px-3 py-1 bg-sky-100/70 text-sky-800 text-sm rounded-full hover:bg-sky-200/80 transition-colors">
                            {t(key)}
                        </button>
                    ))}
                </div>
            </div>
          </section>
          
          <div className="grid lg:grid-cols-2 gap-8">
            <section>
              <h2 className="text-xl font-bold text-slate-700 mb-4 flex items-center gap-2"><UserRound className="w-6 h-6 text-purple-500" />{t('input.character.title')}</h2>
              <div className="space-y-3">
                <input type="text" value={options.characterName} onChange={(e) => handleInputChange('characterName', e.target.value)} placeholder={t('input.character.name')} className="w-full p-3 bg-white/60 border border-slate-300/80 rounded-lg focus:ring-2 focus:ring-purple-300/50 focus:border-purple-300 transition-all placeholder:text-slate-500"/>
                <input type="text" value={options.characterType} onChange={(e) => handleInputChange('characterType', e.target.value)} placeholder={t('input.character.type')} className="w-full p-3 bg-white/60 border border-slate-300/80 rounded-lg focus:ring-2 focus:ring-purple-300/50 focus:border-purple-300 transition-all placeholder:text-slate-500"/>
                <input type="text" value={options.characterPersonality} onChange={(e) => handleInputChange('characterPersonality', e.target.value)} placeholder={t('input.character.personality')} className="w-full p-3 bg-white/60 border border-slate-300/80 rounded-lg focus:ring-2 focus:ring-purple-300/50 focus:border-purple-300 transition-all placeholder:text-slate-500"/>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-700 mb-4 flex items-center gap-2"><SlidersHorizontal className="w-6 h-6 text-emerald-500" />{t('input.options.title')}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Select id="ageGroup" label={t('input.options.age')} value={options.ageGroup} onChange={(e) => handleInputChange('ageGroup', e.target.value)} options={AGE_GROUPS.map(o => ({...o, label: t(o.labelKey)}))} />
                <Select id="theme" label={t('input.options.theme')} value={options.theme} onChange={(e) => handleInputChange('theme', e.target.value)} options={THEMES.map(o => ({...o, label: t(o.labelKey)}))} />
                <div>
                    <label className="block text-sm font-bold text-slate-600 mb-1">{t('input.options.length')}</label>
                    <div className="flex gap-2">
                        {STORY_LENGTHS.map(lengthOption => (
                            <button
                                type="button"
                                key={lengthOption.value}
                                onClick={() => handleInputChange('length', lengthOption.value as StoryOptions['length'])}
                                className={`flex-1 p-3 rounded-lg text-xs font-bold transition-all text-center border ${
                                    options.length === lengthOption.value
                                        ? 'bg-purple-500 text-white shadow-md border-purple-500'
                                        : 'bg-white/60 text-slate-700 hover:bg-white/90 border-slate-300/80'
                                }`}
                            >
                                {t(lengthOption.labelKey)}
                            </button>
                        ))}
                    </div>
                </div>
                <Select id="illustrationStyle" label={t('input.options.style')} value={options.illustrationStyle} onChange={(e) => handleInputChange('illustrationStyle', e.target.value)} options={ILLUSTRATION_STYLES.map(o => ({...o, label: t(o.labelKey)}))} />
              </div>
            </section>
          </div>
          
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
                  <div className="w-full sm:w-auto sm:ml-4 pt-4 sm:pt-0">
                    <img src={visualInspirationPreview} alt="Preview" className="rounded-lg object-cover h-24 w-24 mx-auto shadow-md"/>
                  </div>
                )}
            </div>
          </section>

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

interface SelectProps {
  id: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string; label: string }[];
}

const Select: React.FC<SelectProps> = ({ id, label, value, onChange, options }) => (
    <div className="relative">
        <label htmlFor={id} className="block text-sm font-bold text-slate-600 mb-1">{label}</label>
        <select 
            id={id} 
            value={value} 
            onChange={onChange} 
            className="w-full p-3 bg-white/60 border border-slate-300/80 appearance-none rounded-lg focus:ring-2 focus:ring-purple-300/50 focus:border-purple-300 transition-all"
        >
            {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 pt-6 text-slate-700">
            <ChevronDown className="h-5 w-5" />
        </div>
    </div>
);


export default InputScreen;
