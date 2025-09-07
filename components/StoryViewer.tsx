
import React, { useState, useEffect, useCallback } from 'react';
import { StoryData } from '../types';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { useAppContext } from '../App';
import VolumeUpIcon from './icons/VolumeUpIcon';
import VolumeOffIcon from './icons/VolumeOffIcon';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import ArrowRightIcon from './icons/ArrowRightIcon';

interface StoryViewerProps {
  story: StoryData;
  onNewStory: () => void;
}

const StoryViewer: React.FC<StoryViewerProps> = ({ story, onNewStory }) => {
  const [currentPage, setCurrentPage] = useState(-1); // -1 for title page
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const { language, t } = useAppContext();
  const { isSpeaking, speak, cancel, isSupported } = useTextToSpeech(language);

  const totalPages = story.pages.length;
  const isTitlePage = currentPage === -1;

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
          setIsAutoPlay(true);
          if (isTitlePage) {
            goToNextPage();
          }
      }
  };

  useEffect(() => {
    if (isAutoPlay && !isSpeaking && currentPage >= 0 && currentPage < totalPages) {
      speak(story.pages[currentPage].text, () => {
        if (currentPage < totalPages - 1) {
          goToNextPage();
        } else {
          setIsAutoPlay(false); // End of story
        }
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAutoPlay, currentPage, isSpeaking, speak, story, totalPages]);
  
  useEffect(() => {
    // Stop speaking if user navigates manually while autoplay is on
    return () => {
        cancel();
    }
  }, [currentPage, cancel]);

  const currentContent = isTitlePage
    ? { text: story.title, imageUrl: story.pages[0]?.imageUrl }
    : story.pages[currentPage];

  return (
    <div className="h-screen w-screen bg-slate-800 flex flex-col p-4 sm:p-6 lg:p-8">
      <div className="flex justify-between items-center mb-4 text-white flex-shrink-0">
        <h1 className="text-xl font-bold truncate">{story.title}</h1>
        <div className="flex items-center gap-4">
          {isSupported && (
            <button onClick={handleReadAloud} title={t('story.readAloud')} className="p-2 rounded-full hover:bg-slate-700 transition-colors">
              {isSpeaking ? <VolumeUpIcon className="w-6 h-6 text-yellow-400" /> : <VolumeOffIcon className="w-6 h-6" />}
            </button>
          )}
          <button onClick={onNewStory} className="px-4 py-2 bg-blue-500 font-bold rounded-full hover:bg-blue-600 transition-colors">
            {t('story.newStory')}
          </button>
        </div>
      </div>

      <div className="flex-grow flex items-center justify-center relative">
        <div className="w-full max-w-5xl aspect-[4/3] bg-white rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden">
            <div className="w-full md:w-1/2 h-1/2 md:h-full bg-slate-100 flex items-center justify-center">
                {currentContent.imageUrl ? (
                    <img src={currentContent.imageUrl} alt={isTitlePage ? 'Story cover' : `Illustration for page ${currentPage + 1}`} className="w-full h-full object-cover"/>
                ) : (
                    <div className="text-slate-400">Image not available</div>
                )}
            </div>
            <div className="w-full md:w-1/2 h-1/2 md:h-full p-6 sm:p-8 flex flex-col justify-center">
                 <div className="overflow-y-auto flex-grow">
                    <p className={`text-slate-800 ${isTitlePage ? 'text-3xl md:text-4xl lg:text-5xl font-extrabold text-center' : 'text-lg md:text-xl lg:text-2xl leading-relaxed'}`}>
                        {currentContent.text}
                    </p>
                 </div>
            </div>
        </div>
        
        {/* Navigation Buttons */}
        <button onClick={goToPrevPage} disabled={isTitlePage} className="absolute left-0 sm:left-4 lg:left-8 top-1/2 -translate-y-1/2 p-3 bg-white/50 rounded-full text-slate-800 hover:bg-white disabled:opacity-0 disabled:cursor-not-allowed transition-all">
          <ArrowLeftIcon className="w-8 h-8"/>
        </button>
        <button onClick={goToNextPage} disabled={currentPage === totalPages - 1} className="absolute right-0 sm:right-4 lg:right-8 top-1/2 -translate-y-1/2 p-3 bg-white/50 rounded-full text-slate-800 hover:bg-white disabled:opacity-0 disabled:cursor-not-allowed transition-all">
          <ArrowRightIcon className="w-8 h-8"/>
        </button>
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
