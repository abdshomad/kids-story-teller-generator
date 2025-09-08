import { GoogleGenAI } from "@google/genai";
import { StoryOptions, StoryData, StoryPage, Language, LoadingStage, StoryOutline, Character } from '../types';
import { generateImageWithFal, generateAudio, generateSoundEffect, delay } from './apiService';
import { storyOutlineSchema, storySchema, buildOutlinePrompt, buildFullStoryPrompt } from './promptService';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface OutlineUpdate { stage: LoadingStage.DRAFTING_IDEAS | LoadingStage.SKETCHING_COVERS; }
interface FullStoryUpdate {
    stage: LoadingStage;
    storyData?: StoryData;
    progress?: { current: number; total: number };
}

const generateCharacterAppearanceDescription = async (character: Character): Promise<string> => {
    if (!character.visualInspiration) return ''; 
    const prompt = `Analyze the provided character image. Generate a single, concise, visually detailed description of their appearance (species, clothing, colors, key features). This description must be consistent for use in multiple prompts. Output a single sentence only.`;
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [{ text: prompt }, { inlineData: character.visualInspiration }] },
    });
    return response.text.trim().replace(/"/g, '');
};

const generateStoryTextAndPrompts = async (options: StoryOptions, synopsis: string, detailedCharacterDescriptions: string, finalIllustrationStyle: string, t: (key: string) => string): Promise<{ pages: StoryPage[] }> => {
    const fullStoryPrompt = buildFullStoryPrompt(options, synopsis, detailedCharacterDescriptions, finalIllustrationStyle);
    const promptParts: ( { text: string } | { inlineData: { mimeType: string; data: string; } } )[] = [{ text: fullStoryPrompt }];
    options.characters.forEach(char => { if (char.visualInspiration) { promptParts.push({ inlineData: char.visualInspiration }); } });
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: promptParts },
            config: { responseMimeType: "application/json", responseSchema: storySchema },
        });
        return JSON.parse(response.text);
    } catch (e) {
        console.error("Failed to parse story JSON from Gemini:", e);
        throw new Error(t('error.generic'));
    }
};

export const regenerateImage = async (prompt: string, style: string): Promise<string | 'GENERATION_FAILED'> => {
    return await generateImageWithFal(`${prompt}, in the style of ${style}`);
};

export const generateStoryOutline = async (options: StoryOptions, onUpdate: (update: OutlineUpdate) => void): Promise<StoryOutline> => {
    onUpdate({ stage: LoadingStage.DRAFTING_IDEAS });
    const outlinePrompt = buildOutlinePrompt(options);
    const promptParts: ( { text: string } | { inlineData: { mimeType: string; data: string; } } )[] = [{ text: outlinePrompt }];
    options.characters.forEach(char => { if (char.visualInspiration) { promptParts.push({ inlineData: char.visualInspiration }); } });

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: promptParts },
        config: { responseMimeType: "application/json", responseSchema: storyOutlineSchema }
    });
    
    const { title, synopsis, coverPrompts } = JSON.parse(response.text);

    onUpdate({ stage: LoadingStage.SKETCHING_COVERS });
    
    const coverImagePromises = coverPrompts.map((p: string) => generateImageWithFal(p));
    const coverImageUrls = await Promise.all(coverImagePromises);

    return { title, synopsis, coverImageOptions: coverImageUrls.map((imageUrl, i) => ({ prompt: coverPrompts[i], imageUrl })), originalOptions: options };
};

export const generateFullStoryFromSelection = async (options: StoryOptions, selectedCoverPrompt: string, synopsis: string, t: (key: string, params?: Record<string, string | number>) => string, onUpdate: (update: FullStoryUpdate) => void): Promise<StoryData> => {
  const finalIllustrationStyle = selectedCoverPrompt.match(/Style: (.*)/)?.[1].trim() ?? options.illustrationStyle;
  onUpdate({ stage: LoadingStage.ANALYZING_PROMPT });
  
  const characterPromises = options.characters.map(async (char) => {
      if (char.visualInspiration) {
          const visualDescription = await generateCharacterAppearanceDescription(char);
          return `For character '${char.name}', ALWAYS use this exact description: "${visualDescription}".`;
      }
      return `The character '${char.name}' is a ${[char.type, char.personality].filter(Boolean).join(', ')}.`;
  });
  const detailedCharacterDescriptions = (await Promise.all(characterPromises)).join('\n');
  
  onUpdate({ stage: LoadingStage.WRITING_PAGES });
  const parsedStory = await generateStoryTextAndPrompts(options, synopsis, detailedCharacterDescriptions, finalIllustrationStyle, (key) => t(key) as string);
  
  const finalOptions = { ...options, illustrationStyle: finalIllustrationStyle };
  const storyData: StoryData = { title: '', pages: parsedStory.pages?.map(p => ({ ...p, imageUrl: undefined, audioUrl: undefined })) || [], options: finalOptions };

  onUpdate({ stage: LoadingStage.PAINTING_SCENES, storyData, progress: { current: 0, total: storyData.pages.length } });
  const imagePromises = storyData.pages.map((page, index) =>
    regenerateImage(page.imagePrompt, finalIllustrationStyle).then(imageUrl => {
        storyData.pages[index].imageUrl = imageUrl;
        onUpdate({ stage: LoadingStage.PAINTING_SCENES, storyData: { ...storyData }, progress: { current: index + 1, total: storyData.pages.length } });
    })
  );
  await Promise.all(imagePromises);

  onUpdate({ stage: LoadingStage.FINAL_TOUCHES, storyData, progress: { current: 0, total: storyData.pages.length } });
  for (let i = 0; i < storyData.pages.length; i++) {
    const page = storyData.pages[i];
    const narrationPromise = generateAudio(page.text).then(url => { page.audioUrl = url; });
    const sfxPromises = page.soundEffects?.map(sfx => generateSoundEffect(sfx.sfx_prompt).then(url => { sfx.audioUrl = url; })) || [];
    await Promise.all([narrationPromise, ...sfxPromises]);
    onUpdate({ stage: LoadingStage.FINAL_TOUCHES, storyData: { ...storyData }, progress: { current: i + 1, total: storyData.pages.length } });
  }

  return storyData;
};
