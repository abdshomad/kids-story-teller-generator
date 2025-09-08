
import React from 'react';
import { LoadingStage, StoryData } from '../types';
import { useAppContext } from '../App';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { outlineStepsConfig, fullStepsConfig } from './loading/loadingScreenConfig';
import SubStep from './loading/SubStep';
import PageThumbnail from './loading/PageThumbnail';

interface LoadingScreenProps {
  stage: LoadingStage; phase: 'outline' | 'full'; progress?: { current: number; total: number }; storyData?: StoryData; onStop: () => void;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ stage, phase, progress, storyData, onStop }) => {
  const { t } = useAppContext();
  const steps = phase === 'outline' ? outlineStepsConfig(t) : fullStepsConfig(t);
  const allSubsteps = steps.flatMap(s => s.substeps.map(sub => sub.id));
  const currentSubstepIndex = allSubsteps.indexOf(stage);
  const showImagePanel = phase === 'full' && storyData?.pages && storyData.pages.length > 0;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-pink-100 via-purple-100 to-blue-200 flex flex-col p-4 sm:p-8 z-50 overflow-hidden">
        <style>{`.animate-fade-in{animation:fadeIn .5s ease-out forwards}@keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-800 text-center mb-6 flex-shrink-0 animate-pulse">{t('loading.main.title')}</h2>
        <div className="flex-grow flex flex-col lg:flex-row gap-8 overflow-hidden">
            <div className={`w-full flex-shrink-0 flex flex-col transition-all duration-500 ${showImagePanel ? 'lg:w-2/5 xl:w-1/3' : 'lg:w-full lg:max-w-2xl mx-auto'}`}>
                <div className="bg-white/40 backdrop-blur-md rounded-2xl p-6 overflow-y-auto flex-grow">
                    <div className="space-y-8">
                        {steps.map((mainStep) => {
                            const mainStepSubstepIds = mainStep.substeps.map(s => s.id);
                            const firstIdx = allSubsteps.indexOf(mainStepSubstepIds[0]);
                            const lastIdx = allSubsteps.indexOf(mainStepSubstepIds[mainStepSubstepIds.length - 1]);
                            const isActive = currentSubstepIndex >= firstIdx && currentSubstepIndex <= lastIdx;
                            const isCompleted = currentSubstepIndex > lastIdx;
                            const color = isActive ? 'text-purple-600' : isCompleted ? 'text-green-600' : 'text-slate-500';
                            return (
                                <div key={mainStep.id}>
                                    <div className={`flex items-center gap-4 mb-3 transition-all duration-500 ${color}`}>
                                        {isCompleted ? <CheckCircle2 className="w-7 h-7" /> : (isActive ? <Loader2 className="w-7 h-7 animate-spin" /> : React.cloneElement(mainStep.icon, { className: 'w-7 h-7' }))}
                                        <h3 className="text-2xl font-bold">{mainStep.title}</h3>
                                    </div>
                                    <div className="ps-11 space-y-2 border-s-2 border-slate-300/80 ms-3">
                                        {mainStep.substeps.map((substep) => {
                                            const subIdx = allSubsteps.indexOf(substep.id);
                                            const status = (subIdx < currentSubstepIndex) ? 'completed' : (subIdx === currentSubstepIndex) ? 'in_progress' : 'pending';
                                            let progressText: string | undefined;
                                            if (status === 'in_progress' && progress) {
                                                if (substep.id === LoadingStage.PAINTING_SCENES) progressText = t('loading.illustratingPage', progress);
                                                else if (substep.id === LoadingStage.FINAL_TOUCHES) progressText = t('loading.finalTouchesPage', progress);
                                            }
                                            return (
                                                <div key={substep.id} className={`transition-all duration-500 ${subIdx <= currentSubstepIndex ? 'opacity-100 max-h-20' : 'opacity-0 max-h-0 overflow-hidden'}`}>
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
                <div className="mt-6 text-center flex-shrink-0">
                    <button onClick={onStop} className="px-6 py-3 bg-red-500/80 text-white font-bold rounded-full shadow-lg hover:bg-red-600 transition-colors flex items-center gap-2 mx-auto">
                        <XCircle className="w-5 h-5" /> Stop
                    </button>
                </div>
            </div>
            {showImagePanel && (
                <div className="flex-grow overflow-y-auto p-2">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                        {storyData.pages.map((page, index) => (<PageThumbnail key={index} page={page} pageNumber={index + 1} />))}
                    </div>
                </div>
            )}
        </div>
    </div>
  );
};

export default LoadingScreen;
