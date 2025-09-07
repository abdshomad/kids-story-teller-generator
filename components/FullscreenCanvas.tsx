
import React, { useRef, useState } from 'react';
import DrawingCanvas, { DrawingCanvasRef } from './DrawingCanvas';
import { useAppContext } from '../App';
import { Check, Trash2, X, Pen, Eraser } from 'lucide-react';

interface FullscreenCanvasProps {
  onDone: (dataUrl: string) => void;
  onClose: () => void;
}

const FullscreenCanvas: React.FC<FullscreenCanvasProps> = ({ onDone, onClose }) => {
  const canvasRef = useRef<DrawingCanvasRef>(null);
  const { t } = useAppContext();
  const [tool, setTool] = useState<'brush' | 'eraser'>('brush');
  const [strokeWidth, setStrokeWidth] = useState(5);
  const [strokeColor, setStrokeColor] = useState('#334155'); // slate-800

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
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-2 sm:p-4">
        <div className="absolute top-4 right-4">
            <button
                onClick={onClose}
                className="p-3 bg-white/20 text-white rounded-full hover:bg-white/30 transition-colors"
                aria-label={t('input.draw.close')}
            >
                <X className="w-6 h-6" />
            </button>
        </div>
        
        <div className="w-full h-full max-w-4xl max-h-[75vh] sm:max-h-[80vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col p-2 sm:p-4">
            <DrawingCanvas
                ref={canvasRef}
                tool={tool}
                strokeWidth={strokeWidth}
                strokeColor={strokeColor}
            />
        </div>
        
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 my-3">
          <div className="flex items-center gap-2 p-1 bg-white/20 rounded-full">
            <button
              onClick={() => setTool('brush')}
              aria-label={t('input.draw.brush')}
              className={`p-3 rounded-full transition-colors ${tool === 'brush' ? 'bg-white text-slate-800 shadow-md' : 'text-white hover:bg-white/30'}`}
            >
              <Pen className="w-5 h-5" />
            </button>
            <button
              onClick={() => setTool('eraser')}
              aria-label={t('input.draw.eraser')}
              className={`p-3 rounded-full transition-colors ${tool === 'eraser' ? 'bg-white text-slate-800 shadow-md' : 'text-white hover:bg-white/30'}`}
            >
              <Eraser className="w-5 h-5" />
            </button>
          </div>

          <div className={`p-2 bg-white/20 rounded-full transition-opacity ${tool === 'eraser' ? 'opacity-50 cursor-not-allowed' : ''}`}>
            <input
              type="color"
              value={strokeColor}
              onChange={(e) => setStrokeColor(e.target.value)}
              disabled={tool === 'eraser'}
              className="w-10 h-10 p-0 bg-transparent border-none rounded-full cursor-pointer disabled:cursor-not-allowed"
              style={{'WebkitAppearance': 'none', 'MozAppearance': 'none', appearance: 'none'}}
              aria-label={t('input.draw.color')}
            />
          </div>
          
          <div className="flex items-center gap-3 p-2 px-4 bg-white/20 rounded-full w-48">
             <div className="w-5 h-5 bg-slate-800 rounded-full transition-transform" style={{ backgroundColor: strokeColor, transform: `scale(${strokeWidth / 20})` }}></div>
             <input
               type="range"
               min="1"
               max="50"
               value={strokeWidth}
               onChange={(e) => setStrokeWidth(Number(e.target.value))}
               className="w-full h-2 bg-white/30 rounded-lg appearance-none cursor-pointer"
               aria-label={t('input.draw.size')}
             />
           </div>
        </div>

        <div className="flex items-center gap-4">
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
