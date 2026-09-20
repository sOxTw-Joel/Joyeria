import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, ChevronLeft, ChevronRight, Move } from 'lucide-react';
import { cn } from '../lib/utils';

interface ProductFullscreenLightboxProps {
  images: string[];
  initialIndex?: number;
  title: string;
  onClose: () => void;
}

export const ProductFullscreenLightbox: React.FC<ProductFullscreenLightboxProps> = ({
  images,
  initialIndex = 0,
  title,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const pinchStartRef = useRef<{ dist: number; scale: number }>({ dist: 0, scale: 1 });
  const lastTapRef = useRef<number>(0);
  const isPinchingRef = useRef<boolean>(false);

  const currentImage = images[currentIndex] || '';

  // Reset zoom on index change
  useEffect(() => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  }, [currentIndex]);

  // Lock body scroll while lightbox is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const clampPan = useCallback((newPanX: number, newPanY: number, currentScale: number) => {
    if (!containerRef.current || currentScale <= 1) {
      return { x: 0, y: 0 };
    }
    const rect = containerRef.current.getBoundingClientRect();
    const maxPanX = (rect.width * (currentScale - 1)) / 2;
    const maxPanY = (rect.height * (currentScale - 1)) / 2;

    return {
      x: Math.max(-maxPanX, Math.min(maxPanX, newPanX)),
      y: Math.max(-maxPanY, Math.min(maxPanY, newPanY))
    };
  }, []);

  const handleZoomTo = useCallback((newScale: number, focusPoint?: { x: number; y: number }) => {
    const targetScale = Math.max(1, Math.min(4, Number(newScale.toFixed(2))));
    
    if (targetScale === 1) {
      setScale(1);
      setPan({ x: 0, y: 0 });
      return;
    }

    if (focusPoint && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const deltaX = (centerX - focusPoint.x) * (targetScale - 1) * 0.7;
      const deltaY = (centerY - focusPoint.y) * (targetScale - 1) * 0.7;
      
      setScale(targetScale);
      setPan(clampPan(deltaX, deltaY, targetScale));
    } else {
      setScale(targetScale);
      setPan(prev => clampPan(prev.x, prev.y, targetScale));
    }
  }, [clampPan]);

  const handleResetZoom = () => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      isPinchingRef.current = true;
      setIsDragging(false);
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      pinchStartRef.current = { dist, scale };
    } else if (e.touches.length === 1) {
      isPinchingRef.current = false;
      const touch = e.touches[0];
      const now = Date.now();
      
      // Double tap to toggle zoom
      if (now - lastTapRef.current < 320) {
        lastTapRef.current = 0;
        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          const touchX = touch.clientX - rect.left;
          const touchY = touch.clientY - rect.top;
          
          if (scale > 1.2) {
            handleResetZoom();
          } else {
            handleZoomTo(2.5, { x: touchX, y: touchY });
          }
        }
        return;
      }
      lastTapRef.current = now;

      if (scale > 1) {
        setIsDragging(true);
        dragStartRef.current = {
          x: touch.clientX,
          y: touch.clientY,
          panX: pan.x,
          panY: pan.y
        };
      }
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2 && isPinchingRef.current) {
      if (e.cancelable) e.preventDefault();
      const currentDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const ratio = currentDist / (pinchStartRef.current.dist || 1);
      const newScale = Math.max(1, Math.min(4, pinchStartRef.current.scale * ratio));
      setScale(newScale);
      setPan(prev => clampPan(prev.x, prev.y, newScale));
    } else if (e.touches.length === 1 && isDragging && scale > 1) {
      if (e.cancelable) e.preventDefault();
      const touch = e.touches[0];
      const deltaX = touch.clientX - dragStartRef.current.x;
      const deltaY = touch.clientY - dragStartRef.current.y;
      setPan(clampPan(dragStartRef.current.panX + deltaX, dragStartRef.current.panY + deltaY, scale));
    }
  };

  const handleTouchEnd = () => {
    isPinchingRef.current = false;
    setIsDragging(false);
    if (scale <= 1) setPan({ x: 0, y: 0 });
    else setPan(prev => clampPan(prev.x, prev.y, scale));
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (scale > 1) {
      setIsDragging(true);
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        panX: pan.x,
        panY: pan.y
      };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging && scale > 1) {
      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;
      setPan(clampPan(dragStartRef.current.panX + deltaX, dragStartRef.current.panY + deltaY, scale));
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      if (scale > 1.2) handleResetZoom();
      else handleZoomTo(2.5, { x: clickX, y: clickY });
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const zoomDelta = e.deltaY < 0 ? 0.3 : -0.3;
    const newScale = Math.max(1, Math.min(4, scale + zoomDelta));
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const focusX = e.clientX - rect.left;
      const focusY = e.clientY - rect.top;
      handleZoomTo(newScale, { x: focusX, y: focusY });
    } else {
      handleZoomTo(newScale);
    }
  };

  const handlePrev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex(prev => (prev < images.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col backdrop-blur-md select-none touch-none pb-[calc(env(safe-area-inset-bottom)+0.5rem)] pt-[calc(env(safe-area-inset-top)+0.5rem)]">
      {/* Top Header */}
      <div className="flex justify-between items-center px-4 py-3 border-b border-[#222] z-30">
        <div className="flex flex-col">
          <span className="text-[#C5A059] font-serif text-sm sm:text-base italic truncate max-w-[240px] sm:max-w-md">
            {title}
          </span>
          <span className="text-[10px] uppercase tracking-widest text-neutral-400">
            {images.length > 1 ? `Foto ${currentIndex + 1} de ${images.length} • Zoom Detallado` : 'Zoom Detallado'}
          </span>
        </div>

        <button 
          onClick={onClose}
          className="min-w-[44px] min-h-[44px] rounded-full bg-[#161616] border border-[#333] hover:border-[#C5A059] text-neutral-300 hover:text-white flex items-center justify-center transition-colors active:scale-95"
          aria-label="Cerrar vista completa"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Viewport */}
      <div 
        ref={containerRef}
        className={cn(
          "flex-1 w-full h-full relative overflow-hidden flex items-center justify-center cursor-zoom-in",
          scale > 1 ? (isDragging ? "cursor-grabbing" : "cursor-grab") : "cursor-zoom-in"
        )}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        onWheel={handleWheel}
      >
        {currentImage ? (
          <img 
            src={currentImage} 
            alt={title}
            draggable={false}
            style={{
              transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${scale})`,
              transition: isDragging || isPinchingRef.current ? 'none' : 'transform 0.2s cubic-bezier(0.2, 0, 0, 1)',
              willChange: 'transform',
            }}
            className="max-h-[82vh] max-w-[95vw] object-contain select-none pointer-events-none"
          />
        ) : (
          <div className="text-neutral-700 font-serif italic text-4xl opacity-20">JOYERÍA</div>
        )}

        {/* Previous Button (if multiple images) */}
        {images.length > 1 && (
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 min-w-[44px] min-h-[44px] rounded-full bg-black/70 border border-white/20 text-white flex items-center justify-center hover:bg-black/90 active:scale-90 transition-all backdrop-blur"
            aria-label="Imagen anterior"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Next Button (if multiple images) */}
        {images.length > 1 && (
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 min-w-[44px] min-h-[44px] rounded-full bg-black/70 border border-white/20 text-white flex items-center justify-center hover:bg-black/90 active:scale-90 transition-all backdrop-blur"
            aria-label="Imagen siguiente"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Bottom Control Bar */}
      <div className="p-3 bg-black/80 border-t border-[#1c1c1c] flex items-center justify-center gap-3 z-30">
        <div className="flex items-center gap-1.5 bg-[#141414] px-3 py-1.5 rounded-full border border-white/10 shadow-lg">
          <button
            type="button"
            disabled={scale <= 1}
            onClick={() => handleZoomTo(scale - 0.75)}
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center",
              scale <= 1 ? "text-neutral-600 opacity-40 cursor-not-allowed" : "text-white hover:bg-white/10 active:scale-90"
            )}
            title="Reducir"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => (scale > 1 ? handleResetZoom() : handleZoomTo(2.5))}
            className={cn(
              "px-3 py-1 rounded-full text-xs font-mono tracking-wider flex items-center gap-1 transition-colors",
              scale > 1 ? "bg-[#C5A059] text-black font-bold" : "bg-white/10 text-neutral-300 hover:text-white"
            )}
          >
            {scale > 1 && <RotateCcw className="w-3 h-3" />}
            <span>{scale > 1 ? `${scale.toFixed(1)}x` : 'Zoom 2.5x'}</span>
          </button>

          <button
            type="button"
            disabled={scale >= 4}
            onClick={() => handleZoomTo(scale + 0.75)}
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center",
              scale >= 4 ? "text-neutral-600 opacity-40 cursor-not-allowed" : "text-white hover:bg-white/10 active:scale-90"
            )}
            title="Aumentar"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          {scale > 1 && (
            <div className="flex items-center pl-2 border-l border-neutral-700 text-[11px] text-neutral-400 gap-1">
              <Move className="w-3 h-3 text-[#C5A059]" />
              <span className="hidden sm:inline">Arrastra para explorar</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
