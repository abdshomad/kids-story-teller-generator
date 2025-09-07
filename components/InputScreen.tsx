
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StoryOptions } from '../types';
import { AGE_GROUPS, THEMES, STORY_LENGTHS, ILLUSTRATION_STYLES, SAMPLE_PROMPTS } from '../constants';
import { useAppContext } from '../App';
import { useSpeechToText } from '../hooks/useSpeechToText';
import { Mic, Sparkles, Upload, UserRound, Image, SlidersHorizontal, ChevronDown } from 'lucide-react';
import DrawingCanvas, { DrawingCanvasRef } from './DrawingCanvas';

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
  const [inspirationSource, setInspirationSource] = useState<'upload' | 'draw' | null>(null);
  const canvasRef = useRef<DrawingCanvasRef>(null);

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
        setInspirationSource('upload');
        canvasRef.current?.clear();
      } catch (error) {
        console.error("Error converting file to base64", error);
      }
    }
  };

  const handleDrawStart = useCallback(() => {
    if (inspirationSource !== 'draw') {
        setInspirationSource('draw');
        setVisualInspirationPreview(null);
        handleInputChange('visualInspiration', undefined);
    }
  }, [inspirationSource, handleInputChange]);

  const handleClearCanvas = useCallback(() => {
      canvasRef.current?.clear();
      if(inspirationSource === 'draw') {
          setInspirationSource(null);
      }
  }, [inspirationSource]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let finalOptions = { ...options };

    if (inspirationSource === 'draw' && canvasRef.current && !canvasRef.current.isEmpty()) {
      const dataUrl = canvasRef.current.toDataURL('image/png');
      const base64Part = dataUrl.split(',')[1];
      if (base64Part) {
          finalOptions.visualInspiration = { mimeType: 'image/png', data: base64Part };
      }
    }

    if (finalOptions.prompt.trim()) {
      onCreateStory(finalOptions);
    }
  };

  const handleSamplePrompt = (promptKey: string) => {
    handleInputChange('prompt', t(promptKey));
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-pink-100 via-purple-100 to-blue-200 p-4 sm:p-8 flex items-center justify-center">
      <main className="bg-white/70 backdrop-blur-xl border border-white/30 rounded-3xl shadow-2xl max-w-4xl w-full p-6 sm:p-8">
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
             <div className="mt-4">
                <h3 className="text-sm font-bold text-slate-500 mb-2">{t('input.inspiration')}</h3>
                <div className="flex flex-wrap gap-2">
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
                <Select id="length" label={t('input.options.length')} value={options.length} onChange={(e) => handleInputChange('length', e.target.value as StoryOptions['length'])} options={STORY_LENGTHS.map(o => ({...o, label: t(o.labelKey)}))} />
                <Select id="illustrationStyle" label={t('input.options.style')} value={options.illustrationStyle} onChange={(e) => handleInputChange('illustrationStyle', e.target.value)} options={ILLUSTRATION_STYLES.map(o => ({...o, label: t(o.labelKey)}))} />
              </div>
            </section>
          </div>
          
          <section>
            <h2 className="text-xl font-bold text-slate-700 mb-3 flex items-center gap-2"><Image className="w-6 h-6 text-sky-500" />{t('input.visualInspiration.label')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start bg-slate-100/40 p-4 rounded-xl">
              <div className="flex flex-col items-center gap-3 text-center">
                <p className="text-sm text-slate-600 font-semibold">{t('input.visualInspiration.uploadDescription')}</p>
                <label className="w-full max-w-xs cursor-pointer flex items-center justify-center gap-3 p-3 border-2 border-dashed border-slate-300/80 rounded-lg text-slate-600 hover:bg-white/80 hover:border-sky-500 hover:text-sky-600 transition-colors">
                   <Upload className="w-5 h-5" />
                   <span className="font-semibold">{visualInspirationPreview && inspirationSource === 'upload' ? t('input.visualInspiration.change') : t('input.visualInspiration.button')}</span>
                   <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </label>
                {visualInspirationPreview && inspirationSource === 'upload' && <img src={visualInspirationPreview} alt="Preview" className="mt-2 rounded-lg object-cover h-24 w-24 mx-auto shadow-md"/>}
              </div>
              <div className="flex flex-col items-center gap-2 text-center">
                 <p className="text-sm text-slate-600 font-semibold">{t('input.visualInspiration.drawDescription')}</p>
                 <div className="w-full aspect-[4/3] rounded-lg overflow-hidden border border-slate-300/80 shadow-inner">
                    <DrawingCanvas ref={canvasRef} onDrawStart={handleDrawStart} width={300} height={225} />
                 </div>
                 <button type="button" onClick={handleClearCanvas} className="text-sm text-slate-500 hover:text-red-500 transition-colors -mt-1">{t('input.visualInspiration.clearDrawing')}</button>
              </div>
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