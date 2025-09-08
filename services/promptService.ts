import { Type } from "@google/genai";
import { Language, StoryOptions, Character } from '../types';

export const storyOutlineSchema = {
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
    coverPrompts: {
        type: Type.ARRAY,
        description: "An array of exactly 3 diverse and visually rich image prompts for the book cover. Each prompt must end with a ' Style: [Style Name]' suffix, e.g., ' Style: Vibrant Cartoon'.",
        items: {
            type: Type.STRING
        }
    }
  },
  required: ["title", "synopsis", "coverPrompts"],
};

export const storySchema = {
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

export const charactersSchema = {
  type: Type.OBJECT,
  properties: {
    characters: {
      type: Type.ARRAY,
      description: 'An array of main characters found in the story prompt.',
      items: {
        type: Type.OBJECT,
        properties: {
          name: {
            type: Type.STRING,
            description: 'The name of the character.',
          },
          type: {
            type: Type.STRING,
            description: 'A short description of the character\'s type (e.g., "a young girl", "a brave lion", "a friendly teddy bear").',
          },
          personality: {
            type: Type.STRING,
            description: 'A short description of the character\'s personality (e.g., "adventurous and kind", "shy but clever").',
          },
          imagePrompt: {
              type: Type.STRING,
              description: 'A simple but visually descriptive prompt for an image generation model to create a 150x150 pixel character icon. Example: "A cute, friendly teddy bear named Barnaby, simple cartoon style for kids."'
          }
        },
        required: ["name", "type", "personality", "imagePrompt"],
      },
    },
  },
  required: ["characters"],
};

export const samplePromptsSchema = {
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


export const getLanguageName = (lang: Language): string => {
    switch (lang) {
        case 'en': return 'English';
        case 'id': return 'Indonesian';
        case 'ar': return 'Arabic';
        case 'hi': return 'Hindi';
        case 'ja': return 'Japanese';
        case 'zh': return 'Chinese';
        default: return 'English';
    }
};

export const getPageCount = (length: 'very_short' | 'short' | 'medium' | 'long') => {
    switch(length) {
        case 'very_short': return '3';
        case 'short': return '7';
        case 'medium': return '19';
        case 'long': return '25';
    }
};

const buildCharacterDescription = (characters: Character[]): string => {
    if (!characters || characters.length === 0) return '';
    const descriptions = characters.map((char, index) => {
        const details = [char.name, char.type, char.personality].filter(Boolean).join(', ');
        if (!details) return null;
        return `Character ${index + 1}: ${details}. ${char.visualInspiration ? `(See provided image for appearance)` : ''}`;
    }).filter(Boolean).join('\n');
    return descriptions;
};

export const buildOutlinePrompt = (options: StoryOptions): string => {
    const characterDescription = buildCharacterDescription(options.characters);
    return `
You are a creative author and art director for children's books. Based on the user's idea and character descriptions, you must generate three things:
1. A creative and engaging title for the story.
2. A short, one-paragraph synopsis of the story that is exciting and gives a taste of the adventure to come.
3. An array of exactly 3 diverse and visually rich image prompts for the book cover.

**Rules for Cover Prompts:**
- They MUST feature the main characters as described by the user.
- If character images are provided, the descriptions in the prompts MUST be consistent with those images.
- Each prompt must represent a different artistic style. For example, one could be whimsical and happy, another soft and dreamy, and a third epic and magical.
- CRITICALLY, each prompt string MUST end with a " Style: [Style Name]" suffix. For example, "A brave squirrel with a red cape standing on a branch, looking at the moon. Style: Dreamy Watercolor".

The entire response, including titles, synopsis, and prompts, must be written in ${getLanguageName(options.language)}.
Be strictly G-rated, positive, and safe for all ages.

Story Idea: "${options.prompt}"
${characterDescription ? `Main Characters:\n${characterDescription}` : ''}
`;
};

export const buildFullStoryPrompt = (
    options: StoryOptions, 
    synopsis: string, 
    detailedCharacterDescriptions: string,
    finalIllustrationStyle: string
): string => {
    return `
You are a world-class children's storyteller and a voice director. Your task is to write a complete story in ${getLanguageName(options.language)} based on the provided synopsis and character descriptions.

**Story Guidelines:**
- **Target Age:** ${options.ageGroup}
- **Theme:** ${options.theme}
- **Tone:** Positive, uplifting, and kind.
- **Content Rules:** Absolutely NO violence, scary elements, or mature themes.
- **Length:** Create a story with exactly ${getPageCount(options.length)} pages (paragraphs).
- **Expressive Narration:** To make the narration more engaging, embed emotional context tags directly into the story text for the AI voice actor. These tags add reactions, emotional states, and pauses.
    - **Use tags like:** [laughs], [sigh], [excited], [nervous], [whispers], [pauses], [gasps], [sorrowful].
    - **Example of correctly formatted text:** "He looked at the giant cookie. [gasps] 'It's bigger than my head!' he shouted, [excited]."
- **Image Prompts:** For each page, create a child-friendly, G-rated image prompt.
- **Sound Effects:** For each page, identify 1-2 key moments that can be enhanced with a sound effect. For each moment, provide the exact text phrase from the story that should trigger the sound, and a simple, descriptive prompt for an AI to generate the sound (e.g., "leaves rustling", "door creaking", "happy bird chirping").

**CRUCIAL INSTRUCTION FOR CHARACTER VISUALS:**
You have been provided with detailed visual descriptions for the main characters. For every image prompt you generate that includes a character, you MUST use the exact visual description provided below for that character. Do not improvise or change it. This is the most important rule to ensure visual consistency throughout the story.

**Main Characters' Visual Descriptions:**
${detailedCharacterDescriptions}

**Story Synopsis:**
${synopsis}

**Selected Visual Style (for all image prompts):**
${finalIllustrationStyle}

Please generate the complete story now.
`;
};
