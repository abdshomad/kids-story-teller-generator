import React, { FC } from 'react';
import { useAppContext } from '../../App';
import { Volume2, VolumeX } from 'lucide-react';

interface StoryHeaderProps {
    title: string;
    onNewStory: () => void;
    onReadAloud: () => void;
    isSpeaking: boolean;
    isSupported: boolean;
}

const StoryHeader: FC<StoryHeaderProps> = ({ title, onNewStory, onReadAloud, isSpeaking, isSupported }) => {
    const { t } = useAppContext();

    return (
        <div className="flex justify-between items-center mb-4 text-white flex-shrink-0">
            <h1 className="text-xl font-bold truncate">{title}</h1>
            <div className="flex items-center gap-4">
                {isSupported && (
                    <button onClick={onReadAloud} title={t('story.readAloud')} className="p-2 rounded-full hover:bg-slate-700 transition-colors">
                        {isSpeaking ? <Volume2 className="w-6 h-6 text-yellow-400" /> : <VolumeX className="w-6 h-6" />}
                    </button>
                )}
                <button onClick={onNewStory} className="px-4 py-2 bg-blue-500 font-bold rounded-full hover:bg-blue-600 transition-colors">
                    {t('story.newStory')}
                </button>
            </div>
        </div>
    );
};

export default StoryHeader;
