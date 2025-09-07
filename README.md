# AI Kids Story Teller

A magical web application that transforms a child's imagination into a beautifully written and illustrated storybook using a powerful suite of AI tools.

## ✨ Features

-   **Dynamic Story Generation:** Enter a simple idea (e.g., "a brave little squirrel who wants to fly"), and our AI crafts a unique, age-appropriate story.
-   **AI-Powered Illustrations:** Each page of the story is brought to life with a beautiful, full-color illustration generated to match the narrative.
-   **Voice-to-Prompt:** Use your voice to dictate the story idea directly into the app, making it accessible and fun for kids.
-   **"Read Aloud" Narration:** An immersive text-to-speech feature reads the story aloud in a natural, engaging voice, available in multiple languages.
-   **Deep Customization:** Tailor the story to perfection with options for:
    -   **Age Group:** (e.g., 3-5 years, 6-8 years)
    -   **Theme:** (e.g., Friendship, Courage, Kindness)
    -   **Length:** (Short, Medium, Long)
    -   **Illustration Style:** (e.g., Watercolor, Cartoon, Pixel Art)
-   **Visual Character Inspiration:** Kickstart the AI's imagination by uploading a photo, or draw your own character directly on our built-in canvas!
-   **Multi-Language Support:** The entire interface and story generation is available in both **English** and **Indonesian**.
-   **Child-Safe by Design:** All generated content is strictly G-rated, positive, and free of any inappropriate themes.

## 🚀 Technology Stack

This application orchestrates several cutting-edge AI services to create a seamless and magical experience.

-   **Frontend:**
    -   **React** & **TypeScript**
    -   **Tailwind CSS** for styling
    -   **Lucide React** for icons

-   **Core AI Services:**
    -   **Google Gemini API (`gemini-2.5-flash`):** The primary engine for generating the story's narrative and transcribing user voice input.
    -   **FAL.ai (`nano-banana`):** The specialized model used to generate all the vibrant, stylized illustrations for the storybook.
    -   **ElevenLabs API:** Powers the high-quality, multilingual "Read Aloud" text-to-speech feature, providing natural-sounding narration.

## ⚙️ How It Works

1.  **Input:** The user provides a story prompt, either by typing or speaking. They can also provide an image for character inspiration and select various customization options.
2.  **Story Generation:** The prompt and options are sent to the **Google Gemini API**, which generates a complete story structured as a JSON object, including page text and prompts for illustrations.
3.  **Image Generation:** For each page, the generated illustration prompt is sent to the **FAL.ai API**, which creates a beautiful image in the user's selected style.
4.  **Assembly:** The application combines the text and images into a digital storybook format.
5.  **Narration (Optional):** If the user activates "Read Aloud", the text for each page is sent to the **ElevenLabs API** to generate audio, which is then played back in the browser.

## 🛡️ AI Ethics & Child Safety

The highest priority is child safety. System prompts sent to the AI include strict, non-negotiable instructions to generate content that is G-rated, positive, uplifting, and free of violence, fear, or any mature themes. We encourage co-reading and parental supervision to make story time a shared, creative adventure.
