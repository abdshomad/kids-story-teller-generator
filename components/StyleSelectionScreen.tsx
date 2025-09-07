
import React, { useState } from 'react';
import { StoryOutline } from '../types';
import { useAppContext } from '../App';
import { ImageOff, Loader2, Sparkles } from 'lucide-react';

interface StyleSelectionScreenProps {
  outlineData: StoryOutline;
  onStyleSelect: (outlineData: StoryOutline, selectedCoverPrompt: string) => void;
}

const StyleSelectionScreen: React.FC<StyleSelectionScreenProps> = ({ outlineData, onStyleSelect }) => {
  const { t } = useAppContext();
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSelect = (index: number) => {
    setSelectedIndex(index);
  };

  const handleConfirm = () => {
    if (selectedIndex !== null) {
      setIsLoading(true);
      onStyleSelect(outlineData, outlineData.coverImageOptions[selectedIndex].prompt);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-sky-100 via-teal-100 to-emerald-200 p-4 sm:p-8 flex items-center justify-center">
      <main className="bg-white/80 backdrop-blur-2xl border border-white/40 rounded-3xl shadow-2xl max-w-5xl w-full p-8 sm:p-12 text-center">
        <header className="mb-8">
            <div className="flex justify-center items-center gap-3 text-emerald-500 mb-2">
                <Sparkles className="w-8 h-8" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-800">
                {t('style.title')}
            </h1>
            <p className="text-slate-600 mt-2 max-w-2xl mx-auto">{t('style.subtitle')}</p>
        </header>
        
        <section className="bg-slate-50/50 rounded-2xl p-6 mb-8 text-left shadow-inner">
            <h2 className="text-2xl font-bold text-slate-700 mb-2">{outlineData.title}</h2>
            <p className="text-slate-600 leading-relaxed">{outlineData.synopsis}</p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {outlineData.coverImageOptions.map((option, index) => (
                <button
                    key={index}
                    onClick={() => handleSelect(index)}
                    className={`relative rounded-2xl overflow-hidden shadow-lg transition-all duration-300 transform hover:scale-105 focus:outline-none ${selectedIndex === index ? 'ring-4 ring-offset-4 ring-emerald-500 scale-105' : 'ring-0'}`}
                    aria-pressed={selectedIndex === index}
                >
                    <div className="aspect-[3/4] bg-slate-200 flex items-center justify-center">
                        {option.imageUrl === 'GENERATION_FAILED' ? (
                            <div className="flex flex-col items-center text-red-400">
                                <ImageOff className="w-12 h-12" />
                                <span className="text-sm font-bold mt-1">{t('story.imageError')}</span>
                            </div>
                        ) : (
                            <img src={option.imageUrl} alt={`Style option ${index + 1}`} className="w-full h-full object-cover" />
                        )}
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <p className="absolute bottom-2 left-3 right-3 text-white text-xs font-semibold truncate" title={option.prompt.split(' Style: ')[1] || ''}>
                        {option.prompt.split(' Style: ')[1] || ''}
                    </p>
                </button>
            ))}
        </section>

        <div className="text-center">
            <button
                onClick={handleConfirm}
                disabled={selectedIndex === null || isLoading}
                className="w-full sm:w-auto bg-emerald-600 text-white font-bold tracking-wider py-4 px-10 rounded-full hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-300 transition-all duration-300 shadow-lg text-lg disabled:bg-slate-400 disabled:cursor-not-allowed"
            >
                {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <span>{t('common.loading')}</span>
                    </div>
                ) : (
                    t('style.button')
                )}
            </button>
        </div>
      </main>
    </div>
  );
};

export default StyleSelectionScreen;
