
import React, { useRef, useEffect, useImperativeHandle, forwardRef, useState, useCallback } from 'react';

interface DrawingCanvasProps {
  strokeColor?: string;
  strokeWidth?: number;
  onDrawStart?: () => void;
}

export interface DrawingCanvasRef {
  clear: () => void;
  toDataURL: (type?: string, quality?: any) => string;
  isEmpty: () => boolean;
}

const DrawingCanvas = forwardRef<DrawingCanvasRef, DrawingCanvasProps>(
  ({ strokeColor = '#334155', strokeWidth = 3, onDrawStart }, ref) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [isEmpty, setIsEmpty] = useState(true);

    const getCoords = useCallback((event: MouseEvent | TouchEvent): { x: number, y: number } | null => {
      if (!canvasRef.current) return null;
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      let clientX, clientY;

      if (event instanceof MouseEvent) {
          clientX = event.clientX;
          clientY = event.clientY;
      } else if (event.touches && event.touches[0]) {
          clientX = event.touches[0].clientX;
          clientY = event.touches[0].clientY;
      } else {
          return null;
      }
      
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      return {
          x: (clientX - rect.left) * scaleX,
          y: (clientY - rect.top) * scaleY,
      };
    }, []);

    const startDrawing = useCallback((event: MouseEvent | TouchEvent) => {
      event.preventDefault();
      const coords = getCoords(event);
      if (!coords) return;
      
      const ctx = canvasRef.current?.getContext('2d');
      if (!ctx) return;
      
      onDrawStart?.();
      setIsDrawing(true);
      if(isEmpty) setIsEmpty(false);
      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);
    }, [getCoords, isEmpty, onDrawStart]);

    const draw = useCallback((event: MouseEvent | TouchEvent) => {
      if (!isDrawing) return;
      event.preventDefault();
      const coords = getCoords(event);
      if (!coords) return;

      const ctx = canvasRef.current?.getContext('2d');
      if (!ctx) return;

      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
    }, [isDrawing, getCoords]);

    const stopDrawing = useCallback(() => {
      if (!isDrawing) return;
      const ctx = canvasRef.current?.getContext('2d');
      if (!ctx) return;
      ctx.closePath();
      setIsDrawing(false);
    }, [isDrawing]);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }, [strokeColor, strokeWidth]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        canvas.addEventListener('mousedown', startDrawing);
        canvas.addEventListener('mousemove', draw);
        canvas.addEventListener('mouseup', stopDrawing);
        canvas.addEventListener('mouseleave', stopDrawing);
        canvas.addEventListener('touchstart', startDrawing, { passive: false });
        canvas.addEventListener('touchmove', draw, { passive: false });
        canvas.addEventListener('touchend', stopDrawing);

        return () => {
            canvas.removeEventListener('mousedown', startDrawing);
            canvas.removeEventListener('mousemove', draw);
            canvas.removeEventListener('mouseup', stopDrawing);
            canvas.removeEventListener('mouseleave', stopDrawing);
            canvas.removeEventListener('touchstart', startDrawing);
            canvas.removeEventListener('touchmove', draw);
            canvas.removeEventListener('touchend', stopDrawing);
        };
    }, [draw, startDrawing, stopDrawing]);
    
    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        const resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                const { width, height } = entry.contentRect;
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.strokeStyle = strokeColor;
                    ctx.lineWidth = strokeWidth;
                    ctx.lineCap = 'round';
                    ctx.lineJoin = 'round';
                }
            }
        });

        resizeObserver.observe(container);
        return () => resizeObserver.disconnect();
    }, [strokeColor, strokeWidth]);


    useImperativeHandle(ref, () => ({
      clear: () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setIsEmpty(true);
      },
      toDataURL: (type = 'image/png', quality = 1.0) => {
        const canvas = canvasRef.current;
        if (!canvas || isEmpty) return '';
        return canvas.toDataURL(type, quality);
      },
      isEmpty: () => isEmpty,
    }));

    return (
      <div ref={containerRef} className="w-full h-full">
          <canvas
            ref={canvasRef}
            className="bg-white rounded-lg cursor-crosshair touch-none w-full h-full"
          />
      </div>
    );
  }
);

export default DrawingCanvas;
