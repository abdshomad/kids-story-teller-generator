
import React, { useState, useEffect, useCallback } from 'react';
import { StoryOptions } from '../types';
import { LANGUAGES, AGE_GROUPS, THEMES, STORY_LENGTHS, ILLUSTRATION_STYLES } from '../constants';
import { useAppContext } from '../App';
import { Mic, Sparkles, UserRound, SlidersHorizontal, Loader2, Plus } from 'lucide-react';
import FullscreenCanvas from './FullscreenCanvas';
import Section from './input/Section';
import CharacterCard from './input/CharacterCard';
import OptionSelector from './input/OptionSelector';
import { useSpeechToText } from '../hooks/useSpeechToText';
import { useStoryOptions } from '../hooks/useStoryOptions';
import { useCharacterExtraction } from '../hooks/useCharacterExtraction';
import { useAnimatedPlaceholder } from '../hooks/useAnimatedPlaceholder';

interface InputScreenProps {
  onCreateStory: (options: StoryOptions) => void;
  samplePrompts: { title: string; prompt: string; }[];
  isLoadingSamples: boolean;
  addMorePrompts: () => void;
}

const sampleButtonColors = [
    'bg-rose-400 hover:bg-rose-500', 'bg-violet-400 hover:bg-violet-500',
    'bg-cyan-400 hover:bg-cyan-500', 'bg-emerald-400 hover:bg-emerald-500',
];

const InputScreen: React.FC<InputScreenProps> = ({ onCreateStory, samplePrompts, isLoadingSamples, addMorePrompts }) => {
  const { language, setLanguage, t } = useAppContext();
  const [drawingCharacterId, setDrawingCharacterId] = useState<string | null>(null);
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['character']));
  const [characterFieldsEditedByUser, setCharacterFieldsEditedByUser] = useState(false);

  const { options, setOptions, characterPreviews, handleInputChange, handleCharacterChange, handleCharacterInspiration, addCharacter, removeCharacter, setCharacters } = useStoryOptions(language);
  const { isExtractingCharacter } = useCharacterExtraction(options.prompt, language, setCharacters, characterFieldsEditedByUser);
  const placeholder = useAnimatedPlaceholder(samplePrompts, options.prompt);
  const { isListening, isTranscribing, transcript, startListening, stopListening, setTranscript, browserSupportsSpeechRecognition, error, clearError } = useSpeechToText(language);

  useEffect(() => { handleInputChange('language', language); }, [language, handleInputChange]);
  useEffect(() => {
    if (transcript) {
      setOptions(prev => ({ ...prev, prompt: prev.prompt ? `${prev.prompt} ${transcript}` : transcript }));
      setTranscript('');
    }
  }, [transcript, setTranscript, setOptions]);

  const handleAnyCharacterChange: typeof handleCharacterChange = (...args) => {
    if (!characterFieldsEditedByUser) setCharacterFieldsEditedByUser(true);
    handleCharacterChange(...args);
  };

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
  
  const handleMicClick = useCallback(() => {
    if (error) clearError();
    if (isListening) stopListening();
    else if (!isTranscribing) startListening();
  }, [isListening, isTranscribing, startListening, stopListening, error, clearError]);

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (options.prompt.trim()) onCreateStory(options); };

  if (drawingCharacterId) return <FullscreenCanvas onDone={handleDrawingDone} onClose={() => setDrawingCharacterId(null)} />;

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-pink-100 via-purple-100 to-blue-200 p-4 sm:p-8 flex items-center justify-center">
      <main className="bg-white/70 backdrop-blur-xl border border-white/30 rounded-3xl shadow-2xl max-w-6xl w-full p-8 sm:p-12">
        <header className="flex flex-col items-center gap-6 mb-8">
          <div className="flex items-center gap-1 bg-gray-200/50 rounded-full p-1 shadow-inner">
            {LANGUAGES.map(lang => ( <button key={lang.code} onClick={() => setLanguage(lang.code)} className={`px-3 py-1 text-sm font-bold rounded-full transition-colors ${language === lang.code ? 'bg-white shadow-md text-slate-800' : 'text-slate-500 hover:bg-white/60'}`}>{lang.label}</button>))}
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-800 flex items-center gap-3"><Sparkles className="w-8 h-8 text-fuchsia-500" />{t('input.title')}</h1>
        </header>

        <form onSubmit={handleSubmit} className="space-y-8">
          <section>
            <div className="relative">
              <textarea value={options.prompt} onChange={(e) => handleInputChange('prompt', e.target.value)} placeholder={placeholder} className="w-full p-4 pe-16 text-lg bg-white/60 border border-slate-300/80 rounded-xl focus:ring-4 focus:ring-fuchsia-300/50 focus:border-fuchsia-300 transition-all placeholder:text-slate-500 resize-none" rows={3} required />
              {browserSupportsSpeechRecognition && ( <button type="button" onClick={handleMicClick} disabled={isTranscribing} aria-label={isListening ? 'Stop' : 'Start'} className={`absolute top-4 end-4 p-3 rounded-full transition-all duration-300 ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-white/80 hover:bg-white'} disabled:bg-slate-200`}> {isTranscribing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mic className="w-5 h-5" />} </button> )}
            </div>
            {error && <p className="text-red-600 text-sm mt-2 text-center" role="alert">{t(error)}</p>}
            <div className="flex flex-wrap justify-center items-center gap-4 my-6">
              {(isLoadingSamples && samplePrompts.length === 0) ? Array.from({ length: 4 }).map((_, i) => (<div key={i} className={`h-12 w-48 rounded-full animate-pulse ${sampleButtonColors[i % 4]}`} />)) : (
                <>
                  {samplePrompts.map((s, i) => <button key={i} type="button" onClick={() => handleInputChange('prompt', s.prompt)} className={`text-sm font-bold text-white px-4 py-2 rounded-full shadow-lg ${sampleButtonColors[i % 4]}`}>{s.title}</button>)}
                  <button type="button" onClick={addMorePrompts} disabled={isLoadingSamples} className="text-sm font-bold text-slate-600 hover:text-fuchsia-600 disabled:text-slate-400 transition-colors flex items-center gap-1"> {isLoadingSamples ? <Loader2 className="w-4 h-4 animate-spin"/> : <Sparkles className="w-4 h-4"/>} {t('input.samples.addMore')} </button>
                </>
              )}
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Section title={t('input.character.title')} icon={<UserRound />} id="character" isOpen={openSections.has('character')} onToggle={(id) => setOpenSections(p => p.has(id) ? new Set([...p].filter(s => s !== id)) : new Set([...p, id]))} isLoading={isExtractingCharacter}>
              <p className="text-sm text-slate-600 mb-4">{t('input.character.subtitle')}</p>
              <div className="space-y-6">
                {options.characters.map((char) => <CharacterCard key={char.id} character={char} previewUrl={characterPreviews[char.id]} onChange={handleAnyCharacterChange} onInspirationChange={handleCharacterInspiration} onDrawClick={setDrawingCharacterId} onRemove={options.characters.length > 1 ? removeCharacter : undefined} isOnlyCharacter={options.characters.length === 1} />)}
              </div>
              <button type="button" onClick={addCharacter} className="mt-4 flex items-center gap-2 text-sm font-bold text-fuchsia-600 hover:text-fuchsia-700 transition-colors"><Plus className="w-4 h-4" /> Add Another Character </button>
            </Section>

            <Section title={t('input.options.title')} icon={<SlidersHorizontal />} id="options" isOpen={openSections.has('options')} onToggle={(id) => setOpenSections(p => p.has(id) ? new Set([...p].filter(s => s !== id)) : new Set([...p, id]))}>
              <div className="space-y-4">
                <OptionSelector label={t('input.options.age')} value={options.ageGroup} onChange={(v) => handleInputChange('ageGroup', v)} options={AGE_GROUPS.map(o => ({ ...o, label: t(o.labelKey)}))} />
                <OptionSelector label={t('input.options.theme')} value={options.theme} onChange={(v) => handleInputChange('theme', v)} options={THEMES.map(o => ({ ...o, label: t(o.labelKey)}))} />
                <OptionSelector label={t('input.options.length')} value={options.length} onChange={(v) => handleInputChange('length', v as any)} options={STORY_LENGTHS.map(o => ({ ...o, label: t(o.labelKey)}))} />
                <OptionSelector label={t('input.options.style')} value={options.illustrationStyle} onChange={(v) => handleInputChange('illustrationStyle', v)} options={ILLUSTRATION_STYLES.map(o => ({ ...o, label: t(o.labelKey)}))} />
              </div>
            </Section>
          </div>

          <div className="text-center pt-4">
            <button type="submit" disabled={!options.prompt.trim() || isTranscribing} className="px-10 py-4 bg-fuchsia-600 text-white font-extrabold text-lg rounded-full shadow-lg hover:bg-fuchsia-700 transition-all duration-300 disabled:bg-slate-400 disabled:cursor-not-allowed">{t('input.button.create')}</button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default InputScreen;
