import React, { FC } from 'react';
import { Loader2, ChevronDown } from 'lucide-react';

const Section: FC<{ 
    title: string; 
    icon: React.ReactElement<{ className?: string }>; 
    id: string; 
    isOpen: boolean; 
    onToggle: (id: string) => void; 
    children: React.ReactNode; 
    isLoading?: boolean 
}> = ({ title, icon, id, isOpen, onToggle, children, isLoading = false }) => (
    <div className="bg-white/50 rounded-2xl p-6 shadow-sm">
        <button type="button" onClick={() => onToggle(id)} className="w-full flex justify-between items-center text-xl font-bold text-slate-700">
            <div className="flex items-center gap-3">
                {isLoading 
                    ? <Loader2 className="w-6 h-6 animate-spin text-fuchsia-500" /> 
                    : React.cloneElement(icon, { className: 'w-6 h-6 text-fuchsia-500' })}
                <span>{title}</span>
            </div>
            <ChevronDown className={`w-6 h-6 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'mt-4 max-h-[1000px]' : 'max-h-0'}`}>
            {children}
        </div>
    </div>
);

export default Section;