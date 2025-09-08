import React, { FC, useRef } from 'react';
import { Character } from '../../types';
import { useAppContext } from '../../App';
import { Image, Upload, PenSquare, Trash2 } from 'lucide-react';

const fileToBase64 = (file: File): Promise<{mimeType: string, data: string}> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
        const result = reader.result as string;
        const [mimePart, base64Part] = result.split(',');
        const mimeType = mimePart.split(':')[1].split(';')[0];
        resolve({ mimeType, data: base64Part });
    };
    reader.onerror = (error) => reject(error);
  });
};

const CharacterCard: FC<{
    character: Character;
    previewUrl?: string;
    onChange: (id: string, field: keyof Omit<Character, 'id' | 'visualInspiration'>, value: string) => void;
    onInspirationChange: (id: string, inspiration: Character['visualInspiration'], previewUrl: string) => void;
    onDrawClick: (id: string) => void;
    onRemove?: (id: string) => void;
    isOnlyCharacter: boolean;
}> = ({ character, previewUrl, onChange, onInspirationChange, onDrawClick, onRemove, isOnlyCharacter }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { t } = useAppContext();

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            try {
                const { mimeType, data } = await fileToBase64(file);
                onInspirationChange(character.id, { mimeType, data }, URL.createObjectURL(file));
            } catch (error) {
                console.error("Error converting file to base64", error);
            }
        }
    };

    return (
        <div className="bg-slate-100/60 p-4 rounded-xl relative">
            {!isOnlyCharacter && onRemove && (
                <button
                    type="button"
                    onClick={() => onRemove(character.id)}
                    className="absolute top-2 right-2 p-1.5 text-slate-400 hover:bg-red-100 hover:text-red-500 rounded-full transition-colors"
                    aria-label="Remove character"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            )}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="w-full sm:w-28 flex-shrink-0">
                    <div className="aspect-square w-full bg-slate-200 rounded-lg flex items-center justify-center overflow-hidden">
                        {previewUrl ? (
                            <img src={previewUrl} alt="Character inspiration" className="w-full h-full object-cover" />
                        ) : (
                            <Image className="w-8 h-8 text-slate-400" />
                        )}
                    </div>
                    <div className="flex justify-around mt-2">
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            title={t('input.visualInspiration.uploadDescription')}
                            className="p-1.5 text-slate-500 hover:text-fuchsia-600 transition-colors"
                        >
                            <Upload className="w-5 h-5" />
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*"
                            className="hidden"
                        />
                        <button
                            type="button"
                            onClick={() => onDrawClick(character.id)}
                            title={t('input.visualInspiration.drawDescription')}
                            className="p-1.5 text-slate-500 hover:text-fuchsia-600 transition-colors"
                        >
                            <PenSquare className="w-5 h-5" />
                        </button>
                    </div>
                </div>
                <div className="flex-grow space-y-2">
                    <input type="text" placeholder={t('input.character.name')} value={character.name} onChange={(e) => onChange(character.id, 'name', e.target.value)} className="w-full p-2 bg-white/80 border border-slate-300/80 rounded-md focus:ring-2 focus:ring-fuchsia-300" />
                    <input type="text" placeholder={t('input.character.type')} value={character.type} onChange={(e) => onChange(character.id, 'type', e.target.value)} className="w-full p-2 bg-white/80 border border-slate-300/80 rounded-md focus:ring-2 focus:ring-fuchsia-300" />
                    <input type="text" placeholder={t('input.character.personality')} value={character.personality} onChange={(e) => onChange(character.id, 'personality', e.target.value)} className="w-full p-2 bg-white/80 border border-slate-300/80 rounded-md focus:ring-2 focus:ring-fuchsia-300" />
                </div>
            </div>
        </div>
    );
};

export default CharacterCard;
