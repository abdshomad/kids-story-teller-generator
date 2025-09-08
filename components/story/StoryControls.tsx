import React, { FC } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

interface StoryControlsProps {
    onPrev: () => void;
    onNext: () => void;
    isTitlePage: boolean;
    currentPage: number;
    totalPages: number;
}

const StoryControls: FC<StoryControlsProps> = ({ onPrev, onNext, isTitlePage, currentPage, totalPages }) => {
    return (
        <>
            <button onClick={onPrev} disabled={isTitlePage} className="absolute start-0 sm:start-4 lg:start-8 top-1/2 -translate-y-1/2 p-3 bg-white/50 rounded-full text-slate-800 hover:bg-white disabled:opacity-0 disabled:cursor-not-allowed transition-all">
                <ArrowLeft className="w-8 h-8"/>
            </button>
            <button onClick={onNext} disabled={currentPage === totalPages - 1} className="absolute end-0 sm:end-4 lg:end-8 top-1/2 -translate-y-1/2 p-3 bg-white/50 rounded-full text-slate-800 hover:bg-white disabled:opacity-0 disabled:cursor-not-allowed transition-all">
                <ArrowRight className="w-8 h-8"/>
            </button>
        </>
    );
};

export default StoryControls;
