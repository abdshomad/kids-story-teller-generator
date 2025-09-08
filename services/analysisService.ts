import { GoogleGenAI } from "@google/genai";
import { Language, Character } from '../types';
import { generateImageWithFal } from './apiService';
import { samplePromptsSchema, charactersSchema, getLanguageName } from './promptService';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateSamplePrompts = async (language: Language, existingPrompts: { title: string; prompt: string; }[] = []): Promise<{ title: string; prompt: string; }[]> => {
    const existingPromptsText = existingPrompts.length > 0
        ? `To ensure variety, please do not generate prompts similar to these:\n${existingPrompts.map(p => `- "${p.title}"`).join('\n')}`
        : '';
    const prompt = `Generate 4 unique, creative, and imaginative story prompts for children aged 3-8. They should be very different from each other. Provide a short, catchy title (max 5 words) and a longer prompt (2-3 sentences). ${existingPromptsText} The prompts must be in ${getLanguageName(language)}.`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash', contents: prompt,
            config: { responseMimeType: "application/json", responseSchema: samplePromptsSchema },
        });
        const result = JSON.parse(response.text);
        return result.prompts || [];
    } catch (error) {
        console.error("Failed to generate sample prompts:", error);
        return [ { title: 'The Shy Ghost', prompt: 'A brave little ghost is secretly afraid of the dark. How will he find his courage?' } ];
    }
};

export const extractAndGenerateCharacters = async (prompt: string, language: Language): Promise<(Partial<Character> & { previewUrl?: string })[]> => {
    const systemInstruction = `Identify main characters from the user's prompt. For each, provide name, type, personality, and a simple icon image prompt. Respond in ${getLanguageName(language)}.`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash', contents: prompt,
            config: { systemInstruction, responseMimeType: "application/json", responseSchema: charactersSchema },
        });
        const result = JSON.parse(response.text);
        const charactersToGenerate: { name: string; type: string; personality: string; imagePrompt: string; }[] = result.characters || [];
        if (charactersToGenerate.length === 0) return [];

        const characterPromises = charactersToGenerate.map(async (char) => {
            const imageUrl = await generateImageWithFal(char.imagePrompt);
            let visualInspiration: Character['visualInspiration'] | undefined;
            if (imageUrl !== 'GENERATION_FAILED') {
                try {
                    const [mimePart, base64Part] = imageUrl.split(',');
                    visualInspiration = { mimeType: mimePart.split(':')[1].split(';')[0], data: base64Part };
                } catch(e) { console.error("Could not parse generated image data URL", e); }
            }
            return { name: char.name, type: char.type, personality: char.personality, visualInspiration, previewUrl: imageUrl !== 'GENERATION_FAILED' ? imageUrl : undefined };
        });
        return await Promise.all(characterPromises);
    } catch (error) {
        console.error("Failed to extract or generate characters:", error);
        return [];
    }
};

export const transcribeAudio = async (audio: { mimeType: string; data: string }, language: Language): Promise<string> => {
    const audioPart = { inlineData: { mimeType: audio.mimeType, data: audio.data } };
    const prompt = `Transcribe the following audio. The speaker is describing a story idea for a child. The language is ${getLanguageName(language)}.`;
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: { parts: [audioPart, { text: prompt }] } });
    return response.text;
};
