import { GoogleGenAI, Type } from "@google/genai";
import { StoryOptions, StoryData, StoryPage, Language, LoadingStage, StoryOutline } from '../types';
import { FAL_API_KEY, ELEVENLABS_API_KEY } from '../env';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const FAL_API_URL = 'https://fal.run/fal-ai/nano-banana';

const storyOutlineSchema = {
  type: Type.OBJECT,
  properties: {
    title: {
      type: Type.STRING,
      description: 'A creative and engaging title for the story, based on the user\'s idea.',
    },
    synopsis: {
      type: Type.STRING,
      description: 'A short, one-paragraph synopsis of the story. It should be exciting and give a taste of the adventure to come.'
    },
  },
  required: ["title", "synopsis"],
};

const storySchema = {
  type: Type.OBJECT,
  properties: {
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
  required: ["pages"],
};

const getLanguageName = (lang: Language): string => {
    switch (lang) {
        case 'en': return 'English';
        case 'id': return 'Indonesian';
        case 'ar': return 'Arabic';
        case 'hi': return 'Hindi';
        case 'es': return 'Spanish';
        case 'fr': return 'French';
        case 'de': return 'German';
        case 'ja': return 'Japanese';
        case 'zh': return 'Chinese';
        case 'jv': return 'Javanese';
        case 'su': return 'Sundanese';
        case 'pt': return 'Portuguese';
        case 'ru': return 'Russian';
        case 'it': return 'Italian';
        case 'ko': return 'Korean';
        case 'tr': return 'Turkish';
        case 'nl': return 'Dutch';
        case 'pl': return 'Polish';
        default: return 'English';
    }
};

const getPageCount = (length: 'short' | 'medium' | 'long') => {
    switch(length) {
        case 'short': return '7';
        case 'medium': return '19';
        case 'long': return '25';
    }
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const generateImageWithFal = async (prompt: string): Promise<string | 'GENERATION_FAILED'> => {
    if (!FAL_API_KEY) {
      console.warn("FAL_API_KEY not found. Skipping image generation.");
      return 'GENERATION_FAILED';
    }
    
    let retries = 3;
    let attemptDelay = 2000;

    while (retries > 0) {
        try {
            const response = await fetch(FAL_API_URL, {
                method: 'POST',
                headers: { 'Authorization': `Key ${FAL_API_KEY}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt }),
            });

            if (!response.ok) throw new Error(`FAL API error: ${response.status}`);
            
            const result = await response.json();
            if (!result.images?.[0]?.url) throw new Error('FAL API did not return a valid image URL.');
            
            const imageResponse = await fetch(result.images[0].url);
            if (!imageResponse.ok) throw new Error(`Failed to download image from FAL URL: ${imageResponse.statusText}`);
            
            const blob = await imageResponse.blob();
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });

        } catch (error) {
            console.error(`Failed to generate image.`, error);
            retries--;
            if (retries > 0) await delay(attemptDelay); else return 'GENERATION_FAILED';
        }
    }
    return 'GENERATION_FAILED';
};

const generateAudio = async (text: string): Promise<string | undefined> => {
    if (!ELEVENLABS_API_KEY) {
        console.warn("ELEVENLABS_API_KEY not found. Skipping audio generation.");
        return undefined;
    }
    try {
        const API_URL = `https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM`; // Rachel
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'xi-api-key': ELEVENLABS_API_KEY },
            body: JSON.stringify({
                text,
                model_id: 'eleven_multilingual_v2',
                voice_settings: { stability: 0.5, similarity_boost: 0.75 },
            }),
        });
        if (!response.ok) throw new Error(`ElevenLabs API error: ${response.status}`);
        const audioBlob = await response.blob();
        return URL.createObjectURL(audioBlob);
    } catch (error) {
        console.error('Text-to-speech generation error:', error);
        return undefined;
    }
};

interface OutlineUpdate { stage: LoadingStage.DRAFTING_IDEAS | LoadingStage.SKETCHING_COVERS; }
export const generateStoryOutline = async (options: StoryOptions, onUpdate: (update: OutlineUpdate) => void): Promise<StoryOutline> => {
    onUpdate({ stage: LoadingStage.DRAFTING_IDEAS });
    
    const characterDescription = [options.characterName, options.characterType, options.characterPersonality].filter(Boolean).join(', ');
    const outlinePrompt = `
You are a creative author for children. Based on the user's idea, generate a creative title and a short, one-paragraph synopsis for a story.
The entire response, including the values for title and synopsis, must be written in ${getLanguageName(options.language)}.
The synopsis should be exciting and give a taste of the adventure to come. Be strictly G-rated, positive, and safe for all ages.

Story Idea: "${options.prompt}"
${characterDescription ? `Main Character: ${characterDescription}` : ''}
`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: outlinePrompt,
        config: { responseMimeType: "application/json", responseSchema: storyOutlineSchema }
    });
    
    const { title, synopsis } = JSON.parse(response.text);

    onUpdate({ stage: LoadingStage.SKETCHING_COVERS });
    
    const basePrompt = `Cover for a children's book titled "${title}". The story is about: ${synopsis}. Main character: ${characterDescription || options.prompt}.`;
    const coverPrompts = [
        { prompt: `${basePrompt} Style: Vibrant and colorful, happy cartoon.` },
        { prompt: `${basePrompt} Style: Soft and dreamy, beautiful watercolor.` },
        { prompt: `${basePrompt} Style: Epic and magical, detailed fantasy art.` }
    ];

    const coverImagePromises = coverPrompts.map(p => generateImageWithFal(p.prompt));
    const coverImageUrls = await Promise.all(coverImagePromises);

    return {
        title,
        synopsis,
        coverImageOptions: coverImageUrls.map((imageUrl, i) => ({ prompt: coverPrompts[i].prompt, imageUrl })),
        originalOptions: options
    };
};


interface FullStoryUpdate {
    stage: LoadingStage;
    storyData?: StoryData;
    progress?: { current: number; total: number };
}

export const generateFullStoryFromSelection = async (
  options: StoryOptions, 
  selectedCoverPrompt: string,
  synopsis: string,
  t: (key: string, params?: Record<string, string | number>) => string,
  onUpdate: (update: FullStoryUpdate) => void
): Promise<StoryData> => {
    
  onUpdate({ stage: LoadingStage.ANALYZING_PROMPT });
  await delay(1000);
  
  onUpdate({ stage: LoadingStage.WRITING_PAGES });

  const characterDescription = [options.characterName, options.characterType, options.characterPersonality].filter(Boolean).join(', ');
  const fullStoryPrompt = `
You are a world-class children's storyteller. Your task is to write a complete story in ${getLanguageName(options.language)} based on the provided synopsis.

**Story Guidelines:**
- **Target Age:** ${options.ageGroup}
- **Theme:** ${options.theme}
- **Tone:** Positive, uplifting, and kind.
- **Content Rules:** Absolutely NO violence, scary elements, or mature themes.
- **Length:** Create a story with exactly ${getPageCount(options.length)} pages (paragraphs).
- **Image Prompts:** For each page, create a child-friendly, G-rated image prompt. These prompts MUST be visually consistent with the selected style.

**Story Synopsis:**
${synopsis}

**Main Character:**
${characterDescription || options.prompt}

**Selected Visual Style (for image prompts):**
${selectedCoverPrompt}

Please generate the complete story now.
`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [{text: fullStoryPrompt}] },
        config: { responseMimeType: "application/json", responseSchema: storySchema }
    });
    const storyContent: { pages: Omit<StoryPage, 'imageUrl' | 'audioUrl'>[] } = JSON.parse(response.text.trim());

    if (!storyContent?.pages?.length) throw new Error("AI failed to generate a valid story structure.");
    
    const tempStoryData: StoryData = { title: '', pages: storyContent.pages.map(p => ({ ...p })), options };
    onUpdate({ stage: LoadingStage.DESIGNING_CHARACTERS, storyData: tempStoryData });
    await delay(1500);

    const totalPages = tempStoryData.pages.length;
    onUpdate({ stage: LoadingStage.PAINTING_SCENES, storyData: tempStoryData, progress: { current: 1, total: totalPages } });

    for (let i = 0; i < totalPages; i++) {
        const page = tempStoryData.pages[i];
        const [imageUrl, audioUrl] = await Promise.all([
            generateImageWithFal(`${page.imagePrompt}, in a beautiful ${options.illustrationStyle} style, G-rated, for a children's book`),
            generateAudio(page.text)
        ]);
        page.imageUrl = imageUrl;
        page.audioUrl = audioUrl;

        onUpdate({ 
            stage: LoadingStage.PAINTING_SCENES, 
            storyData: { ...tempStoryData, pages: [...tempStoryData.pages] },
            progress: { current: i + 1, total: totalPages }
        });
        if (i < totalPages - 1) await delay(1000);
    }
  
    onUpdate({ stage: LoadingStage.ASSEMBLING_BOOK, storyData: tempStoryData });
    await delay(1000);
  
    for (let i = 0; i < totalPages; i++) {
        onUpdate({ stage: LoadingStage.FINAL_TOUCHES, storyData: tempStoryData, progress: { current: i + 1, total: totalPages }});
        await delay(100);
    }

    return tempStoryData;
};

export const transcribeAudio = async (audio: { mimeType: string, data: string }, language: Language): Promise<string> => {
  const langName = getLanguageName(language);
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: { parts: [
        { text: `Transcribe the following audio recording precisely. The language is ${langName}.` },
        { inlineData: { mimeType: audio.mimeType, data: audio.data } },
    ]},
  });
  return response.text?.trim() ?? "";
};

export const regenerateImage = async (imagePrompt: string, illustrationStyle: string): Promise<string | 'GENERATION_FAILED'> => {
    return generateImageWithFal(`${imagePrompt}, in a beautiful ${illustrationStyle} style, G-rated, for a children's book`);
};