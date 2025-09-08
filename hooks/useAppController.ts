
import { useState } from 'react';
import { AppState, AppStatus, StoryOptions, StoryOutline, LoadingStage } from '../types';
import { generateStoryOutline, generateFullStoryFromSelection, regenerateImage } from '../services/storyService';

type TFunction = (key: string, params?: Record<string, string | number>) => string;

export const useAppController = (t: TFunction) => {
    const [appState, setAppState] = useState<AppState>({ status: AppStatus.WELCOME });
    const [retryingPages, setRetryingPages] = useState<Set<number>>(new Set());

    const handleStoryCreate = async (options: StoryOptions) => {
        setAppState({ status: AppStatus.LOADING, phase: 'outline', stage: LoadingStage.DRAFTING_IDEAS });
        try {
          const outlineData = await generateStoryOutline(options, (update) => {
               setAppState(s => (s.status === AppStatus.LOADING && s.phase === 'outline') ? { ...s, stage: update.stage } : s);
            });
           setAppState({ status: AppStatus.STYLE_SELECTION, outlineData });
        } catch (error) {
          console.error("Failed to generate story outline:", error);
          const message = error instanceof Error ? error.message : t('error.generic');
          setAppState({ status: AppStatus.ERROR, message });
        }
    };

    const handleStyleSelect = async (outlineData: StoryOutline, selectedCoverPrompt: string) => {
        setAppState({ status: AppStatus.LOADING, phase: 'full', stage: LoadingStage.ANALYZING_PROMPT });
        try {
            const finalStoryData = await generateFullStoryFromSelection(
                outlineData.originalOptions, selectedCoverPrompt, outlineData.synopsis, t, (update) => {
                    setAppState(s => {
                        if (s.status !== AppStatus.LOADING || s.phase !== 'full') return s;
                        return { ...s, stage: update.stage, progress: update.progress, storyData: update.storyData ? { ...update.storyData, title: outlineData.title } : s.storyData };
                    });
                }
            );
            setAppState({ status: AppStatus.STORY, storyData: { ...finalStoryData, title: outlineData.title } });
        } catch (error) {
            console.error("Failed to generate full story:", error);
            const message = error instanceof Error ? error.message : t('error.generic');
            setAppState({ status: AppStatus.ERROR, message });
        }
    };

    const handleRetryImage = async (pageIndex: number) => {
        if (appState.status !== AppStatus.STORY || retryingPages.has(pageIndex)) return;
        const currentStory = appState.storyData;
        setRetryingPages(prev => new Set(prev).add(pageIndex));
        setAppState({ status: AppStatus.STORY, storyData: { ...currentStory, pages: currentStory.pages.map((p, i) => i === pageIndex ? { ...p, imageUrl: undefined } : p) } });
        try {
            const newImageUrl = await regenerateImage(currentStory.pages[pageIndex].imagePrompt, currentStory.options.illustrationStyle);
            setAppState(s => s.status === AppStatus.STORY ? { ...s, storyData: { ...s.storyData, pages: s.storyData.pages.map((p, i) => i === pageIndex ? { ...p, imageUrl: newImageUrl } : p) } } : s);
        } catch (error) {
           console.error(`Failed to regenerate image for page ${pageIndex}`, error);
           setAppState({ status: AppStatus.STORY, storyData: currentStory });
        } finally {
           setRetryingPages(prev => { const next = new Set(prev); next.delete(pageIndex); return next; });
        }
    };

    const handleNewStory = () => setAppState({ status: AppStatus.INPUT });
    const handleWelcomeAcknowledge = () => setAppState({ status: AppStatus.INPUT });
    const handleStopGeneration = () => setAppState({ status: AppStatus.INPUT });

    return { appState, retryingPages, handleStoryCreate, handleStyleSelect, handleRetryImage, handleNewStory, handleWelcomeAcknowledge, handleStopGeneration };
};
