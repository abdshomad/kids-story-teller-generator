
import React, { useRef } from 'react';
import DrawingCanvas, { DrawingCanvasRef } from './DrawingCanvas';
import { useAppContext } from '../App';
import { Check, Trash2, X } from 'lucide-react';

interface FullscreenCanvasProps {
  onDone: (dataUrl: string) => void;
  onClose: () => void;
}

const FullscreenCanvas: React.FC<FullscreenCanvasProps> = ({ onDone, onClose }) => {
  const canvasRef = useRef<DrawingCanvasRef>(null);
  const { t } = useAppContext();

  const handleDone = () => {
    const dataUrl = canvasRef.current?.toDataURL();
    if (dataUrl) {
      onDone(dataUrl);
    } else {
      onClose(); // Close even if empty
    }
  };

  const handleClear = () => {
    canvasRef.current?.clear();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-4">
        <div className="absolute top-4 right-4">
            <button
                onClick={onClose}
                className="p-3 bg-white/20 text-white rounded-full hover:bg-white/30 transition-colors"
                aria-label={t('input.draw.close')}
            >
                <X className="w-6 h-6" />
            </button>
        </div>
        
        <div className="w-full h-full max-w-4xl max-h-[80vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col p-4">
            <DrawingCanvas ref={canvasRef} strokeWidth={5} />
        </div>

        <div className="flex items-center gap-4 mt-6">
            <button
                onClick={handleClear}
                className="flex items-center gap-2 px-6 py-3 bg-white text-slate-800 font-bold rounded-full shadow-lg hover:bg-slate-100 transition-colors"
            >
                <Trash2 className="w-5 h-5" />
                {t('input.draw.clear')}
            </button>
            <button
                onClick={handleDone}
                className="flex items-center gap-2 px-8 py-4 bg-green-500 text-white font-extrabold rounded-full shadow-lg hover:bg-green-600 transition-colors text-lg"
            >
                <Check className="w-6 h-6" />
                {t('input.draw.done')}
            </button>
        </div>
    </div>
  );
};

export default FullscreenCanvas;
