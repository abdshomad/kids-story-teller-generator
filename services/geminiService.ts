import { GoogleGenAI } from "@google/genai";
import { StoryOptions, StoryData, StoryPage, Language, LoadingStage, StoryOutline, Character } from '../types';
import { generateImageWithFal, generateAudio, generateSoundEffect, delay } from './apiService';
import { 
    storyOutlineSchema, 
    storySchema, 
    charactersSchema, 
    samplePromptsSchema,
    getLanguageName,
    buildOutlinePrompt,
    buildFullStoryPrompt
} from './promptService';


if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });


export const generateSamplePrompts = async (language: Language, existingPrompts: { title: string; prompt: string; }[] = []): Promise<{ title: string; prompt: string; }[]> => {
    const existingPromptsText = existingPrompts.length > 0
        ? `To ensure variety, please do not generate prompts that are similar in theme or content to the following existing prompts:\n${existingPrompts.map(p => `- "${p.title}: ${p.prompt}"`).join('\n')}`
        : '';
    
    const prompt = `
Generate 4 unique, creative, and imaginative story prompts suitable for children aged 3-8.
The prompts should be very different from each other. For instance, if one is about a magical animal, another could be about a child's everyday adventure, another about a friendly robot, and another about exploring nature. Be surprising and avoid clichés.

For each prompt, provide a very short, catchy title (max 5 words) and a longer prompt (2-3 sentences).
Examples of the desired format (do not copy these ideas):
- Title: "The Magical Hat", Prompt: "A curious but shy cat finds a magical hat in an old attic. When he puts it on, something amazing happens! What new adventures await?"
- Title: "The Robot's Garden", Prompt: "A happy robot loves to plant flowers for his friends. One day, he finds a mysterious seed that grows into something unexpected. What could it be?"

${existingPromptsText}

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

export const extractAndGenerateCharacters = async (prompt: string, language: Language): Promise<(Partial<Character> & { previewUrl?: string })[]> => {
    const systemInstruction = `You are an expert at analyzing children's story ideas. Your task is to identify all main characters from the user's prompt.
For each character, provide their name, type, a brief personality description, and a simple, visually descriptive prompt for an image generation model to create a 150x150 pixel character icon.
If no characters are explicitly mentioned, do not invent any. Respond in ${getLanguageName(language)}.`;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: charactersSchema,
            },
        });
        
        const result = JSON.parse(response.text);
        const charactersToGenerate: { name: string; type: string; personality: string; imagePrompt: string; }[] = result.characters || [];

        if (charactersToGenerate.length === 0) {
            return [];
        }

        // Generate images for each character in parallel
        const characterPromises = charactersToGenerate.map(async (char) => {
            const imageUrl = await generateImageWithFal(char.imagePrompt);
            let visualInspiration: Character['visualInspiration'] | undefined = undefined;

            if (imageUrl !== 'GENERATION_FAILED') {
                try {
                    // Convert data URL back to the required format
                    const [mimePart, base64Part] = imageUrl.split(',');
                    const mimeType = mimePart.split(':')[1].split(';')[0];
                    if (mimeType && base64Part) {
                        visualInspiration = { mimeType, data: base64Part };
                    }
                } catch(e) {
                    console.error("Could not parse generated image data URL", e);
                }
            }
            
            return {
                name: char.name,
                type: char.type,
                personality: char.personality,
                visualInspiration: visualInspiration,
                previewUrl: imageUrl !== 'GENERATION_FAILED' ? imageUrl : undefined
            };
        });

        return await Promise.all(characterPromises);

    } catch (error) {
        console.error("Failed to extract or generate characters:", error);
        return [];
    }
};


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

// FIX: Moved regenerateImage from apiService.ts to geminiService.ts to resolve an import error in App.tsx. This function is an application-specific image generation helper and fits better in this service module.
export const regenerateImage = async (prompt: string, style: string): Promise<string | 'GENERATION_FAILED'> => {
    const fullPrompt = `${prompt}, in the style of ${style}`;
    return await generateImageWithFal(fullPrompt);
};

interface OutlineUpdate { stage: LoadingStage.DRAFTING_IDEAS | LoadingStage.SKETCHING_COVERS; }
export const generateStoryOutline = async (options: StoryOptions, onUpdate: (update: OutlineUpdate) => void): Promise<StoryOutline> => {
    onUpdate({ stage: LoadingStage.DRAFTING_IDEAS });
    
    const outlinePrompt = buildOutlinePrompt(options);
    
    const promptParts: ( { text: string } | { inlineData: { mimeType: string; data: string; } } )[] = [{ text: outlinePrompt }];
    options.characters.forEach(char => {
        if (char.visualInspiration) {
            promptParts.push({ inlineData: char.visualInspiration });
        }
    });

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: promptParts },
        config: { responseMimeType: "application/json", responseSchema: storyOutlineSchema }
    });
    
    const { title, synopsis, coverPrompts } = JSON.parse(response.text);

    onUpdate({ stage: LoadingStage.SKETCHING_COVERS });
    
    const coverImagePromises = coverPrompts.map((p: string) => generateImageWithFal(p));
    const coverImageUrls = await Promise.all(coverImagePromises);

    return {
        title,
        synopsis,
        coverImageOptions: coverImageUrls.map((imageUrl, i) => ({ prompt: coverPrompts[i], imageUrl })),
        originalOptions: options
    };
};


interface FullStoryUpdate {
    stage: LoadingStage;
    storyData?: StoryData;
    progress?: { current: number; total: number };
}

/**
 * Generates a detailed, consistent visual description of a character from an image.
 * This description is then used to ensure visual consistency in all story illustrations.
 * @param character The character object, which must include visual inspiration.
 * @returns A promise that resolves to a string containing the detailed description.
 */
const generateCharacterAppearanceDescription = async (character: Character): Promise<string> => {
    if (!character.visualInspiration) {
        return ''; 
    }
    
    const prompt = `
Analyze the provided image of a character.
Generate a single, concise, and visually detailed description of the character's appearance.
This description will be used in multiple image generation prompts, so it must be consistent and specific.
Focus on key features like species, clothing, colors, and any unique accessories.
The description should be a single sentence.
Example output: "A friendly brown teddy bear with button eyes, wearing a red bow tie."
Another example: "A young girl with curly brown hair, wearing a yellow raincoat and red boots."
`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [{ text: prompt }, { inlineData: character.visualInspiration }] },
    });
    
    return response.text.trim().replace(/"/g, '');
};


export const generateFullStoryFromSelection = async (
  options: StoryOptions, 
  selectedCoverPrompt: string,
  synopsis: string,
  t: (key: string, params?: Record<string, string | number>) => string,
  onUpdate: (update: FullStoryUpdate) => void
): Promise<StoryData> => {
    
  const styleMatch = selectedCoverPrompt.match(/Style: (.*)/);
  const finalIllustrationStyle = styleMatch ? styleMatch[1].trim() : options.illustrationStyle;
    
  onUpdate({ stage: LoadingStage.ANALYZING_PROMPT });
  
  const characterDescriptionPromises = options.characters.map(async (char) => {
      if (char.visualInspiration) {
          const visualDescription = await generateCharacterAppearanceDescription(char);
          return `For the character named '${char.name}', who is a ${char.type}, ALWAYS use this exact visual description: "${visualDescription}".`;
      }
      const textDescription = [char.name, char.type, char.personality].filter(Boolean).join(', ');
      return `The character '${char.name}' is a ${textDescription}.`;
  });
  
  const detailedCharacterDescriptions = (await Promise.all(characterDescriptionPromises)).join('\n');
  
  await delay(1000);
  
  onUpdate({ stage: LoadingStage.WRITING_PAGES });

  const fullStoryPrompt = buildFullStoryPrompt(options, synopsis, detailedCharacterDescriptions, finalIllustrationStyle);
    
    const promptParts: ( { text: string } | { inlineData: { mimeType: string; data: string; } } )[] = [{ text: fullStoryPrompt }];
    options.characters.forEach(char => {
        if (char.visualInspiration) {
            promptParts.push({ inlineData: char.visualInspiration });
        }
    });
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: promptParts },
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

    const finalOptions = { ...options, illustrationStyle: finalIllustrationStyle };

    const storyData: StoryData = {
        title: '', // Title is added back in App.tsx
        pages: pages.map(p => ({ ...p, imageUrl: undefined, audioUrl: undefined })),
        options: finalOptions,
    };

    onUpdate({ stage: LoadingStage.DESIGNING_CHARACTERS, storyData });
    await delay(1000);

    onUpdate({ stage: LoadingStage.PAINTING_SCENES, storyData, progress: { current: 0, total: totalPages } });

    const imagePromises = pages.map((page, index) =>
        generateImageWithFal(`${page.imagePrompt}, ${finalIllustrationStyle}`).then(imageUrl => {
            storyData.pages[index].imageUrl = imageUrl;
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

    const allPageAudioPromises = storyData.pages.map((page, i) => {
        const narrationPromise = generateAudio(page.text).then(url => {
            storyData.pages[i].audioUrl = url;
        });

        const sfxPromises = page.soundEffects?.map(sfx => 
            generateSoundEffect(sfx.sfx_prompt).then(audioUrl => {
                sfx.audioUrl = audioUrl;
            })
        ) || [];

        return Promise.all([narrationPromise, ...sfxPromises]);
    });

    for (let i = 0; i < allPageAudioPromises.length; i++) {
        await allPageAudioPromises[i];
        onUpdate({
            stage: LoadingStage.FINAL_TOUCHES,
            storyData: { ...storyData, pages: [...storyData.pages] },
            progress: { current: i + 1, total: totalPages },
        });
    }

    return storyData;
};