# AI Kids Story Teller

A magical web application that transforms a child's imagination into a beautifully written and illustrated storybook using a powerful suite of AI tools.

## ✨ Features

-   **Two-Step Creative Process:** A unique workflow that gives users creative control.
    1.  **AI Story Outline:** The AI first generates a title, a brief synopsis, and three distinct cover art options in different visual styles.
    2.  **Style Selection:** You choose your favorite cover, which sets the artistic style for the entire book.
-   **Dynamic Story Generation:** Enter a simple idea (e.g., "a brave little squirrel who wants to fly"), and our AI crafts a unique, age-appropriate story based on your chosen style.
-   **Rich AI Illustrations:** Each page is brought to life with a beautiful, full-color illustration generated to match the narrative and your selected visual style.
-   **Advanced Audio Experience:**
    -   **"Read Aloud" Narration:** An immersive text-to-speech feature reads the story aloud.
    -   **Character Voices:** Assign different high-quality voices to each character for more engaging storytelling.
    -   **Interactive Sound Effects:** Click on specially highlighted words within the story to hear magical sound effects!
-   **Intelligent User Input:**
    -   **Voice-to-Prompt:** Use your voice to dictate the story idea directly into the app.
    -   **Automatic Character Extraction:** The AI intelligently identifies characters from your prompt and pre-fills the character creation section.
-   **Deep Customization:**
    -   **Story:** Tailor the narrative with options for Age Group (3-5 or 6-8), Theme (Friendship, Courage, etc.), and Length.
    -   **Characters:** Edit AI-suggested characters or create your own from scratch. Define their name, personality, and voice.
    -   **Visual Inspiration:** Kickstart the AI's imagination by uploading a photo or drawing your own character directly on our built-in canvas!
-   **Expanded Multi-Language Support:** The entire interface and story generation is available in **English, Indonesian, Arabic, Hindi, Japanese, and Chinese**.
-   **Interactive Story Viewer:**
    -   Navigate the digital storybook with simple controls.
    -   Retry image generation for any page if it fails or isn't quite right.
-   **Child-Safe by Design:** All generated content is strictly G-rated, positive, and free of any inappropriate themes.

## 🚀 Technology Stack

This application orchestrates several cutting-edge AI services to create a seamless and magical experience.

-   **Frontend:**
    -   **React** & **TypeScript**
    -   **Tailwind CSS** for styling
    -   **Lucide React** for icons

-   **Core AI Services:**
    -   **Google Gemini API (`gemini-2.5-flash`):** The primary "brain" of the application. It handles:
        -   Story outline, title, and synopsis generation.
        -   Full story text generation, structured into pages with narration and dialogue.
        -   Creation of image prompts and sound effect triggers for each page.
        -   Automatic character extraction from the user's prompt.
        -   Generating visual descriptions from user-uploaded images.
        -   Transcribing user voice input (Speech-to-Text).
    -   **FAL.ai (`nano-banana`):** The specialized model used to generate **all** the vibrant, stylized illustrations for the storybook, including cover options, character previews, and final page art.
    -   **ElevenLabs API:** Powers the high-quality, multilingual "Read Aloud" feature, providing natural-sounding narration for both the narrator and individual characters, as well as all sound effects.

## ⚙️ How It Works

1.  **Input & Customization:** The user provides a story prompt (typing or speaking), customizes options like theme and length, and can optionally add/edit characters with visual inspiration (upload/draw) and voice preferences.
2.  **Outline Generation (Step 1):** The prompt and character details are sent to the **Google Gemini API**, which returns a title, synopsis, and three distinct image prompts for a book cover, each with a different artistic style (e.g., "Style: Watercolor").
3.  **Cover Sketching:** These three prompts are sent to the **FAL.ai API**, which generates three beautiful cover images, giving the user a visual choice of styles.
4.  **Style Selection:** The user clicks their favorite cover. This choice locks in the artistic style for the rest of the book.
5.  **Full Story Generation (Step 2):** All the initial inputs, plus the chosen style, are sent back to the **Google Gemini API**. It then generates the complete, page-by-page story text, tailored image prompts for each page that match the chosen style, and identifies key moments for sound effects.
6.  **Illustration:** Each page's new image prompt is sent to **FAL.ai** to generate the final artwork.
7.  **Audio Generation:** The text for each page is sent to the **ElevenLabs API** to generate narration audio clips (using different voices for characters) and sound effects.
8.  **Assembly & Viewing:** The application combines the text, images, and audio into the final interactive digital storybook for the user to enjoy.

## 🛡️ AI Ethics & Child Safety

The highest priority is child safety. System prompts sent to the AI include strict, non-negotiable instructions to generate content that is G-rated, positive, uplifting, and free of violence, fear, or any mature themes. We encourage co-reading and parental supervision to make story time a shared, creative adventure.
