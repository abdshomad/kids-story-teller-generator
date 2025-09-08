
import React, { useState, useCallback, useMemo, createContext, useContext, useEffect } from 'react';
import WelcomeModal from './components/WelcomeModal';
import InputScreen from './components/InputScreen';
import LoadingScreen from './components/LoadingScreen';
import StoryViewer from './components/StoryViewer';
import StyleSelectionScreen from './components/StyleSelectionScreen';
import { Language, AppStatus } from './types';
import { locales } from './i18n/locales';
import { useSamplePrompts } from './hooks/useSamplePrompts';
import { useAppController } from './hooks/useAppController';

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const AppContext = createContext<AppContextType | null>(null);
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useAppContext must be used within an AppProvider');
  return context;
};

const App: React.FC = () => {
  const [language, setLanguage] = useState<Language>('en');
  
  useEffect(() => { document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr'; }, [language]);

  const t = useCallback((key: string, params: Record<string, string | number> = {}) => {
    let translation = locales[language][key] || key;
    Object.keys(params).forEach(paramKey => {
      translation = translation.replace(`{${paramKey}}`, String(params[paramKey]));
    });
    return translation;
  }, [language]);
  
  const { samplePrompts, isLoadingSamples, addMorePrompts } = useSamplePrompts(language);
  const { appState, retryingPages, handleStoryCreate, handleStyleSelect, handleRetryImage, handleNewStory, handleWelcomeAcknowledge, handleStopGeneration } = useAppController(t);

  const contextValue = useMemo(() => ({ language, setLanguage, t }), [language, t]);

  const renderContent = () => {
    const inputProps = { onCreateStory: handleStoryCreate, samplePrompts, isLoadingSamples, addMorePrompts };
    switch (appState.status) {
      case AppStatus.WELCOME: return <WelcomeModal onAcknowledge={handleWelcomeAcknowledge} />;
      case AppStatus.INPUT: return <InputScreen {...inputProps} />;
      case AppStatus.LOADING: return <LoadingScreen onStop={handleStopGeneration} {...appState} />;
      case AppStatus.STYLE_SELECTION: return <StyleSelectionScreen outlineData={appState.outlineData} onStyleSelect={handleStyleSelect} />;
      case AppStatus.STORY: return <StoryViewer story={appState.storyData} onNewStory={handleNewStory} onRetryImage={handleRetryImage} retryingPages={retryingPages} />;
      case AppStatus.ERROR: return (
          <div className="flex flex-col items-center justify-center h-screen bg-red-100 text-red-800 p-4">
            <h2 className="text-2xl font-bold mb-4">{t('error.title')}</h2>
            <p className="text-center mb-6">{appState.message}</p>
            <button onClick={handleNewStory} className="px-6 py-3 bg-red-600 text-white font-bold rounded-full shadow-lg hover:bg-red-700 transition-colors">
              {t('common.tryAgain')}
            </button>
          </div>
        );
      default: return <InputScreen {...inputProps} />;
    }
  };

  return (
    <AppContext.Provider value={contextValue}>
      <div className="bg-sky-50 min-h-screen text-slate-800">{renderContent()}</div>
    </AppContext.Provider>
  );
};

export default App;
