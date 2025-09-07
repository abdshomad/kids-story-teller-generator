

export type Language = 'en' | 'id' | 'ar' | 'hi' | 'es' | 'fr' | 'de' | 'ja' | 'zh' | 'jv' | 'su' | 'pt' | 'ru' | 'it' | 'ko' | 'tr' | 'nl' | 'pl';

export interface StoryOptions {
  prompt: string;
  ageGroup: string;
  theme: string;
  length: 'very_short' | 'short' | 'medium' | 'long';
  illustrationStyle: string;
  characterName: string;
  characterType: string;
  characterPersonality: string;
  language: Language;
  visualInspiration?: {
    mimeType: string;
    data: string; // base64
  };
}

export interface SoundEffect {
  text_trigger: string;
  sfx_prompt: string;
  audioUrl?: string;
}

export interface StoryPage {
  text: string;
  imagePrompt: string;
  imageUrl?: string | 'GENERATION_FAILED';
  audioUrl?: string;
  soundEffects?: SoundEffect[];
}

export interface StoryData {
  title: string;
  pages: StoryPage[];
  options: StoryOptions;
}

export interface StoryOutline {
  title: string;
  synopsis: string;
  coverImageOptions: {
    prompt: string;
    imageUrl: string | 'GENERATION_FAILED';
  }[];
  originalOptions: StoryOptions;
}

export enum AppStatus {
  WELCOME = 'welcome',
  INPUT = 'input',
  LOADING = 'loading',
  STYLE_SELECTION = 'style_selection',
  STORY = 'story',
  ERROR = 'error'
}

export enum LoadingStage {
  // --- Phase 1: Outline ---
  DRAFTING_IDEAS = 'drafting_ideas',
  SKETCHING_COVERS = 'sketching_covers',

  // --- Phase 2: Full Story ---
  ANALYZING_PROMPT = 'analyzing_prompt',
  WRITING_PAGES = 'writing_pages',
  DESIGNING_CHARACTERS = 'designing_characters',
  PAINTING_SCENES = 'painting_scenes',
  ASSEMBLING_BOOK = 'assembling_book',
  FINAL_TOUCHES = 'final_touches',
}

export type AppState =
  | { status: AppStatus.WELCOME }
  | { status: AppStatus.INPUT }
  | { status: AppStatus.LOADING, stage: LoadingStage, phase: 'outline' | 'full', progress?: { current: number, total: number }, storyData?: StoryData }
  | { status: AppStatus.STYLE_SELECTION, outlineData: StoryOutline }
  | { status: AppStatus.STORY, storyData: StoryData }
  | { status: AppStatus.ERROR, message: string };