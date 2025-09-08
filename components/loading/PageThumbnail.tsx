import React from 'react';
import { StoryPage } from '../../types';
import { Loader2, ImageOff } from 'lucide-react';

interface PageThumbnailProps {
  page: StoryPage;
  pageNumber: number;
}

const PageThumbnail: React.FC<PageThumbnailProps> = ({ page, pageNumber }) => (
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
        {/* FIX: Mapped over page.text parts and joined them to render as a string, resolving the ReactNode type error. */}
        <p className="text-xs text-slate-600 h-12 overflow-hidden">{page.text.map(p => p.content).join(' ')}</p>
        <p className="text-xs text-slate-400 italic mt-1 truncate group-hover:whitespace-normal group-hover:text-slate-500 transition">
            &ldquo;{page.imagePrompt}&rdquo;
        </p>
    </div>
);

export default PageThumbnail;