import { Type } from "@google/genai";

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
            type: Type.ARRAY,
            description: "An array of objects representing parts of the text, separating narration from dialogue. Example: [{type: 'narration', content: '...'}, {type: 'dialogue', characterName: 'Character', content: '...'}]",
            items: {
              type: Type.OBJECT,
              properties: {
                type: {
                  type: Type.STRING,
                  description: "The type of text, either 'narration' or 'dialogue'."
                },
                characterName: {
                  type: Type.STRING,
                  description: "If type is 'dialogue', the name of the character speaking. Must match a provided character name."
                },
                content: {
                  type: Type.STRING,
                  description: 'The text content for this part. Should include emotional context tags like [laughs].'
                }
              },
              required: ["type", "content"]
            }
          },
          imagePrompt: {
            type: Type.STRING,
            description: 'A simple, descriptive prompt for generating an illustration that matches this part of the story. The prompt should be G-rated, child-friendly, and focus on characters and actions. Example: "A brave little squirrel wearing a tiny red cape, looking up at a tall oak tree, cartoon style."'
          },
          soundEffects: {
            type: Type.ARRAY,
            description: "An optional array of sound effects for this page. Identify 1-2 key moments. The text_trigger must be a phrase from the 'content' of one of the text parts.",
            items: {
                type: Type.OBJECT,
                properties: {
                    text_trigger: {
                        type: Type.STRING,
                        description: "The exact text phrase from the 'content' of one of the text parts on this page that should trigger this sound effect."
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