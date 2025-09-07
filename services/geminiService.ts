

import { GoogleGenAI, Type } from "@google/genai";
import { StoryOptions, StoryData, StoryPage, Language, LoadingStage } from '../types';
import { FAL_API_KEY } from '../env';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// FAL.ai configuration
const FAL_API_URL = 'https://fal.run/fal-ai/nano-banana';

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
        case 'short': return '7';
        case 'medium': return '19';
        case 'long': return '25';
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

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};

const generateImageWithFal = async (prompt: string, style: string): Promise<string> => {
    let retries = 3;
    let attemptDelay = 2000;

    while (retries > 0) {
        try {
            const falResponse = await fetch(FAL_API_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Key ${FAL_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    prompt: `${prompt}, in a beautiful ${style} style, G-rated, for a children's book`,
                })
            });

            if (!falResponse.ok) {
                const errorBody = await falResponse.text();
                throw new Error(`FAL API error: ${falResponse.status} ${falResponse.statusText} - ${errorBody}`);
            }

            const falResult = await falResponse.json();
            
            if (!falResult.images || falResult.images.length === 0 || !falResult.images[0].url) {
                throw new Error('FAL API did not return a valid image URL.');
            }
            
            const imageUrlFromFal = falResult.images[0].url;

            const imageDownloadResponse = await fetch(imageUrlFromFal);
            if (!imageDownloadResponse.ok) {
                throw new Error(`Failed to download image from FAL URL: ${imageDownloadResponse.statusText}`);
            }

            const imageBlob = await imageDownloadResponse.blob();
            return await blobToBase64(imageBlob);

        } catch (imageError) {
            console.error(`Failed to generate image.`, imageError);
            retries--;

            const errorMessage = imageError instanceof Error ? imageError.message : String(imageError);
            const isRateLimitError = errorMessage.includes('429') || errorMessage.toUpperCase().includes('RESOURCE_EXHAUSTED');

            if (isRateLimitError && retries > 0) {
                console.warn(`Rate limit hit. Retrying in ${attemptDelay / 1000}s... (${retries} retries left)`);
                await delay(attemptDelay);
                attemptDelay *= 2;
            } else if (retries === 0) {
                console.error(`Could not generate image after multiple retries. Failing.`);
                return 'GENERATION_FAILED';
            }
        }
    }
    return 'GENERATION_FAILED';
};


interface LoadingUpdate {
    stage: LoadingStage;
    storyData?: StoryData;
    progress?: { current: number; total: number };
}

export const generateStoryAndImages = async (
  options: StoryOptions, 
  t: (key: string, params?: Record<string, string | number>) => string,
  onUpdate: (update: LoadingUpdate) => void
): Promise<StoryData> => {
    
  // 1. Analyze
  onUpdate({ stage: LoadingStage.ANALYZING_PROMPT });
  await delay(1500);
  
  // 2. Write Text
  onUpdate({ stage: LoadingStage.WRITING_PAGES });

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
  
  const storyData: StoryData = {
    title: storyContent.title,
    pages: storyContent.pages.map(page => ({ ...page, imageUrl: undefined })),
  };

  // 3. Design Characters (transition step, provides text data to UI)
  onUpdate({ stage: LoadingStage.DESIGNING_CHARACTERS, storyData });
  await delay(1500);

  // 4. Generate Images
  if (!FAL_API_KEY) {
      console.warn("FAL_API_KEY not found. Skipping image generation.");
      storyData.pages.forEach(p => p.imageUrl = 'GENERATION_FAILED');
  } else {
      const totalPages = storyData.pages.length;
      onUpdate({ stage: LoadingStage.PAINTING_SCENES, storyData, progress: { current: 1, total: totalPages } });

      for (let i = 0; i < totalPages; i++) {
          const imageUrl = await generateImageWithFal(storyData.pages[i].imagePrompt, options.illustrationStyle);
          storyData.pages[i].imageUrl = imageUrl;
          
          onUpdate({ 
              stage: LoadingStage.PAINTING_SCENES, 
              storyData: { ...storyData, pages: [...storyData.pages] }, // Create new object to trigger re-render
              progress: { current: i + 1, total: totalPages }
          });
          
          if (i < totalPages - 1) {
            await delay(1000); // Proactive delay between image requests
          }
      }
  }
  
  // 5. Assemble
  onUpdate({ stage: LoadingStage.ASSEMBLING_BOOK, storyData });
  await delay(1000);
  
  // 6. Final Touches
  const totalPages = storyData.pages.length;
  for (let i = 0; i < totalPages; i++) {
    onUpdate({
        stage: LoadingStage.FINAL_TOUCHES,
        storyData,
        progress: { current: i + 1, total: totalPages }
    });
    await delay(100); // Short delay per page for visual effect
  }

  return storyData;
};

export const transcribeAudio = async (audio: { mimeType: string, data: string }, language: Language): Promise<string> => {
  const langName = language === 'id' ? 'Indonesian' : 'English';
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: {
      parts: [
        { text: `Transcribe the following audio recording precisely. The language is ${langName}.` },
        {
          inlineData: {
            mimeType: audio.mimeType,
            data: audio.data,
          },
        },
      ],
    },
  });
  
  if (!response.text) {
    console.warn("Gemini audio transcription returned no text.");
    return "";
  }
  return response.text.trim();
};