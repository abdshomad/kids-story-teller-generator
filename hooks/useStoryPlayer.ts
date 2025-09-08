import { useState, useEffect } from 'react';
import { useTextToSpeech } from './useTextToSpeech';
import { StoryData } from '../types';

export const useStoryPlayer = (
    story: StoryData,
    currentPage: number,
    goToNextPage: () => void,
    language: string
) => {
    const [isAutoPlay, setIsAutoPlay] = useState(false);
    const { isSpeaking, speak, cancel, isSupported } = useTextToSpeech(language);
    
    const canPlay = isSupported && story.pages.some(p => p.audioUrl);

    const handleReadAloud = () => {
        if (isSpeaking) {
            cancel();
            setIsAutoPlay(false);
        } else if (canPlay) {
            setIsAutoPlay(true);
            if (currentPage === -1) goToNextPage();
        }
    };

    useEffect(() => {
        if (isAutoPlay && !isSpeaking && currentPage >= 0 && currentPage < story.pages.length) {
            const page = story.pages[currentPage];
            if (page.audioUrl) {
                speak(page.audioUrl, () => {
                    if (currentPage < story.pages.length - 1) goToNextPage();
                    else setIsAutoPlay(false);
                });
            } else {
                if (currentPage < story.pages.length - 1) goToNextPage();
                else setIsAutoPlay(false);
            }
        }
    }, [isAutoPlay, currentPage, isSpeaking, speak, story.pages, goToNextPage]);
    
    useEffect(() => { return () => { cancel(); }; }, [currentPage, cancel]);

    return { isSpeaking, handleReadAloud, canPlayAudio: canPlay, cancelSpeech: cancel };
};
