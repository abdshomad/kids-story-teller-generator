import { GoogleGenAI, Type } from "@google/genai";
import { StoryOptions, StoryData, StoryPage, Language } from '../types';

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


export const generateStoryAndImages = async (
  options: StoryOptions, 
  t: (key: string, params?: Record<string, string | number>) => string,
  onTextComplete: (story: StoryData) => void,
  onPageIllustrated: (page: StoryPage, index: number) => void
): Promise<void> => {
    
  // 1. Generate story text
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
  
  const initialStoryData: StoryData = {
    title: storyContent.title,
    pages: storyContent.pages.map(page => ({ ...page, imageUrl: undefined })),
  };

  onTextComplete(initialStoryData);

  // 2. Generate images for each page.
  if (!process.env.FAL_API_KEY) {
    console.warn("FAL_API_KEY environment variable not set. Skipping image generation.");
    for (let i = 0; i < initialStoryData.pages.length; i++) {
        onPageIllustrated({ ...initialStoryData.pages[i], imageUrl: 'GENERATION_FAILED' }, i);
    }
    return;
  }

  for (let i = 0; i < initialStoryData.pages.length; i++) {
    const page = initialStoryData.pages[i];
    
    let success = false;
    let retries = 3;
    let attemptDelay = 2000; // Start with 2 seconds for retry attempts

    while (!success && retries > 0) {
        try {
            const falResponse = await fetch(FAL_API_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Key ${process.env.FAL_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    prompt: `${page.imagePrompt}, in a beautiful ${options.illustrationStyle} style, G-rated, for a children's book`,
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
            const imageUrl = await blobToBase64(imageBlob);
            
            onPageIllustrated({ ...page, imageUrl }, i);
            success = true;

        } catch (imageError) {
            console.error(`Failed to generate image for page ${i + 1}:`, imageError);
            
            const errorMessage = imageError instanceof Error ? imageError.message : String(imageError);
            const isRateLimitError = errorMessage.includes('429') || errorMessage.toUpperCase().includes('RESOURCE_EXHAUSTED');

            if (isRateLimitError && retries > 0) {
                retries--;
                console.warn(`Rate limit hit for page ${i + 1}. Retrying in ${attemptDelay / 1000}s... (${retries} retries left)`);
                await delay(attemptDelay);
                attemptDelay *= 2; // Exponential backoff
            } else {
                console.error(`Could not generate image for page ${i + 1}. Skipping.`);
                onPageIllustrated({ ...page, imageUrl: 'GENERATION_FAILED' }, i);
                success = true; // Mark as "handled" to exit the while loop
            }
        }
    }

    // Proactively add a delay between requests to avoid hitting rate limits.
    if (i < initialStoryData.pages.length - 1) {
      await delay(1000); // 1-second delay between each page's image generation request
    }
  }
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
