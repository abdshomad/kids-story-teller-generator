
import React from 'react';
import { LoadingStage } from '../types';
import { useAppContext } from '../App';
import { CheckCircle2, Loader2, Circle, BookText, Images, Sparkles } from 'lucide-react';

interface LoadingScreenProps {
  stage: LoadingStage;
  progress?: { current: number; total: number };
}

interface StepProps {
  icon: React.ReactNode;
  title: string;
  status: 'completed' | 'in_progress' | 'pending';
  progressText?: string;
}

const statusConfig = {
    completed: {
        icon: <CheckCircle2 className="w-8 h-8 text-green-400" />,
        textClass: 'text-green-300',
    },
    in_progress: {
        icon: <Loader2 className="w-8 h-8 text-yellow-300 animate-spin" />,
        textClass: 'text-yellow-200 font-bold',
    },
    pending: {
        icon: <Circle className="w-8 h-8 text-slate-400" />,
        textClass: 'text-slate-400',
    },
};

const LoadingStep: React.FC<StepProps> = ({ title, status, progressText }) => {
    const config = statusConfig[status];
    return (
        <div className="flex items-center gap-6 w-full max-w-md">
            <div>{config.icon}</div>
            <div className="flex-grow">
                <h3 className={`text-2xl transition-colors duration-300 ${config.textClass}`}>{title}</h3>
                {status === 'in_progress' && progressText && (
                    <p className="text-yellow-200/80 text-sm">{progressText}</p>
                )}
            </div>
        </div>
    );
};

const LoadingScreen: React.FC<LoadingScreenProps> = ({ stage, progress }) => {
  const { t } = useAppContext();

  const stageOrder: LoadingStage[] = [
    LoadingStage.WRITING,
    LoadingStage.ILLUSTRATING,
    LoadingStage.FINISHING,
  ];

  const currentStageIndex = stageOrder.indexOf(stage);

  const steps = [
    { id: LoadingStage.WRITING, title: t('loading.steps.writing'), icon: <BookText /> },
    { id: LoadingStage.ILLUSTRATING, title: t('loading.steps.illustrating'), icon: <Images /> },
    { id: LoadingStage.FINISHING, title: t('loading.steps.finishing'), icon: <Sparkles /> },
  ];

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-800 via-purple-900 to-slate-900 flex flex-col items-center justify-center text-white p-4 z-50">
      <h2 className="text-4xl font-extrabold text-center mb-12 animate-pulse">The magic is happening...</h2>
      <div className="space-y-8">
        {steps.map((step, index) => {
            let status: StepProps['status'] = 'pending';
            if (index < currentStageIndex) {
                status = 'completed';
            } else if (index === currentStageIndex) {
                status = 'in_progress';
            }
            
            let progressText: string | undefined;
            if (step.id === LoadingStage.ILLUSTRATING && status === 'in_progress' && progress) {
                progressText = t('loading.illustratingPage', { current: progress.current, total: progress.total });
            }

            return (
                <LoadingStep
                    key={step.id}
                    icon={step.icon}
                    title={step.title}
                    status={status}
                    progressText={progressText}
                />
            );
        })}
      </div>
    </div>
  );
};

export default LoadingScreen;
