



import React from 'react';
import { LoadingStage, StoryData, StoryPage } from '../types';
import { useAppContext } from '../App';
import { CheckCircle2, Loader2, Circle, BookText, Images, Sparkles, ImageOff, Edit } from 'lucide-react';

interface LoadingScreenProps {
  stage: LoadingStage;
  phase: 'outline' | 'full';
  progress?: { current: number; total: number };
  storyData?: StoryData;
}

const outlineStepsConfig = (t: (key: string) => string) => [
  {
    id: 'drafting',
    title: t('loading.main.drafting'),
    icon: <Edit className="w-8 h-8" />,
    substeps: [
      { id: LoadingStage.DRAFTING_IDEAS, title: t('loading.sub.draftingIdeas') },
      { id: LoadingStage.SKETCHING_COVERS, title: t('loading.sub.sketchingCovers') },
    ]
  }
];

const fullStepsConfig = (t: (key: string) => string) => [
  {
    id: 'writing',
    title: t('loading.main.writing'),
    icon: <BookText className="w-8 h-8" />,
    substeps: [
      { id: LoadingStage.ANALYZING_PROMPT, title: t('loading.sub.analyzing') },
      { id: LoadingStage.WRITING_PAGES, title: t('loading.sub.writingPages') },
    ]
  },
  {
    id: 'illustrating',
    title: t('loading.main.illustrating'),
    icon: <Images className="w-8 h-8" />,
    substeps: [
      { id: LoadingStage.DESIGNING_CHARACTERS, title: t('loading.sub.designingCharacters') },
      { id: LoadingStage.PAINTING_SCENES, title: t('loading.sub.paintingScenes') },
    ]
  },
  {
    id: 'finalizing',
    title: t('loading.main.finalizing'),
    icon: <Sparkles className="w-8 h-8" />,
    substeps: [
      { id: LoadingStage.ASSEMBLING_BOOK, title: t('loading.sub.assembling') },
      { id: LoadingStage.FINAL_TOUCHES, title: t('loading.sub.finalTouches') },
    ]
  }
];

const statusConfig = {
    completed: { icon: <CheckCircle2 className="w-6 h-6 text-green-500" />, textClass: 'text-green-600/80 line-through' },
    in_progress: { icon: <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />, textClass: 'text-purple-600 font-bold' },
    pending: { icon: <Circle className="w-6 h-6 text-slate-400" />, textClass: 'text-slate-500' },
};

const SubStep: React.FC<{ title: string; status: 'completed' | 'in_progress' | 'pending'; progressText?: string; }> = ({ title, status, progressText }) => {
    const config = statusConfig[status];
    return (
        <div className="flex items-start gap-4">
            <div>{config.icon}</div>
            <div className="flex-grow">
                <h4 className={`text-lg transition-all duration-300 ${config.textClass}`}>{title}</h4>
                {status === 'in_progress' && progressText && <p className="text-purple-600/80 text-sm mt-1">{progressText}</p>}
            </div>
        </div>
    );
};

const PageThumbnail: React.FC<{ page: StoryPage; pageNumber: number }> = ({ page, pageNumber }) => (
    <div className="bg-white/60 backdrop-blur-sm rounded-xl shadow-lg p-3 transition-all duration-500 animate-fade-in group" title={page.imagePrompt}>
        <div className="aspect-square bg-slate-200 rounded-lg mb-2 flex items-center justify-center overflow-hidden">
            {page.imageUrl === 'GENERATION_FAILED' ? (
                <div className="flex flex-col items-center text-red-400"><ImageOff className="w-8 h-8" /><span className="text-xs font-bold mt-1">Failed</span></div>
            ) : page.imageUrl ? (
                <img src={page.imageUrl} alt={`Page ${pageNumber}`} className="w-full h-full object-cover" />
            ) : (
                <div className="flex flex-col items-center text-slate-400"><Loader2 className="w-8 h-8 animate-spin" /></div>
            )}
        </div>
        <h3 className="font-bold text-sm text-slate-700">Page {pageNumber}</h3>
        <p className="text-xs text-slate-600 h-12 overflow-hidden">{page.text}</p>
        <p className="text-xs text-slate-400 italic mt-1 truncate group-hover:whitespace-normal group-hover:text-slate-500 transition">
            &ldquo;{page.imagePrompt}&rdquo;
        </p>
    </div>
);

const LoadingScreen: React.FC<LoadingScreenProps> = ({ stage, phase, progress, storyData }) => {
  const { t } = useAppContext();
  const steps = phase === 'outline' ? outlineStepsConfig(t) : fullStepsConfig(t);
  
  const allSubsteps = steps.flatMap(s => s.substeps.map(sub => sub.id));
  const currentSubstepIndex = allSubsteps.indexOf(stage);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-pink-100 via-purple-100 to-blue-200 flex flex-col items-center p-4 z-50 overflow-y-auto">
        <style>{`
          @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
          .animate-fade-in { animation: fade-in 0.5s ease-out forwards; }
        `}</style>
        
        <div className="w-full max-w-2xl mx-auto my-8 flex-shrink-0">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-800 text-center mb-10 animate-pulse">The magic is happening...</h2>
            <div className="space-y-8">
                {steps.map((mainStep) => {
                    const mainStepSubstepIds = mainStep.substeps.map(s => s.id);
                    const firstSubstepIndexForMain = allSubsteps.indexOf(mainStepSubstepIds[0]);
                    const lastSubstepIndexForMain = allSubsteps.indexOf(mainStepSubstepIds[mainStepSubstepIds.length - 1]);
                    
                    const isMainStepActive = currentSubstepIndex >= firstSubstepIndexForMain && currentSubstepIndex <= lastSubstepIndexForMain;
                    const isMainStepCompleted = currentSubstepIndex > lastSubstepIndexForMain;
                    
                    let mainStepTextColor = isMainStepActive ? 'text-purple-600' : isMainStepCompleted ? 'text-green-600' : 'text-slate-500';
                    
                    return (
                        <div key={mainStep.id}>
                            <div className={`flex items-center gap-4 mb-3 transition-all duration-500 ${mainStepTextColor}`}>
                                {isMainStepCompleted ? <CheckCircle2 className="w-7 h-7" /> : (isMainStepActive ? <Loader2 className="w-7 h-7 animate-spin" /> : React.cloneElement(mainStep.icon, { className: 'w-7 h-7' }))}
                                <h3 className="text-2xl font-bold">{mainStep.title}</h3>
                            </div>
                            <div className="ps-11 space-y-2 border-s-2 border-slate-300/80 ms-3">
                                {mainStep.substeps.map((substep) => {
                                    const globalSubstepIndex = allSubsteps.indexOf(substep.id);
                                    let status: 'completed' | 'in_progress' | 'pending' = (globalSubstepIndex < currentSubstepIndex) ? 'completed' : (globalSubstepIndex === currentSubstepIndex) ? 'in_progress' : 'pending';

                                    let progressText: string | undefined;
                                    if (status === 'in_progress' && progress) {
                                        if (substep.id === LoadingStage.PAINTING_SCENES) progressText = t('loading.illustratingPage', { current: progress.current, total: progress.total });
                                        else if (substep.id === LoadingStage.FINAL_TOUCHES) progressText = t('loading.finalTouchesPage', { current: progress.current, total: progress.total });
                                    }
                                    
                                    const isVisible = globalSubstepIndex <= currentSubstepIndex;
                                    
                                    return (
                                        <div key={substep.id} className={`transition-all duration-500 ${isVisible ? 'opacity-100 max-h-20' : 'opacity-0 max-h-0 overflow-hidden'}`}>
                                            <SubStep title={substep.title} status={status} progressText={progressText} />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>

        {phase === 'full' && storyData?.pages && (
            <div className="w-full flex-grow py-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {storyData.pages.map((page, index) => (
                        <PageThumbnail key={index} page={page} pageNumber={index + 1} />
                    ))}
                </div>
            </div>
        )}
    </div>
  );
};

export default LoadingScreen;