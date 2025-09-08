import { useState, useCallback } from 'react';

export const useSoundEffects = () => {
    const [playingSfx, setPlayingSfx] = useState<HTMLAudioElement | null>(null);

    const playSfx = useCallback((audioUrl: string) => {
        if (playingSfx) {
            playingSfx.pause();
            playingSfx.currentTime = 0;
        }
        const audio = new Audio(audioUrl);
        audio.play().catch(e => console.error("Error playing sound effect:", e));
        setPlayingSfx(audio);
    }, [playingSfx]);

    const stopSfx = useCallback(() => {
        if (playingSfx) {
            playingSfx.pause();
            playingSfx.currentTime = 0;
            setPlayingSfx(null);
        }
    }, [playingSfx]);

    return { playSfx, stopSfx };
};
