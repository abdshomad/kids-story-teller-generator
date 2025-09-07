
export type Language = 'en' | 'id';

export interface StoryOptions {
  prompt: string;
  ageGroup: string;
  theme: string;
  length: 'short' | 'medium' | 'long';
  illustrationStyle: string;
  characterName: string;
  characterType: string;
  characterPersonality: string;
  visualInspiration?: {
    mimeType: string;
    data: string; // base64
  };
}

export interface StoryPage {
  text: string;
  imagePrompt: string;
  imageUrl?: string | 'GENERATION_FAILED';
}

export interface StoryData {
  title: string;
  pages: StoryPage[];
}

export enum AppStatus {
  WELCOME = 'welcome',
  INPUT = 'input',
  LOADING = 'loading',
  STORY = 'story',
  ERROR = 'error'
}

export enum LoadingStage {
  WRITING = 'writing',
  ILLUSTRATING = 'illustrating',
  FINISHING = 'finishing'
}

export type AppState =
  | { status: AppStatus.WELCOME }
  | { status: AppStatus.INPUT }
  | { status: AppStatus.LOADING, stage: LoadingStage, progress?: { current: number, total: number } }
  | { status: AppStatus.STORY, storyData: StoryData }
  | { status: AppStatus.ERROR, message: string };
