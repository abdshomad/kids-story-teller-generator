
import { GoogleGenAI, Type } from "@google/genai";
import { StoryOptions, StoryData, StoryPage } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const storySchema = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: 'A creative and engaging title for the story.',
    },
    pages: {
      type: Type.ARRAY,
      description: 'An array of pages, each containing a paragraph of the story and a prompt for an illustration.',
      items: {
        type: Type.OBJECT,
        properties: {
          text: {
            type: Type.STRING,
            description: 'One paragraph of the story. It should be engaging and appropriate for the specified age group.',
          },
          imagePrompt: {
            type: Type.STRING,
            description: 'A simple, descriptive prompt for generating an illustration that matches this part of the story. The prompt should be G-rated, child-friendly, and focus on characters and actions. Example: "A brave little squirrel wearing a tiny red cape, looking up at a tall oak tree, cartoon style."'
          },
        },
        required: ["text", "imagePrompt"],
      },
    },
  },
  required: ["title", "pages"],
};

const getPageCount = (length: 'short' | 'medium' | 'long') => {
    switch(length) {
        case 'short': return '3 to 4';
        case 'medium': return '5 to 6';
        case 'long': return '7 to 8';
    }
}

const buildStoryPrompt = (options: StoryOptions) => {
  const parts = [];

  const characterDescription = [options.characterName, options.characterType, options.characterPersonality]
    .filter(Boolean)
    .join(', ');

  const promptText = `
You are a world-class children's storyteller. Your task is to create a magical, positive, and strictly G-rated story.

**Story Guidelines:**
- **Target Age:** ${options.ageGroup}
- **Theme:** ${options.theme}
- **Tone:** Positive, uplifting, and kind.
- **Content Rules:** Absolutely NO violence, scary elements, complex emotional distress, or any mature themes. Ensure the story is inclusive and diverse.
- **Length:** Create a story with ${getPageCount(options.length)} pages (paragraphs).

**Story Idea:**
${options.prompt}

${characterDescription ? `**Main Character:**\n${characterDescription}` : ''}

Please generate the complete story based on these instructions.
`;
  parts.push({ text: promptText });

  if (options.visualInspiration) {
    parts.push({
      inlineData: {
        mimeType: options.visualInspiration.mimeType,
        data: options.visualInspiration.data,
      },
    });
    parts.push({ text: "\nUse the provided image as the primary visual inspiration for the main character's appearance." });
  }

  return parts;
};

export const generateStoryAndImages = async (
  options: StoryOptions, 
  onProgress: (message: string) => void,
  t: (key: string, params?: Record<string, string | number>) => string
): Promise<StoryData> => {
    
  onProgress(t('loading.dreaming'));
  
  const storyPromptParts = buildStoryPrompt(options);

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: { parts: storyPromptParts },
    config: {
        responseMimeType: "application/json",
        responseSchema: storySchema,
    }
  });

  const storyJsonText = response.text.trim();
  const storyContent: Omit<StoryData, 'pages'> & { pages: Omit<StoryPage, 'imageUrl'>[] } = JSON.parse(storyJsonText);

  if (!storyContent || !storyContent.pages || storyContent.pages.length === 0) {
    throw new Error("AI failed to generate a valid story structure.");
  }
  
  onProgress(t('loading.painting'));

  const illustratedPages: StoryPage[] = [];
  const totalPages = storyContent.pages.length;

  for (let i = 0; i < totalPages; i++) {
    const page = storyContent.pages[i];
    onProgress(t('loading.illustratingPage', { currentPage: i + 1, totalPages }));
    
    try {
      const imageResponse = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: `${page.imagePrompt}, in a beautiful ${options.illustrationStyle} style, G-rated, for a children's book`,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/jpeg',
          aspectRatio: '1:1',
        },
      });

      const base64ImageBytes = imageResponse.generatedImages[0].image.imageBytes;
      const imageUrl = `data:image/jpeg;base64,${base64ImageBytes}`;
      illustratedPages.push({ ...page, imageUrl });

    } catch (imageError) {
      console.error(`Failed to generate image for page ${i + 1}:`, imageError);
      // Push page without image URL so the story can still be viewed
      illustratedPages.push({ ...page, imageUrl: undefined });
    }
  }

  onProgress(t('loading.finishing'));
  return {
    title: storyContent.title,
    pages: illustratedPages,
  };
};
