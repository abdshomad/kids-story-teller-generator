import { GoogleGenAI, Type } from "@google/genai";
import { StoryOptions, StoryData, StoryPage, Language, LoadingStage, StoryOutline, SoundEffect } from '../types';
import { FAL_API_KEY, ELEVENLABS_API_KEY } from '../env';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const FAL_IMG_API_URL = 'https://fal.run/fal-ai/nano-banana';


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
          soundEffects: {
            type: Type.ARRAY,
            description: 'An optional array of sound effects for this page. Identify 1-2 key moments.',
            items: {
                type: Type.OBJECT,
                properties: {
                    text_trigger: {
                        type: Type.STRING,
                        description: 'The exact text phrase from the page\'s main text that should trigger this sound effect.'
                    },
                    sfx_prompt: {
                        type: Type.STRING,
                        description: 'A simple, descriptive prompt for an AI to generate the sound effect. Example: "leaves rustling", "door creaking", "happy bird chirping".'
                    }
                },
                required: ["text_trigger", "sfx_prompt"]
            }
          }
        },
        required: ["text", "imagePrompt"],
      },
    },
  },
  required: ["pages"],
};

const characterDetailsSchema = {
  type: Type.OBJECT,
  properties: {
    characterName: {
      type: Type.STRING,
      description: 'The name of the main character, if mentioned or implied. If not, suggest a creative name appropriate for a child\'s story.',
    },
    characterType: {
      type: Type.STRING,
      description: 'A short description of the main character\'s type (e.g., "a brave lion", "a curious girl", "a happy little robot"). Infer this from the prompt.',
    },
    characterPersonality: {
      type: Type.STRING,
      description: 'A short description of the main character\'s personality (e.g., "adventurous and kind", "shy but clever"). Infer this from the prompt.',
    },
  },
  required: ["characterName", "characterType", "characterPersonality"],
};

const samplePromptsSchema = {
  type: Type.OBJECT,
  properties: {
    prompts: {
      type: Type.ARRAY,
      description: 'An array of 4 creative and imaginative story prompts for children aged 3-8.',
      items: {
        type: Type.OBJECT,
        properties: {
            title: {
                type: Type.STRING,
                description: 'A very short, catchy title for the story idea (max 5 words). Example: "The Flying Squirrel".'
            },
            prompt: {
                type: Type.STRING,
                description: 'A short story prompt, about 2-3 sentences long. Example: "A brave little squirrel is tired of climbing trees. He dreams of soaring through the sky with the birds. How will he make his dream come true?"'
            }
        },
        required: ["title", "prompt"]
      },
    },
  },
  required: ["prompts"],
};


const getLanguageName = (lang: Language): string => {
    switch (lang) {
        case 'en': return 'English';
        case 'id': return 'Indonesian';
        case 'ar': return 'Arabic';
        case 'hi': return 'Hindi';
        case 'zh': return 'Chinese';
        default: return 'English';
    }
};

export const generateSamplePrompts = async (language: Language): Promise<{ title: string; prompt: string; }[]> => {
    const prompt = `
Generate 4 unique, creative, and imaginative story prompts suitable for children aged 3-8.
For each prompt, provide a very short, catchy title (max 5 words) and a longer prompt (2-3 sentences).
Examples:
- Title: "The Magical Hat", Prompt: "A curious but shy cat finds a magical hat in an old attic. When he puts it on, something amazing happens! What new adventures await?"
- Title: "The Robot's Garden", Prompt: "A happy robot loves to plant flowers for his friends. One day, he finds a mysterious seed that grows into something unexpected. What could it be?"
The prompts must be written in ${getLanguageName(language)}.
`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: samplePromptsSchema,
            },
        });
        const result = JSON.parse(response.text);
        return result.prompts || [];
    } catch (error) {
        console.error("Failed to generate sample prompts:", error);
        // Fallback to a default set of English prompts if generation fails
        return [
            { title: 'The Shy Ghost', prompt: 'A brave little ghost is secretly afraid of the dark. One night, the lights in his spooky mansion go out! How will he find his courage?' },
            { title: 'The Lost Treasure Map', prompt: 'Two excited dinosaurs discover a mysterious treasure map. It leads them through jungles and past volcanoes. What treasure will they find at the end?' },
            { title: 'The Magical Hat', prompt: 'A curious but shy cat finds a magical hat in an old attic. When he puts it on, something amazing happens! What new adventures await?' },
            { title: 'The Robot\'s Garden', prompt: 'A happy robot loves to plant flowers for his friends. One day, he finds a mysterious seed that grows into something unexpected. What could it be?' },
        ];
    }
};

// FIX: Added extractCharacterDetails function to analyze the user's prompt and suggest character details.
export const extractCharacterDetails = async (prompt: string, language: Language): Promise<{ characterName: string; characterType: string; characterPersonality: string; }> => {
    const systemInstruction = `You are an expert at analyzing story ideas and identifying key character traits. Based on the user's prompt, extract or infer the main character's name, type, and personality. Respond in ${getLanguageName(language)}. If no details are available, provide creative, age-appropriate suggestions based on the prompt.`;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: characterDetailsSchema,
            },
        });
        return JSON.parse(response.text);
    } catch (error) {
        console.error("Failed to extract character details:", error);
        // Return empty strings on failure to avoid breaking the UI
        return { characterName: '', characterType: '', characterPersonality: '' };
    }
};

// FIX: Added transcribeAudio function for speech-to-text functionality.
export const transcribeAudio = async (audio: { mimeType: string; data: string }, language: Language): Promise<string> => {
    const audioPart = {
        inlineData: {
            mimeType: audio.mimeType,
            data: audio.data,
        },
    };
    const prompt = `Transcribe the following audio. The speaker is describing a story idea for a child. The language is ${getLanguageName(language)}.`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [audioPart, { text: prompt }] },
    });

    return response.text;
};

const getPageCount = (length: 'very_short' | 'short' | 'medium' | 'long') => {
    switch(length) {
        case 'very_short': return '3';
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
            const response = await fetch(FAL_IMG_API_URL, {
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

// FIX: Added regenerateImage function to allow users to retry failed image generations.
export const regenerateImage = async (prompt: string, style: string): Promise<string | 'GENERATION_FAILED'> => {
    // The style is often already in the prompt from the full story generation, but adding it again ensures consistency.
    const fullPrompt = `${prompt}, in the style of ${style}`;
    return await generateImageWithFal(fullPrompt);
};

const generateSoundEffect = async (prompt: string): Promise<string | undefined> => {
    if (!ELEVENLABS_API_KEY) {
        console.warn("ELEVENLABS_API_KEY not found. Skipping sound effect generation.");
        return undefined;
    }
    try {
        const API_URL = `https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM`; // Rachel
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'xi-api-key': ELEVENLABS_API_KEY },
            body: JSON.stringify({
                text: `*${prompt}*`, // Wrap prompt in asterisks for SFX as per ElevenLabs docs
                model_id: 'eleven_multilingual_v2',
                 voice_settings: { stability: 0.6, similarity_boost: 0.8 },
            }),
        });
        if (!response.ok) throw new Error(`ElevenLabs SFX API error: ${response.statusText}`);
        const audioBlob = await response.blob();
        return URL.createObjectURL(audioBlob);
    } catch (error) {
        console.error(`Failed to generate sound effect with ElevenLabs for prompt: "${prompt}"`, error);
        return undefined;
    }
};

const generateAudio = async (text: string): Promise<string | undefined> => {
    if (!ELEVENLABS_API_KEY) {
        console.warn("ELEVENLABS_API_KEY not found. Skipping audio generation.");
        return undefined;
    }
    try {
        const textToSpeak = text;
        if (!textToSpeak || !textToSpeak.trim()) {
            return undefined;
        }

        const API_URL = `https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM`; // Rachel
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'xi-api-key': ELEVENLABS_API_KEY },
            body: JSON.stringify({
                text: textToSpeak,
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
You are a world-class children's storyteller and a voice director. Your task is to write a complete story in ${getLanguageName(options.language)} based on the provided synopsis.

**Story Guidelines:**
- **Target Age:** ${options.ageGroup}
- **Theme:** ${options.theme}
- **Tone:** Positive, uplifting, and kind.
- **Content Rules:** Absolutely NO violence, scary elements, or mature themes.
- **Length:** Create a story with exactly ${getPageCount(options.length)} pages (paragraphs).
- **Expressive Narration:** To make the narration more engaging, embed emotional context tags directly into the story text for the AI voice actor. These tags add reactions, emotional states, and pauses.
    - **Use tags like:** [laughs], [sigh], [excited], [nervous], [whispers], [pauses], [gasps], [sorrowful].
    - **Example of correctly formatted text:** "He looked at the giant cookie. [gasps] 'It's bigger than my head!' he shouted, [excited]."
- **Image Prompts:** For each page, create a child-friendly, G-rated image prompt. These prompts MUST be visually consistent with the selected style.
- **Sound Effects:** For each page, identify 1-2 key moments that can be enhanced with a sound effect. For each moment, provide the exact text phrase from the story that should trigger the sound, and a simple, descriptive prompt for an AI to generate the sound (e.g., "leaves rustling", "door creaking", "happy bird chirping").

**Story Synopsis:**
${synopsis}

**Main Character:**
${characterDescription || options.prompt}

**Selected Visual Style (for image prompts):**
${selectedCoverPrompt}

Please generate the complete story now.
`;
    // FIX: Completed the Gemini API call and added the subsequent logic to process the story, generate images, and generate audio.
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: fullStoryPrompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: storySchema,
        },
    });

    let parsedStory: { pages: StoryPage[] };
    try {
        parsedStory = JSON.parse(response.text);
    } catch (e) {
        console.error("Failed to parse story JSON from Gemini:", e);
        throw new Error(t('error.generic'));
    }

    const pages: StoryPage[] = parsedStory.pages || [];
    const totalPages = pages.length;

    const storyData: StoryData = {
        title: '', // Title is added back in App.tsx
        pages: pages.map(p => ({ ...p, imageUrl: undefined, audioUrl: undefined })),
        options,
    };

    onUpdate({ stage: LoadingStage.DESIGNING_CHARACTERS, storyData });
    await delay(1000);

    onUpdate({ stage: LoadingStage.PAINTING_SCENES, storyData, progress: { current: 0, total: totalPages } });

    // Generate images in parallel
    const imagePromises = pages.map((page, index) =>
        generateImageWithFal(`${page.imagePrompt}, ${options.illustrationStyle}`).then(imageUrl => {
            storyData.pages[index].imageUrl = imageUrl;
            // Create a new object for the update to ensure React state changes are detected
            onUpdate({
                stage: LoadingStage.PAINTING_SCENES,
                storyData: { ...storyData, pages: [...storyData.pages] },
                progress: { current: index + 1, total: totalPages }
            });
            return imageUrl;
        })
    );
    await Promise.all(imagePromises);
    
    onUpdate({ stage: LoadingStage.ASSEMBLING_BOOK, storyData, progress: { current: totalPages, total: totalPages } });
    await delay(1000);

    onUpdate({ stage: LoadingStage.FINAL_TOUCHES, storyData, progress: { current: 0, total: totalPages } });

    // Generate audio and SFX sequentially per page to avoid rate-limiting and show progress
    for (let i = 0; i < totalPages; i++) {
        const page = storyData.pages[i];
        
        const narrationPromise = generateAudio(page.text);
        
        const sfxPromises = page.soundEffects?.map(sfx =>
            generateSoundEffect(sfx.sfx_prompt).then(audioUrl => {
                sfx.audioUrl = audioUrl;
                return sfx;
            })
        ) || [];

        const [narrationUrl] = await Promise.all([narrationPromise, ...sfxPromises]);
        
        storyData.pages[i].audioUrl = narrationUrl;

        onUpdate({
            stage: LoadingStage.FINAL_TOUCHES,
            storyData: { ...storyData, pages: [...storyData.pages] },
            progress: { current: i + 1, total: totalPages },
        });
    }

    return storyData;
};