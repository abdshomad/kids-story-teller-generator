
import { Language, StoryOptions, Character } from '../types';

export const getLanguageName = (lang: Language): string => {
    const names: Record<Language, string> = { en: 'English', id: 'Indonesian', ar: 'Arabic', hi: 'Hindi', ja: 'Japanese', zh: 'Chinese' };
    return names[lang] || 'English';
};

export const getPageCount = (length: 'very_short' | 'short' | 'medium' | 'long') => {
    const counts = { very_short: '3', short: '7', medium: '19', long: '25' };
    return counts[length];
};

const buildCharacterDescription = (characters: Character[]): string => {
    if (!characters?.length) return '';
    return characters.map((char, index) => {
        const details = [char.name, char.type, char.personality].filter(Boolean).join(', ');
        if (!details) return null;
        return `Character ${index + 1}: ${details}. ${char.visualInspiration ? `(See provided image for appearance)` : ''}`;
    }).filter(Boolean).join('\n');
};

export const buildOutlinePrompt = (options: StoryOptions): string => {
    const characterDescription = buildCharacterDescription(options.characters);
    return `
You are a creative author for children's books. Generate a title, a one-paragraph synopsis, and an array of exactly 3 diverse book cover image prompts.
Rules for Cover Prompts:
- Must feature the main characters described.
- If character images are provided, prompts must be consistent with them.
- Each prompt must represent a different artistic style.
- CRITICALLY, each prompt MUST end with " Style: [Style Name]". Example: "... Style: Dreamy Watercolor".
The entire response must be in ${getLanguageName(options.language)}, strictly G-rated, positive, and safe.
Story Idea: "${options.prompt}"
${characterDescription ? `Main Characters:\n${characterDescription}` : ''}
`;
};

export const buildFullStoryPrompt = (
    options: StoryOptions, synopsis: string, detailedCharacterDescriptions: string, finalIllustrationStyle: string
): string => {
    return `
You are a world-class children's storyteller. Write a complete story in ${getLanguageName(options.language)}.
Guidelines:
- Age: ${options.ageGroup}, Theme: ${options.theme}
- Tone: Positive, uplifting, kind. NO violence, scary elements, or mature themes.
- Length: Exactly ${getPageCount(options.length)} pages (paragraphs).
- Narration Tags: Embed emotional context tags like [laughs], [sighs], [excited] for the voice actor. Example: "He shouted, [excited]."
- Image Prompts: For each page, create a child-friendly, G-rated image prompt.
- Sound Effects: For each page, identify 1-2 key moments. Provide the exact text trigger and a simple sfx_prompt (e.g., "leaves rustling").

CRUCIAL: For all image prompts, you MUST use the exact visual descriptions provided below for each character to ensure visual consistency.
Main Characters' Visual Descriptions:
${detailedCharacterDescriptions}

Story Synopsis:
${synopsis}

Selected Visual Style (for all image prompts):
${finalIllustrationStyle}
`;
};
