

import React, { useState, useCallback, useMemo, createContext, useContext } from 'react';
import WelcomeModal from './components/WelcomeModal';
import InputScreen from './components/InputScreen';
import LoadingScreen from './components/LoadingScreen';
import StoryViewer from './components/StoryViewer';
import { StoryData, StoryOptions, Language, AppState, AppStatus, StoryPage, LoadingStage } from './types';
import { generateStoryAndImages } from './services/geminiService';
import { locales } from './i18n/locales';

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const AppContext = createContext<AppContextType | null>(null);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>({ status: AppStatus.WELCOME });
  const [language, setLanguage] = useState<Language>('en');

  const t = useCallback((key: string, params: Record<string, string | number> = {}) => {
    let translation = locales[language][key] || key;
    Object.keys(params).forEach(paramKey => {
      translation = translation.replace(`{${paramKey}}`, String(params[paramKey]));
    });
    return translation;
  }, [language]);

  const contextValue = useMemo(() => ({
    language,
    setLanguage,
    t
  }), [language, t]);

  const handleStoryCreate = async (options: StoryOptions) => {
    setAppState({ status: AppStatus.LOADING, stage: LoadingStage.ANALYZING_PROMPT });
    try {
      await generateStoryAndImages(
        options,
        t,
        (initialStory) => {
          setAppState({ status: AppStatus.STORY, storyData: initialStory });
        },
        (illustratedPage, index) => {
          setAppState(currentState => {
            if (currentState.status !== AppStatus.STORY) return currentState;
            
            const newPages = [...currentState.storyData.pages];
            newPages[index] = illustratedPage;

            return {
              ...currentState,
              storyData: {
                ...currentState.storyData,
                pages: newPages,
              },
            };
          });
        },
        (stage, progress) => {
            setAppState({ status: AppStatus.LOADING, stage, progress });
        }
      );
    } catch (error) {
      console.error("Failed to generate story:", error);
      const errorMessage = error instanceof Error ? error.message : t('error.generic');
      setAppState({ status: AppStatus.ERROR, message: errorMessage });
    }
  };

  const handleNewStory = () => {
    setAppState({ status: AppStatus.INPUT });
  };
  
  const handleWelcomeAcknowledge = () => {
      setAppState({ status: AppStatus.INPUT });
  };

  const renderContent = () => {
    switch (appState.status) {
      case AppStatus.WELCOME:
        return <WelcomeModal onAcknowledge={handleWelcomeAcknowledge} />;
      case AppStatus.INPUT:
        return <InputScreen onCreateStory={handleStoryCreate} />;
      case AppStatus.LOADING:
        return <LoadingScreen stage={appState.stage} progress={appState.progress} />;
      case AppStatus.STORY:
        return <StoryViewer story={appState.storyData} onNewStory={handleNewStory} />;
      case AppStatus.ERROR:
        return (
          <div className="flex flex-col items-center justify-center h-screen bg-red-100 text-red-800 p-4">
            <h2 className="text-2xl font-bold mb-4">{t('error.title')}</h2>
            <p className="text-center mb-6">{appState.message}</p>
            <button
              onClick={handleNewStory}
              className="px-6 py-3 bg-red-600 text-white font-bold rounded-full shadow-lg hover:bg-red-700 transition-colors"
            >
              {t('common.tryAgain')}
            </button>
          </div>
        );
      default:
        return <InputScreen onCreateStory={handleStoryCreate} />;
    }
  };

  return (
    <AppContext.Provider value={contextValue}>
      <div className="bg-sky-50 min-h-screen text-slate-800">
        {renderContent()}
      </div>
    </AppContext.Provider>
  );
};

export default App;