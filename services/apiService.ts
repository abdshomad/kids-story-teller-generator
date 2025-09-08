import { FAL_API_KEY, ELEVENLABS_API_KEY } from '../env';

const FAL_IMG_API_URL = 'https://fal.run/fal-ai/nano-banana';

export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const generateImageWithFal = async (prompt: string): Promise<string | 'GENERATION_FAILED'> => {
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

export const generateSoundEffect = async (prompt: string): Promise<string | undefined> => {
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
                text: `*${prompt}*`,
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

export const generateAudio = async (text: string): Promise<string | undefined> => {
    if (!ELEVENLABS_API_KEY) {
        console.warn("ELEVENLABS_API_KEY not found. Skipping audio generation.");
        return undefined;
    }
    try {
        const textToSpeak = text;
        if (!textToSpeak || !textToSpeak.trim()) {
            return undefined;
        }

        const API_URL = `https://api.elevenlabs.io/v1/text-to-speech/piTKgcLEGmPE4e6mEKli`; // Nicole
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'xi-api-key': ELEVENLABS_API_KEY },
            body: JSON.stringify({
                text: textToSpeak,
                model_id: 'eleven_v3',
                voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0.2, use_speaker_boost: true },
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