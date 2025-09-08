import React from 'react';
import { BookText, Images, Sparkles, Edit, CheckCircle2, Loader2, Circle } from 'lucide-react';
import { LoadingStage } from '../../types';

export const outlineStepsConfig = (t: (key: string) => string) => [
  {
    id: 'drafting',
    title: t('loading.main.drafting'),
    // FIX: Replaced JSX syntax with React.createElement to resolve parsing errors in a .ts file.
    icon: React.createElement(Edit, { className: 'w-8 h-8' }),
    substeps: [
      { id: LoadingStage.DRAFTING_IDEAS, title: t('loading.sub.draftingIdeas') },
      { id: LoadingStage.SKETCHING_COVERS, title: t('loading.sub.sketchingCovers') },
    ]
  }
];

export const fullStepsConfig = (t: (key: string) => string) => [
  {
    id: 'writing',
    title: t('loading.main.writing'),
    // FIX: Replaced JSX syntax with React.createElement to resolve parsing errors in a .ts file.
    icon: React.createElement(BookText, { className: 'w-8 h-8' }),
    substeps: [
      { id: LoadingStage.ANALYZING_PROMPT, title: t('loading.sub.analyzing') },
      { id: LoadingStage.WRITING_PAGES, title: t('loading.sub.writingPages') },
    ]
  },
  {
    id: 'illustrating',
    title: t('loading.main.illustrating'),
    // FIX: Replaced JSX syntax with React.createElement to resolve parsing errors in a .ts file.
    icon: React.createElement(Images, { className: 'w-8 h-8' }),
    substeps: [
      { id: LoadingStage.DESIGNING_CHARACTERS, title: t('loading.sub.designingCharacters') },
      { id: LoadingStage.PAINTING_SCENES, title: t('loading.sub.paintingScenes') },
    ]
  },
  {
    id: 'finalizing',
    title: t('loading.main.finalizing'),
    // FIX: Replaced JSX syntax with React.createElement to resolve parsing errors in a .ts file.
    icon: React.createElement(Sparkles, { className: 'w-8 h-8' }),
    substeps: [
      { id: LoadingStage.ASSEMBLING_BOOK, title: t('loading.sub.assembling') },
      { id: LoadingStage.FINAL_TOUCHES, title: t('loading.sub.finalTouches') },
    ]
  }
];

export const statusConfig = {
    // FIX: Replaced JSX syntax with React.createElement to resolve parsing errors in a .ts file.
    completed: { icon: React.createElement(CheckCircle2, { className: "w-6 h-6 text-green-500" }), textClass: 'text-green-600/80 line-through' },
    // FIX: Replaced JSX syntax with React.createElement to resolve parsing errors in a .ts file.
    in_progress: { icon: React.createElement(Loader2, { className: "w-6 h-6 text-purple-500 animate-spin" }), textClass: 'text-purple-600 font-bold' },
    // FIX: Replaced JSX syntax with React.createElement to resolve parsing errors in a .ts file.
    pending: { icon: React.createElement(Circle, { className: "w-6 h-6 text-slate-400" }), textClass: 'text-slate-500' },
};
