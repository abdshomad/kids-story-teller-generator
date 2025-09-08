import React, { useCallback, useEffect } from 'react';
import { StoryData, StoryPage } from '../types';
import { useAppContext } from '../App';
import StoryHeader from './story/StoryHeader';
import StoryControls from './story/StoryControls';
import PageView from './story/PageView';
import { useStoryNavigation } from '../hooks/useStoryNavigation';
import { useStoryPlayer } from '../hooks/useStoryPlayer';
import { useSoundEffects } from '../hooks/useSoundEffects';

interface StoryViewerProps {
  story: StoryData;
  onNewStory: () => void;
  onRetryImage: (pageIndex: number) => void;
  retryingPages: Set<number>;
}

const stripNarrationTags = (text: string): string => text?.replace(/\[.*?\]/g, '').replace(/\s\s+/g, ' ').trim() || '';

const StoryViewer: React.FC<StoryViewerProps> = ({ story, onNewStory, onRetryImage, retryingPages }) => {
  const { language, t } = useAppContext();
  const totalPages = story.pages.length;

  const { currentPage, setCurrentPage, goToNextPage, goToPrevPage } = useStoryNavigation(totalPages);
  const { isSpeaking, handleReadAloud, canPlayAudio, cancelSpeech } = useStoryPlayer(story, currentPage, goToNextPage);
  const { playSfx, stopSfx } = useSoundEffects();
  
  useEffect(() => { stopSfx(); }, [currentPage, stopSfx]);
  
  const handleNewStoryClick = () => {
    cancelSpeech();
    stopSfx();
    onNewStory();
  };

  const renderPageTextWithSfx = useCallback((page: StoryPage) => {
    const { text, soundEffects } = page;
    
    const triggerMap = new Map<string, string>();
    if(soundEffects){
      soundEffects.forEach(sfx => { if (sfx.text_trigger && sfx.audioUrl) triggerMap.set(stripNarrationTags(sfx.text_trigger.trim()), sfx.audioUrl); });
    }

    const renderContentWithSfx = (content: string) => {
      if (triggerMap.size === 0) return <>{content}</>;
      
      const regex = new RegExp(`(${[...triggerMap.keys()].sort((a, b) => b.length - a.length).map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'g');
      
      return (
        <>
          {content.split(regex).filter(Boolean).map((part, index) => {
            const audioUrl = triggerMap.get(part.trim());
            if (audioUrl) {
              return ( <span key={index} className="text-fuchsia-600 font-bold cursor-pointer hover:underline" onClick={() => playSfx(audioUrl)} role="button" tabIndex={0} onKeyPress={(e) => e.key === 'Enter' && playSfx(audioUrl)} title={t('story.sfx_tooltip')}> {part} </span> );
            }
            return <React.Fragment key={index}>{part}</React.Fragment>;
          })}
        </>
      );
    };
    
    return text.map((part, index) => {
      const renderedContent = renderContentWithSfx(stripNarrationTags(part.content));
      if (part.type === 'dialogue') {
        return <p key={index} className="mb-2"><strong className="text-purple-700">{part.characterName}:</strong> <em className="text-slate-800">"{renderedContent}"</em></p>;
      }
      return <p key={index} className="mb-2 inline">{renderedContent} </p>;
    });

  }, [playSfx, t]);

  return (
    <div className="h-screen w-screen bg-slate-800 flex flex-col p-4 sm:p-6 lg:p-8">
      <StoryHeader title={story.title} isSpeaking={isSpeaking} isSupported={canPlayAudio} onNewStory={handleNewStoryClick} onReadAloud={handleReadAloud} />
      <div className="flex-grow flex items-center justify-center relative">
        <PageView story={story} currentPage={currentPage} isTitlePage={currentPage === -1} retryingPages={retryingPages} onRetryImage={onRetryImage} renderPageTextWithSfx={renderPageTextWithSfx} />
        <StoryControls currentPage={currentPage} totalPages={totalPages} onNext={goToNextPage} onPrev={goToPrevPage} isTitlePage={currentPage === -1} />
      </div>
      <div className="flex-shrink-0 flex justify-center items-center gap-2 pt-4">
        <div onClick={() => setCurrentPage(-1)} className={`w-3 h-3 rounded-full cursor-pointer transition-colors ${currentPage === -1 ? 'bg-yellow-400 scale-125' : 'bg-slate-600 hover:bg-slate-500'}`}></div>
        {story.pages.map((_, index) => ( <div key={index} onClick={() => setCurrentPage(index)} className={`w-3 h-3 rounded-full cursor-pointer transition-all ${currentPage === index ? 'bg-yellow-400 scale-125' : 'bg-slate-600 hover:bg-slate-500'}`}></div> ))}
      </div>
    </div>
  );
};

export default StoryViewer;