### 1. Introduction & Vision

#### 1.1. Overview

The AI Kids Story Teller is a magical web application that transforms a child's imagination into a beautifully written and illustrated storybook. Using the Google Gemini and Imagen APIs, it takes a simple prompt—like "a brave little squirrel who wants to fly"—and generates a unique, age-appropriate story complete with colorful illustrations.

The experience is designed to be simple, delightful, and interactive:
1.  A child or parent enters a story idea via text or voice.
2.  They can customize the story with options like age group, theme, length, and illustration style.
3.  They can even provide their own drawing or a picture to serve as inspiration for the main character.
4.  The AI brings the story to life, creating both the narrative and the pictures.
5.  The final story is presented in a simple, digital storybook format with an optional "read aloud" feature.

#### 1.2. Problem Statement

Parents are constantly seeking new and engaging ways to entertain their children and foster a love for reading. Store-bought books are finite, and finding stories that perfectly match a child's current interests can be challenging. Children, with their boundless creativity, often have amazing story ideas but lack the means to see them fully realized.

#### 1.3. Vision

To become a magical storytelling companion for every child, sparking their creativity, encouraging literacy, and making story time a collaborative and endlessly imaginative adventure for families.

---

### 2. User Personas

#### 2.1. Sarah, the Parent

*   **Needs:** To find fresh, positive, and age-appropriate stories for her 5-year-old, Leo. She wants a tool that is safe, easy to use, and can create stories based on Leo's fleeting obsessions (dinosaurs one week, astronauts the next).
*   **Pain Points:** Running out of bedtime stories. Struggles to find diverse characters and positive moral lessons in all media. Worries about screen time being passive.
*   **How We Help:** Sarah can use the Story Teller with Leo to create a new story every night. She controls the themes and can be sure the content is safe. It turns screen time into an active, creative session.

#### 2.2. Leo, the Child

*   **Needs:** To see his ideas come to life. He wants stories about his favorite toys, animals, and imaginary friends. He loves colorful pictures.
*   **Pain Points:** Gets bored of the same books. His imagination is bigger than the stories available to him.
*   **How We Help:** Leo can tell his mom his idea, and in moments, see a real story with pictures about it. He feels empowered and his creativity is validated, making him excited about storytelling.

---

### 3. Functional Requirements

#### 3.1. Input Screen

*   **F-IN-01 (Story Prompt):** A simple, large text input for the user to enter their story idea. The placeholder text is encouraging and fun (e.g., "A brave knight who is afraid of spiders...").
*   **F-IN-02 (Voice Input):** A microphone button allows users to dictate their story idea using speech-to-text.
*   **F-IN-03 (Visual Inspiration):** Users can upload an image (e.g., a photo of a pet) or use an integrated drawing canvas to create a picture of their character. This image is used by the AI as a primary reference.
*   **F-IN-04 (Sample Prompts):** A small, delightful list of sample prompts to spark ideas (e.g., "A curious cat who finds a magic hat").
*   **F-IN-05 (Story Customization):** A suite of simple options to tailor the story:
    *   **Age Group:** (e.g., 3-5 years, 6-8 years) to adjust vocabulary and complexity.
    *   **Theme:** (e.g., Friendship, Courage, Being Kind) to guide the narrative's moral.
    *   **Length:** (Short, Medium, Long) to control the number of paragraphs and illustrations.
    *   **Illustration Style:** (e.g., Watercolor, Cartoon) to define the visual aesthetic.
*   **F-IN-06 (Character Creator):** Optional text fields to define a main character's name, type (e.g., "a brave lion"), and personality.
*   **F-IN-07 (Multi-Language):** The user interface is available in both English and Indonesian, with a simple toggle.

#### 3.2. Generation Process

*   **F-GEN-01 (AI Story & Illustration Generation):** Based on all inputs, the application uses a two-step AI process:
    1.  **Story Generation:** The Gemini API (`gemini-2.5-flash`) generates a complete story structured as a JSON object. This object includes the title and a series of paragraphs. For key paragraphs, a simple text prompt for an illustration is also generated. The system prompt is heavily engineered to ensure child safety and adherence to user selections.
    2.  **Image Generation:** The Imagen API (`imagen-4.0-generate-001`) uses the illustration prompts from the previous step to generate beautiful, full-color images in the selected style.
*   **F-GEN-02 (Whimsical Progress Screen):** While the story is generating, a progress screen shows fun, animated steps like "Dreaming up characters...", "Building a magical world...", and "Painting the pictures...".

#### 3.3. Story Viewer

*   **F-VIEW-01 (Digital Storybook):** The final story is displayed in a clean, full-screen slideshow format. The title page is displayed first, followed by pages that pair illustrations with the corresponding story text.
*   **F-VIEW-02 (Slideshow Navigation):** Simple "Next" and "Previous" arrow buttons and page indicator dots allow for easy navigation through the story.
*   **F-VIEW-03 ("Read Aloud"):** An audio toggle enables a text-to-speech feature that reads the story aloud. The voice matches the selected language (English or Indonesian). When active, the slideshow automatically advances to the next page as the narration for the current page concludes.
*   **F-VIEW-04 ("New Story" Button):** A button allows the user to easily return to the input screen to create a new story.
*   **F-VIEW-05 (Future):** An option to download the story as a simple, printable PDF.

---

### 4. AI Ethics & Child Safety Policy

*   **Principle of Child Safety First:** This is the highest priority. All system prompts sent to the Gemini API include strict, non-negotiable instructions to generate content that is:
    *   **Strictly G-rated and age-appropriate.**
    *   **Positive, uplifting, and kind in tone and message.**
    *   **Completely free of violence, fear, complex emotional distress, or any mature themes.**
    *   **Inclusive and diverse in its portrayal of characters.**
*   **Content Filtering:** While not explicitly implemented with a keyword blocklist, the strong system prompt serves to guide the AI away from inappropriate content generation.
*   **Parental Guidance Welcome Screen:** A mandatory welcome message for first-time users (aimed at parents) explains that the stories are AI-generated and encourages co-reading and discussion with their child. The user must acknowledge this before using the app.
*   **No Data Storage:** No user-entered prompts, uploaded images, or generated stories are stored on a server. All processing is done in-session and data is discarded afterward. No PII is requested or stored.