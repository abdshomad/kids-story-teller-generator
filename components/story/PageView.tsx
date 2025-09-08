import React, { FC } from 'react';
import { StoryData, StoryPage } from '../../types';
import { useAppContext } from '../../App';
import { ImageOff, RefreshCw, Loader2, Info } from 'lucide-react';

interface PageViewProps {
    story: StoryData;
    currentPage: number;
    isTitlePage: boolean;
    retryingPages: Set<number>;
    onRetryImage: (pageIndex: number) => void;
    renderPageTextWithSfx: (page: StoryPage) => React.ReactNode;
}

const PageView: FC<PageViewProps> = ({ story, currentPage, isTitlePage, retryingPages, onRetryImage, renderPageTextWithSfx }) => {
    const { t } = useAppContext();

    const currentContent = isTitlePage
        ? { text: story.title, imageUrl: story.pages[0]?.imageUrl }
        : story.pages[currentPage];
    
    const pageToRender = isTitlePage ? null : story.pages[currentPage];
    const hasSoundEffectsOnPage = pageToRender && pageToRender.soundEffects?.some(sfx => sfx.audioUrl);

    return (
        <div className="w-full max-w-5xl aspect-[4/3] bg-white rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden">
            <div className="w-full md:w-1/2 h-1/2 md:h-full bg-slate-100 flex items-center justify-center p-4">
                {(() => {
                    if (currentContent.imageUrl && currentContent.imageUrl !== 'GENERATION_FAILED') {
                        return <img src={currentContent.imageUrl} alt={isTitlePage ? 'Story cover' : `Illustration for page ${currentPage + 1}`} className="w-full h-full object-cover rounded-lg"/>;
                    }
                    if (currentContent.imageUrl === 'GENERATION_FAILED') {
                        const isRetrying = !isTitlePage && retryingPages.has(currentPage);
                        return (
                            <div className="flex flex-col items-center justify-center text-red-500 gap-4 p-4 text-center">
                                <ImageOff className="w-16 h-16" />
                                <span className="font-bold text-lg">{t('story.imageError')}</span>
                                {!isTitlePage && (
                                    <button 
                                        onClick={() => onRetryImage(currentPage)} 
                                        disabled={isRetrying}
                                        className="mt-2 px-4 py-2 bg-blue-500 text-white font-bold rounded-full hover:bg-blue-600 transition-colors disabled:bg-slate-400 flex items-center gap-2"
                                    >
                                        {isRetrying ? <Loader2 className="w-5 h-5 animate-spin" /> : <RefreshCw className="w-5 h-5" />}
                                        {isRetrying ? t('common.loading') : t('common.tryAgain')}
                                    </button>
                                )}
                            </div>
                        );
                    }
                    return (
                        <div className="flex flex-col items-center justify-center text-slate-500 gap-4">
                            <div className="w-16 h-16 border-4 border-slate-300 border-t-purple-400 rounded-full animate-spin"></div>
                            <span className="font-bold text-lg">{t('story.illustrating')}</span>
                        </div>
                    );
                })()}
            </div>
            <div className="w-full md:w-1/2 h-1/2 md:h-full p-6 sm:p-8 flex flex-col justify-center">
                 <div className="overflow-y-auto flex-grow">
                    <p className={`text-slate-800 ${isTitlePage ? 'text-3xl md:text-4xl lg:text-5xl font-extrabold text-center' : 'text-lg md:text-xl lg:text-2xl leading-relaxed'}`}>
                        {isTitlePage 
                            ? currentContent.text 
                            : renderPageTextWithSfx(pageToRender as StoryPage)}
                    </p>
                 </div>
                 {hasSoundEffectsOnPage && (
                    <div className="flex-shrink-0 text-center text-slate-500 text-sm mt-4 flex items-center justify-center gap-2 animate-pulse">
                        <Info className="w-4 h-4" />
                        <span>{t('story.sfx_tooltip')}</span>
                    </div>
                 )}
            </div>
        </div>
    );
};

export default PageView;
