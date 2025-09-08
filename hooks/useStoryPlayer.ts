import { useState, useEffect, useMemo, useRef } from 'react';
import { useTextToSpeech } from './useTextToSpeech';
import { StoryData } from '../types';

export const useStoryPlayer = (
    story: StoryData,
    currentPage: number,
    goToNextPage: () => void,
) => {
    const [isAutoPlay, setIsAutoPlay] = useState(false);
    const { isSpeaking, speak, cancel, isSupported } = useTextToSpeech();
    const [currentAudioIndex, setCurrentAudioIndex] = useState(0);
    const nextPageTimeoutRef = useRef<number | null>(null);

    const pageAudioUrls = useMemo(() => 
        (currentPage >= 0 && story.pages[currentPage]?.audioUrls) || [],
    [currentPage, story.pages]);

    const clearNextPageTimeout = () => {
        if (nextPageTimeoutRef.current) {
            clearTimeout(nextPageTimeoutRef.current);
            nextPageTimeoutRef.current = null;
        }
    };

    // Reset audio index when page changes manually
    useEffect(() => {
        setCurrentAudioIndex(0);
        clearNextPageTimeout();
        // Also cancel any ongoing speech from the previous page
        if (isSpeaking) {
            cancel();
        }
    }, [currentPage, cancel]);
    
    // The main player loop
    useEffect(() => {
        if (isAutoPlay && !isSpeaking && currentPage >= 0 && pageAudioUrls.length > 0 && currentAudioIndex < pageAudioUrls.length) {
            const nextAudioUrl = pageAudioUrls[currentAudioIndex];
            speak(nextAudioUrl, () => {
                // onEnd callback: play next clip or move to next page
                if (currentAudioIndex < pageAudioUrls.length - 1) {
                    setCurrentAudioIndex(prev => prev + 1);
                } else {
                    if (currentPage < story.pages.length - 1) {
                        nextPageTimeoutRef.current = window.setTimeout(() => {
                            goToNextPage();
                        }, 1500); // Add a 1.5-second delay
                    } else {
                        setIsAutoPlay(false); // End of story
                    }
                }
            });
        }
    }, [isAutoPlay, isSpeaking, currentPage, currentAudioIndex, pageAudioUrls, speak, goToNextPage, story.pages.length]);
    
    const canPlay = isSupported && story.pages.some(p => p.audioUrls && p.audioUrls.length > 0);

    const handleReadAloud = () => {
        clearNextPageTimeout();
        if (isSpeaking) {
            cancel();
            setIsAutoPlay(false);
        } else if (canPlay) {
            setCurrentAudioIndex(0); // Always restart from the beginning of the page
            setIsAutoPlay(true);
            // If on title page, immediately move to the first page to start playback
            if (currentPage === -1) {
                goToNextPage();
            }
        }
    };
    
    const cancelSpeech = () => {
        clearNextPageTimeout();
        cancel();
    };

    // Stop autoplay if the user navigates away or component unmounts
    useEffect(() => {
        return () => {
            clearNextPageTimeout();
            cancel();
            setIsAutoPlay(false);
        };
    }, [cancel]);

    return { isSpeaking, handleReadAloud, canPlayAudio: canPlay, cancelSpeech };
};
