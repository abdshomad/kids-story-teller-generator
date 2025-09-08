import { useState, useEffect } from 'react';

const STATIC_PLACEHOLDER = "Lily's favorite teddy bear, Barnaby, seems to be a regular toy. But at night, Barnaby whispers exciting secrets about the day's adventures. What amazing things does he tell Lily?";

export const useAnimatedPlaceholder = (samplePrompts: { prompt: string }[], currentPrompt: string) => {
  const [placeholder, setPlaceholder] = useState(STATIC_PLACEHOLDER);

  useEffect(() => {
    if (currentPrompt || samplePrompts.length === 0) {
        setPlaceholder(STATIC_PLACEHOLDER);
        return;
    }

    const allPlaceholders = [STATIC_PLACEHOLDER, ...samplePrompts.map(p => p.prompt)];
    let currentIndex = 0;
    setPlaceholder(allPlaceholders[0]);

    const intervalId = setInterval(() => {
      currentIndex = (currentIndex + 1) % allPlaceholders.length;
      setPlaceholder(allPlaceholders[currentIndex]);
    }, 4000);

    return () => clearInterval(intervalId);
  }, [samplePrompts, currentPrompt]);

  return placeholder;
};
