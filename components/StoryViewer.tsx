import React, { useState, useEffect, useCallback } from 'react';
import { StoryData, SoundEffect, StoryPage } from '../types';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { useAppContext } from '../App';
import StoryHeader from './story/StoryHeader';
import StoryControls from './story/StoryControls';
import PageView from './story/PageView';

interface StoryViewerProps {
  story: StoryData;
  onNewStory: () => void;
  onRetryImage: (pageIndex: number) => void;
  retryingPages: Set<number>;
}

const stripNarrationTags = (text: string): string => {
  if (!text) return '';
  return text.replace(/\[.*?\]/g, '').replace(/\s\s+/g, ' ').trim();
};

const StoryViewer: React.FC<StoryViewerProps> = ({ story, onNewStory, onRetryImage, retryingPages }) => {
  const [currentPage, setCurrentPage] = useState(-1); // -1 for title page
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const { language, t } = useAppContext();
  const { isSpeaking, speak, cancel, isSupported } = useTextToSpeech(language);
  const [playingSfx, setPlayingSfx] = useState<HTMLAudioElement | null>(null);

  const totalPages = story.pages.length;
  const isTitlePage = currentPage === -1;
  
  const playSfx = useCallback((audioUrl: string) => {
    if (playingSfx) {
      playingSfx.pause();
      playingSfx.currentTime = 0;
    }
    const audio = new Audio(audioUrl);
    audio.play().catch(e => console.error("Error playing sound effect:", e));
    setPlayingSfx(audio);
  }, [playingSfx]);

  const renderPageTextWithSfx = useCallback((page: StoryPage) => {
    const { text, soundEffects } = page;
    if (!soundEffects || soundEffects.length === 0) {
      return stripNarrationTags(text);
    }

    const triggerMap = new Map<string, string>();
    soundEffects.forEach(sfx => {
      if (sfx.text_trigger && sfx.audioUrl) {
        const strippedTrigger = stripNarrationTags(sfx.text_trigger.trim());
        if (strippedTrigger) {
          triggerMap.set(strippedTrigger, sfx.audioUrl);
        }
      }
    });
    
    const strippedText = stripNarrationTags(text);

    if (triggerMap.size === 0) {
      return strippedText;
    }

    const triggers = Array.from(triggerMap.keys());
    triggers.sort((a, b) => b.length - a.length);
    const regex = new RegExp(`(${triggers.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'g');
    
    const parts = strippedText.split(regex).filter(Boolean);

    return (
      <>
        {parts.map((part, index) => {
          const audioUrl = triggerMap.get(part.trim());
          if (audioUrl) {
            return (
              <span
                key={index}
                className="text-purple-600 font-bold cursor-pointer hover:underline"
                onClick={() => playSfx(audioUrl)}
                role="button"
                tabIndex={0}
                onKeyPress={(e) => e.key === 'Enter' && playSfx(audioUrl)}
                title={t('story.sfx_tooltip')}
              >
                {part}
              </span>
            );
          }
          return <React.Fragment key={index}>{part}</React.Fragment>;
        })}
      </>
    );
  }, [playSfx, t]);

  const goToNextPage = useCallback(() => {
    setCurrentPage(prev => (prev < totalPages - 1 ? prev + 1 : prev));
  }, [totalPages]);

  const goToPrevPage = () => {
    setCurrentPage(prev => (prev > -1 ? prev - 1 : prev));
  };
  
  const handleReadAloud = () => {
      if (isSpeaking) {
          cancel();
          setIsAutoPlay(false);
      } else {
          const canPlay = isSupported && story.pages.some(p => p.audioUrl);
          if (canPlay) {
              setIsAutoPlay(true);
              if (isTitlePage) {
                goToNextPage();
              }
          }
      }
  };

  useEffect(() => {
    if (isAutoPlay && !isSpeaking && currentPage >= 0 && currentPage < totalPages) {
      const page = story.pages[currentPage];
      if (page.audioUrl) {
          speak(page.audioUrl, () => {
            if (currentPage < totalPages - 1) {
              goToNextPage();
            } else {
              setIsAutoPlay(false);
            }
          });
      } else {
          console.warn(`Missing audio for page ${currentPage + 1}, skipping.`);
          if (currentPage < totalPages - 1) {
              goToNextPage();
          } else {
              setIsAutoPlay(false);
          }
      }
    }
  }, [isAutoPlay, currentPage, isSpeaking, speak, story, totalPages, goToNextPage]);
  
  useEffect(() => {
    return () => { 
        cancel();
        if (playingSfx) {
            playingSfx.pause();
        }
    }
  }, [currentPage, cancel, playingSfx]);

  return (
    <div className="h-screen w-screen bg-slate-800 flex flex-col p-4 sm:p-6 lg:p-8">
      <StoryHeader 
        title={story.title}
        isSpeaking={isSpeaking}
        isSupported={isSupported && story.pages.some(p => p.audioUrl)}
        onNewStory={onNewStory}
        onReadAloud={handleReadAloud}
      />

      <div className="flex-grow flex items-center justify-center relative">
        <PageView
            story={story}
            currentPage={currentPage}
            isTitlePage={isTitlePage}
            retryingPages={retryingPages}
            onRetryImage={onRetryImage}
            renderPageTextWithSfx={renderPageTextWithSfx}
        />
        <StoryControls 
            currentPage={currentPage}
            totalPages={totalPages}
            onNext={goToNextPage}
            onPrev={goToPrevPage}
            isTitlePage={isTitlePage}
        />
      </div>

      <div className="flex-shrink-0 flex justify-center items-center gap-2 pt-4">
        <div onClick={() => setCurrentPage(-1)} className={`w-3 h-3 rounded-full cursor-pointer transition-colors ${isTitlePage ? 'bg-yellow-400 scale-125' : 'bg-slate-600 hover:bg-slate-500'}`}></div>
        {story.pages.map((_, index) => (
          <div key={index} onClick={() => setCurrentPage(index)} className={`w-3 h-3 rounded-full cursor-pointer transition-all ${currentPage === index ? 'bg-yellow-400 scale-125' : 'bg-slate-600 hover:bg-slate-500'}`}></div>
        ))}
      </div>
    </div>
  );
};

export default StoryViewer;