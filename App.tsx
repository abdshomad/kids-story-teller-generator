
import React, { useState, useCallback, useMemo, createContext, useContext, useEffect } from 'react';
import WelcomeModal from './components/WelcomeModal';
import InputScreen from './components/InputScreen';
import LoadingScreen from './components/LoadingScreen';
import StoryViewer from './components/StoryViewer';
import StyleSelectionScreen from './components/StyleSelectionScreen';
import { StoryData, StoryOptions, Language, AppState, AppStatus, LoadingStage, StoryOutline } from './types';
import { generateStoryOutline, generateFullStoryFromSelection, regenerateImage } from './services/storyService';
import { generateSamplePrompts } from './services/analysisService';
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
  const [retryingPages, setRetryingPages] = useState<Set<number>>(new Set());
  
  const [samplePrompts, setSamplePrompts] = useState<{ title: string; prompt: string; }[]>([]);
  const [isLoadingSamples, setIsLoadingSamples] = useState(true);


  useEffect(() => {
    const isRtl = language === 'ar';
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
  }, [language]);

  const t = useCallback((key: string, params: Record<string, string | number> = {}) => {
    let translation = locales[language][key] || key;
    Object.keys(params).forEach(paramKey => {
      translation = translation.replace(`{${paramKey}}`, String(params[paramKey]));
    });
    return translation;
  }, [language]);
  
  const fetchInitialPrompts = useCallback(async () => {
    setIsLoadingSamples(true);
    setSamplePrompts([]);
    try {
        const prompts = await generateSamplePrompts(language);
        setSamplePrompts(prompts);
    } catch (e) {
        console.error("Failed to fetch initial prompts", e);
    } finally {
        setIsLoadingSamples(false);
    }
  }, [language]);

  const addMorePrompts = useCallback(async () => {
    setIsLoadingSamples(true);
    try {
        const newPrompts = await generateSamplePrompts(language, samplePrompts);
        setSamplePrompts(prev => [...prev, ...newPrompts]);
    } catch (e) {
        console.error("Failed to add more prompts", e);
    } finally {
        setIsLoadingSamples(false);
    }
  }, [language, samplePrompts]);
  
  useEffect(() => {
    fetchInitialPrompts();
  }, [fetchInitialPrompts]);


  const contextValue = useMemo(() => ({
    language,
    setLanguage,
    t
  }), [language, t]);

  const handleStoryCreate = async (options: StoryOptions) => {
    setAppState({ status: AppStatus.LOADING, phase: 'outline', stage: LoadingStage.DRAFTING_IDEAS });
    try {
      const outlineData = await generateStoryOutline(
        options,
        (update) => {
           setAppState(currentState => {
            if (currentState.status !== AppStatus.LOADING || currentState.phase !== 'outline') return currentState;
            return { ...currentState, stage: update.stage };
        });
        }
      );
       setAppState({ status: AppStatus.STYLE_SELECTION, outlineData });
    } catch (error) {
      console.error("Failed to generate story outline:", error);
      const errorMessage = error instanceof Error ? error.message : t('error.generic');
      setAppState({ status: AppStatus.ERROR, message: errorMessage });
    }
  };

  const handleStyleSelect = async (outlineData: StoryOutline, selectedCoverPrompt: string) => {
    setAppState({ status: AppStatus.LOADING, phase: 'full', stage: LoadingStage.ANALYZING_PROMPT });
    try {
        const finalStoryData = await generateFullStoryFromSelection(
            outlineData.originalOptions,
            selectedCoverPrompt,
            outlineData.synopsis,
            t,
            (update) => {
                setAppState(currentState => {
                    if (currentState.status !== AppStatus.LOADING || currentState.phase !== 'full') return currentState;
                    const newState: AppState = {
                        status: AppStatus.LOADING,
                        phase: 'full',
                        stage: update.stage,
                        progress: update.progress,
                        storyData: update.storyData ? { ...update.storyData, title: outlineData.title } : currentState.storyData,
                    };
                    return newState;
                });
            }
        );
        const completeStoryData: StoryData = { ...finalStoryData, title: outlineData.title };
        setAppState({ status: AppStatus.STORY, storyData: completeStoryData });
    } catch (error) {
        console.error("Failed to generate full story:", error);
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
  
  const handleStopGeneration = () => {
    setAppState({ status: AppStatus.INPUT });
  };
  
  const handleRetryImage = async (pageIndex: number) => {
      if (appState.status !== AppStatus.STORY || retryingPages.has(pageIndex)) return;

      const currentStoryData = appState.storyData;
      const pageToRetry = currentStoryData.pages[pageIndex];

      setRetryingPages(prev => new Set(prev).add(pageIndex));

      // Set page image to undefined to show loading spinner
      const storyDataWithLoading = {
          ...currentStoryData,
          pages: currentStoryData.pages.map((p, i) => i === pageIndex ? { ...p, imageUrl: undefined } : p)
      };
      setAppState({ status: AppStatus.STORY, storyData: storyDataWithLoading });
      
      try {
        const newImageUrl = await regenerateImage(
            pageToRetry.imagePrompt,
            currentStoryData.options.illustrationStyle
        );

        const storyDataWithNewImage = {
            ...currentStoryData,
            pages: currentStoryData.pages.map((p, i) => i === pageIndex ? { ...p, imageUrl: newImageUrl } : p)
        };
        setAppState({ status: AppStatus.STORY, storyData: storyDataWithNewImage });
      } catch (error) {
         console.error(`Failed to regenerate image for page ${pageIndex}`, error);
         // Restore the failed state
         setAppState({ status: AppStatus.STORY, storyData: currentStoryData });
      } finally {
        setRetryingPages(prev => {
            const next = new Set(prev);
            next.delete(pageIndex);
            return next;
        });
      }
  };

  const renderContent = () => {
    const inputScreenProps = {
        onCreateStory: handleStoryCreate,
        samplePrompts: samplePrompts,
        isLoadingSamples: isLoadingSamples,
        addMorePrompts: addMorePrompts,
    };
      
    switch (appState.status) {
      case AppStatus.WELCOME:
        return <WelcomeModal onAcknowledge={handleWelcomeAcknowledge} />;
      case AppStatus.INPUT:
        return <InputScreen {...inputScreenProps} />;
      case AppStatus.LOADING:
        return <LoadingScreen onStop={handleStopGeneration} phase={appState.phase} stage={appState.stage} progress={appState.progress} storyData={appState.storyData} />;
      case AppStatus.STYLE_SELECTION:
        return <StyleSelectionScreen outlineData={appState.outlineData} onStyleSelect={handleStyleSelect} />;
      case AppStatus.STORY:
        return <StoryViewer story={appState.storyData} onNewStory={handleNewStory} onRetryImage={handleRetryImage} retryingPages={retryingPages} />;
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
        return <InputScreen {...inputScreenProps} />;
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