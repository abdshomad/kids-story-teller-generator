

import React from 'react';
import { LoadingStage } from '../types';
import { useAppContext } from '../App';
import { CheckCircle2, Loader2, Circle, BookText, Images, Sparkles } from 'lucide-react';

interface LoadingScreenProps {
  stage: LoadingStage;
  progress?: { current: number; total: number };
}

const stepsConfig = (t: (key: string, params?: Record<string, string | number>) => string) => [
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
      { id: LoadingStage.ADDING_SPARKLES, title: t('loading.sub.sparkles') },
    ]
  }
];

const statusConfig = {
    completed: {
        icon: <CheckCircle2 className="w-6 h-6 text-green-400" />,
        textClass: 'text-green-300/80 line-through',
    },
    in_progress: {
        icon: <Loader2 className="w-6 h-6 text-yellow-300 animate-spin" />,
        textClass: 'text-yellow-200 font-bold',
    },
    pending: {
        icon: <Circle className="w-6 h-6 text-slate-500" />,
        textClass: 'text-slate-400',
    },
};

const SubStep: React.FC<{ title: string; status: 'completed' | 'in_progress' | 'pending'; progressText?: string; }> = ({ title, status, progressText }) => {
    const config = statusConfig[status];
    return (
        <div className="flex items-center gap-4">
            <div>{config.icon}</div>
            <div className="flex-grow">
                <h4 className={`text-xl transition-all duration-300 ${config.textClass}`}>{title}</h4>
                {status === 'in_progress' && progressText && (
                    <p className="text-yellow-200/80 text-sm mt-1">{progressText}</p>
                )}
            </div>
        </div>
    );
};


const LoadingScreen: React.FC<LoadingScreenProps> = ({ stage, progress }) => {
  const { t } = useAppContext();
  const steps = stepsConfig(t);
  
  const allSubsteps = steps.flatMap(s => s.substeps.map(sub => sub.id));
  const currentSubstepIndex = allSubsteps.indexOf(stage);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-800 via-purple-900 to-slate-900 flex flex-col items-center justify-center text-white p-4 z-50">
      <h2 className="text-4xl font-extrabold text-center mb-12 animate-pulse">The magic is happening...</h2>
      <div className="space-y-10 w-full max-w-lg">
        {steps.map((mainStep) => {
          const mainStepSubstepIds = mainStep.substeps.map(s => s.id);
          const firstSubstepIndexForMain = allSubsteps.indexOf(mainStepSubstepIds[0]);
          const lastSubstepIndexForMain = allSubsteps.indexOf(mainStepSubstepIds[mainStepSubstepIds.length - 1]);
          
          const isMainStepActive = currentSubstepIndex >= firstSubstepIndexForMain && currentSubstepIndex <= lastSubstepIndexForMain;
          const isMainStepCompleted = currentSubstepIndex > lastSubstepIndexForMain;
          
          let mainStepTextColor = 'text-slate-400';
          if (isMainStepActive) mainStepTextColor = 'text-yellow-200';
          if (isMainStepCompleted) mainStepTextColor = 'text-green-300';
          
          return (
            <div key={mainStep.id}>
              <div className={`flex items-center gap-4 mb-4 transition-all duration-500 ${mainStepTextColor}`}>
                {isMainStepCompleted ? <CheckCircle2 className="w-8 h-8" /> : (isMainStepActive ? <Loader2 className="w-8 h-8 animate-spin" /> : React.cloneElement(mainStep.icon, { className: 'w-8 h-8' }))}
                <h3 className="text-3xl font-bold">{mainStep.title}</h3>
              </div>
              <div className="pl-12 space-y-3 border-l-2 border-slate-700/50 ml-4">
                {mainStep.substeps.map((substep) => {
                  const globalSubstepIndex = allSubsteps.indexOf(substep.id);
                  let status: 'completed' | 'in_progress' | 'pending' = 'pending';
                  if (globalSubstepIndex < currentSubstepIndex) {
                    status = 'completed';
                  } else if (globalSubstepIndex === currentSubstepIndex) {
                    status = 'in_progress';
                  }

                  let progressText: string | undefined;
                  if (substep.id === LoadingStage.PAINTING_SCENES && status === 'in_progress' && progress) {
                      progressText = t('loading.illustratingPage', { current: progress.current, total: progress.total });
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
  );
};

export default LoadingScreen;