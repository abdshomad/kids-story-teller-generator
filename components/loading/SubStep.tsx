
import React from 'react';
import { statusConfig } from './loadingScreenConfig';

interface SubStepProps {
  title: string;
  status: 'completed' | 'in_progress' | 'pending';
  progressText?: string;
}

const SubStep: React.FC<SubStepProps> = ({ title, status, progressText }) => {
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

export default SubStep;
