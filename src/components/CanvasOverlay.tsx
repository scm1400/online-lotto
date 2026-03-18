import { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';

export interface CanvasOverlayHandle {
  getContext: () => CanvasRenderingContext2D | null;
  getCanvas: () => HTMLCanvasElement | null;
}

interface CanvasOverlayProps {
  width: number;
  height: number;
}

export const CanvasOverlay = forwardRef<CanvasOverlayHandle, CanvasOverlayProps>(
  function CanvasOverlay({ width, height }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useImperativeHandle(ref, () => ({
      getContext: () => canvasRef.current?.getContext('2d') ?? null,
      getCanvas: () => canvasRef.current,
    }));

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.scale(dpr, dpr);
    }, [width, height]);

    return (
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width,
          height,
          pointerEvents: 'auto',
          touchAction: 'none',
        }}
      />
    );
  },
);
