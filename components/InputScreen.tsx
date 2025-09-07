import React, { useState, useEffect, useCallback } from 'react';
import { StoryOptions } from '../types';
import { AGE_GROUPS, THEMES, STORY_LENGTHS, ILLUSTRATION_STYLES, SAMPLE_PROMPTS } from '../constants';
import { useAppContext } from '../App';
import { useSpeechToText } from '../hooks/useSpeechToText';
import { Mic, Sparkles, Upload } from 'lucide-react';

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (options.prompt.trim()) {
      onCreateStory(options);
    }
  };

  const handleSamplePrompt = (promptKey: string) => {
    handleInputChange('prompt', t(promptKey));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-100 to-blue-200 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-800 flex items-center gap-3">
                <Sparkles className="w-8 h-8 text-yellow-500" />
                {t('input.title')}
            </h1>
            <div className="flex gap-1 bg-white rounded-full p-1 shadow-md">
                <button onClick={() => setLanguage('en')} className={`px-3 py-1 text-sm font-bold rounded-full transition-colors ${language === 'en' ? 'bg-blue-500 text-white' : 'text-slate-600'}`}>EN</button>
                <button onClick={() => setLanguage('id')} className={`px-3 py-1 text-sm font-bold rounded-full transition-colors ${language === 'id' ? 'bg-blue-500 text-white' : 'text-slate-600'}`}>ID</button>
            </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white p-6 rounded-2xl shadow-lg">
            <div className="relative">
              <textarea
                value={options.prompt}
                onChange={(e) => handleInputChange('prompt', e.target.value)}
                placeholder={t('input.prompt.placeholder')}
                className="w-full h-32 p-4 pr-16 text-lg border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-300 focus:border-blue-500 transition-all"
                required
              />
              {browserSupportsSpeechRecognition && (
                <button 
                    type="button" 
                    onClick={isListening ? stopListening : startListening}
                    className={`absolute top-4 right-4 p-2 rounded-full transition-colors ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                >
                    <Mic className="w-6 h-6" />
                </button>
              )}
            </div>
             <div className="mt-4">
                <h3 className="text-sm font-bold text-slate-500 mb-2">{t('input.inspiration')}</h3>
                <div className="flex flex-wrap gap-2">
                    {SAMPLE_PROMPTS.map(key => (
                        <button type="button" key={key} onClick={() => handleSamplePrompt(key)} className="px-3 py-1 bg-sky-100 text-sky-800 text-sm rounded-full hover:bg-sky-200 transition-colors">
                            {t(key)}
                        </button>
                    ))}
                </div>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-2xl shadow-lg space-y-4">
              <h2 className="text-xl font-bold text-slate-700">{t('input.character.title')}</h2>
              <input type="text" value={options.characterName} onChange={(e) => handleInputChange('characterName', e.target.value)} placeholder={t('input.character.name')} className="w-full p-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-300"/>
              <input type="text" value={options.characterType} onChange={(e) => handleInputChange('characterType', e.target.value)} placeholder={t('input.character.type')} className="w-full p-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-300"/>
              <input type="text" value={options.characterPersonality} onChange={(e) => handleInputChange('characterPersonality', e.target.value)} placeholder={t('input.character.personality')} className="w-full p-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-300"/>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-lg space-y-3">
              <h2 className="text-xl font-bold text-slate-700">{t('input.visualInspiration.label')}</h2>
              <p className="text-sm text-slate-500">{t('input.visualInspiration.description')}</p>
              <label className="w-full cursor-pointer flex items-center justify-center gap-3 p-4 border-2 border-dashed border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 hover:border-blue-500 hover:text-blue-600 transition-colors">
                 <Upload className="w-6 h-6" />
                 <span>{visualInspirationPreview ? t('input.visualInspiration.change') : t('input.visualInspiration.button')}</span>
                 <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </label>
              {visualInspirationPreview && <img src={visualInspirationPreview} alt="Preview" className="mt-2 rounded-lg object-cover h-24 w-24 mx-auto"/>}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-lg">
            <h2 className="text-xl font-bold text-slate-700 mb-4">{t('input.options.title')}</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Select id="ageGroup" label={t('input.options.age')} value={options.ageGroup} onChange={(e) => handleInputChange('ageGroup', e.target.value)} options={AGE_GROUPS.map(o => ({...o, label: t(o.labelKey)}))} />
              <Select id="theme" label={t('input.options.theme')} value={options.theme} onChange={(e) => handleInputChange('theme', e.target.value)} options={THEMES.map(o => ({...o, label: t(o.labelKey)}))} />
              <Select id="length" label={t('input.options.length')} value={options.length} onChange={(e) => handleInputChange('length', e.target.value as StoryOptions['length'])} options={STORY_LENGTHS.map(o => ({...o, label: t(o.labelKey)}))} />
              <Select id="illustrationStyle" label={t('input.options.style')} value={options.illustrationStyle} onChange={(e) => handleInputChange('illustrationStyle', e.target.value)} options={ILLUSTRATION_STYLES.map(o => ({...o, label: t(o.labelKey)}))} />
            </div>
          </div>

          <div className="text-center">
            <button type="submit" className="px-12 py-4 bg-yellow-400 text-slate-900 font-extrabold text-xl rounded-full shadow-lg hover:bg-yellow-500 hover:scale-105 transform transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-yellow-300">
              {t('input.button.create')}
            </button>
          </div>
        </form>
      </div>
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
    <div>
        <label htmlFor={id} className="block text-sm font-bold text-slate-600 mb-1">{label}</label>
        <select id={id} value={value} onChange={onChange} className="w-full p-3 border-2 border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-300">
            {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
    </div>
);


export default InputScreen;