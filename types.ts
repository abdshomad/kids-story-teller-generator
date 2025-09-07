
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
  imageUrl?: string;
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

export type AppState =
  | { status: AppStatus.WELCOME }
  | { status: AppStatus.INPUT }
  | { status: AppStatus.LOADING, progressMessage: string }
  | { status: AppStatus.STORY, storyData: StoryData }
  | { status: AppStatus.ERROR, message: string };

