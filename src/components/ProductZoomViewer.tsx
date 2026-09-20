import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Maximize2, Move } from 'lucide-react';
import { cn } from '../lib/utils';

interface ProductZoomViewerProps {
  images: string[];
  activeImageIndex: number;
  onSelectImageIndex: (index: number) => void;
  title: string;
  onOpenFullscreen?: () => void;
}

export const ProductZoomViewer: React.FC<ProductZoomViewerProps> = ({
  images,
  activeImageIndex,
  onSelectImageIndex,
  title,
  onOpenFullscreen,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Zoom state: scale (1 to 3.5), pan offset in pixels
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  
  // Touch & Mouse tracking refs
  const dragStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const touchStartRef = useRef({ x: 0, y: 0, time: 0 });
  const hasMovedRef = useRef(false);
  const mouseStartRef = useRef({ x: 0, y: 0, time: 0 });
  const mouseMovedRef = useRef(false);
  const pinchStartRef = useRef<{ dist: number; scale: number }>({ dist: 0, scale: 1 });
  const lastTapRef = useRef<number>(0);
  const isPinchingRef = useRef<boolean>(false);

  const currentImage = images[activeImageIndex] || '';

  // Reset zoom when image changes
  useEffect(() => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  }, [activeImageIndex]);

  // Clamp pan within container bounds based on current scale
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
    const targetScale = Math.max(1, Math.min(3.5, Number(newScale.toFixed(2))));
    
    if (targetScale <= 1.05) {
      setScale(1);
      setPan({ x: 0, y: 0 });
      return;
    }

    if (focusPoint && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      // Calculate offset towards focus point
      const deltaX = (centerX - focusPoint.x) * (targetScale - 1) * 0.7;
      const deltaY = (centerY - focusPoint.y) * (targetScale - 1) * 0.7;
      
      const clamped = clampPan(deltaX, deltaY, targetScale);
      setScale(targetScale);
      setPan(clamped);
    } else {
      setScale(targetScale);
      setPan(prev => clampPan(prev.x, prev.y, targetScale));
    }
  }, [clampPan]);

  const handleResetZoom = () => {
    setScale(1);
    setPan({ x: 0, y: 0 });
  };

  const handleZoomIn = () => {
    handleZoomTo(scale + 0.75);
  };

  const handleZoomOut = () => {
    if (scale <= 1.7) {
      handleResetZoom();
    } else {
      handleZoomTo(scale - 0.75);
    }
  };

  // --- MOBILE / TOUCH EVENTS (Android & iPhone / iOS Safari) ---
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (scale <= 1) {
      if (e.touches.length === 1) {
        touchStartRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
          time: Date.now()
        };
        hasMovedRef.current = false;
      }
      return;
    }

    // Active zoom gestures
    if (e.touches.length === 2) {
      // Pinch gesture start
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
      
      // Double tap to reset
      const now = Date.now();
      if (now - lastTapRef.current < 320) {
        lastTapRef.current = 0;
        handleResetZoom();
        return;
      }
      lastTapRef.current = now;

      setIsDragging(true);
      dragStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        panX: pan.x,
        panY: pan.y
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (scale <= 1) {
      if (e.touches.length === 1) {
        const dist = Math.hypot(
          e.touches[0].clientX - touchStartRef.current.x,
          e.touches[0].clientY - touchStartRef.current.y
        );
        if (dist > 10) {
          hasMovedRef.current = true;
        }
      }
      return;
    }

    // While zoomed, lock default scroll to allow fluid pan/pinch
    if (e.touches.length === 2 && isPinchingRef.current) {
      if (e.cancelable) e.preventDefault();
      const currentDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const ratio = currentDist / (pinchStartRef.current.dist || 1);
      const newScale = Math.max(1, Math.min(3.5, pinchStartRef.current.scale * ratio));
      if (newScale <= 1.05) {
        handleResetZoom();
      } else {
        setScale(newScale);
        setPan(prev => clampPan(prev.x, prev.y, newScale));
      }
    } else if (e.touches.length === 1 && isDragging && scale > 1) {
      if (e.cancelable) e.preventDefault();
      const touch = e.touches[0];
      const deltaX = touch.clientX - dragStartRef.current.x;
      const deltaY = touch.clientY - dragStartRef.current.y;
      
      const newPanX = dragStartRef.current.panX + deltaX;
      const newPanY = dragStartRef.current.panY + deltaY;
      
      setPan(clampPan(newPanX, newPanY, scale));
    }
  };

  const handleTouchEnd = () => {
    if (scale <= 1) {
      const elapsed = Date.now() - touchStartRef.current.time;
      // Single tap on image activates zoom
      if (!hasMovedRef.current && elapsed < 400 && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const touchX = touchStartRef.current.x - rect.left;
        const touchY = touchStartRef.current.y - rect.top;
        handleZoomTo(2.4, { x: touchX, y: touchY });
      }
      return;
    }

    isPinchingRef.current = false;
    setIsDragging(false);
    if (scale <= 1.05) {
      handleResetZoom();
    } else {
      setPan(prev => clampPan(prev.x, prev.y, scale));
    }
  };

  // --- MOUSE EVENTS (PC Desktop) ---
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    mouseStartRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
    mouseMovedRef.current = false;

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
    const dist = Math.hypot(e.clientX - mouseStartRef.current.x, e.clientY - mouseStartRef.current.y);
    if (dist > 5) {
      mouseMovedRef.current = true;
    }

    if (isDragging && scale > 1) {
      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;
      setPan(clampPan(dragStartRef.current.panX + deltaX, dragStartRef.current.panY + deltaY, scale));
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(false);

    // If clicked without dragging
    if (!mouseMovedRef.current && (Date.now() - mouseStartRef.current.time < 350)) {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        if (scale <= 1) {
          // Touching or clicking activates zoom
          handleZoomTo(2.4, { x: clickX, y: clickY });
        }
      }
    }
  };

  // Double click for desktop
  const handleDoubleClick = () => {
    if (scale > 1) {
      handleResetZoom();
    }
  };

  // Mouse wheel zoom only when zoom is already activated
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (scale > 1) {
      e.preventDefault();
      const zoomDelta = e.deltaY < 0 ? 0.35 : -0.35;
      const newScale = Math.max(1, Math.min(3.5, scale + zoomDelta));
      
      if (newScale <= 1.05) {
        handleResetZoom();
        return;
      }

      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const focusX = e.clientX - rect.left;
        const focusY = e.clientY - rect.top;
        handleZoomTo(newScale, { x: focusX, y: focusY });
      } else {
        handleZoomTo(newScale);
      }
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#050505] select-none">
      {/* Zoomable Image Viewport Container */}
      <div 
        ref={containerRef}
        className={cn(
          "relative w-full h-80 sm:h-96 md:h-full min-h-[320px] md:min-h-[450px] overflow-hidden bg-black flex items-center justify-center select-none transition-colors",
          scale > 1 
            ? (isDragging ? "cursor-grabbing touch-none" : "cursor-grab touch-none") 
            : "cursor-zoom-in touch-pan-y"
        )}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => setIsDragging(false)}
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
              transition: isDragging || isPinchingRef.current ? 'none' : 'transform 0.22s cubic-bezier(0.2, 0, 0, 1)',
              willChange: 'transform',
            }}
            className="w-full h-full object-cover pointer-events-none select-none"
          />
        ) : (
          <div className="text-neutral-700 font-serif italic text-4xl opacity-20">
            JOYERÍA
          </div>
        )}

        {/* Subtle Legend: advises that image can be touched/clicked to view in detail */}
        {scale <= 1 && (
          <div className="absolute bottom-3.5 left-1/2 -translate-x-1/2 z-20 pointer-events-none transition-all duration-300">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/75 backdrop-blur-md border border-[#C5A059]/40 text-[11px] sm:text-xs text-neutral-200 shadow-xl tracking-wide select-none">
              <ZoomIn className="w-3.5 h-3.5 text-[#C5A059] shrink-0 animate-pulse" />
              <span className="font-light">Toca para ver en detalle</span>
            </div>
          </div>
        )}

        {/* Top-Left: Zoom Status Chip (only visible when zoom is active) */}
        {scale > 1 && (
          <div className="absolute top-2.5 left-2.5 sm:top-3.5 sm:left-3.5 z-20 flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-black/85 backdrop-blur-md border border-[#C5A059]/40 text-[10px] sm:text-[11px] text-neutral-200 shadow-xl pointer-events-none animate-fade-in">
            <ZoomIn className="w-3 h-3 text-[#C5A059] shrink-0" />
            <span className="font-mono font-medium text-[#C5A059]">{scale.toFixed(1)}x</span>
            <span className="text-neutral-400 hidden sm:inline">• Arrastra para explorar</span>
          </div>
        )}

        {/* Right Side: Zoom Tool Buttons positioned cleanly BELOW the modal close button */}
        {scale > 1 ? (
          <div className="absolute top-[62px] sm:top-[68px] right-2.5 sm:right-3.5 z-20 flex flex-col items-center gap-1.5 bg-black/85 backdrop-blur-md p-1.5 rounded-2xl border border-white/15 shadow-2xl animate-fade-in">
            {/* Exit / Reset Zoom */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleResetZoom();
              }}
              className="w-9 h-9 rounded-full bg-[#C5A059] text-black font-bold flex items-center justify-center shadow-md active:scale-90 hover:brightness-110 transition-all"
              title="Salir del zoom"
              aria-label="Salir del zoom"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Zoom In */}
            <button
              type="button"
              disabled={scale >= 3.5}
              onClick={(e) => {
                e.stopPropagation();
                handleZoomIn();
              }}
              className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center transition-all",
                scale >= 3.5 
                  ? "text-neutral-600 opacity-40 cursor-not-allowed" 
                  : "text-neutral-200 hover:text-white hover:bg-white/10 active:scale-90"
              )}
              title="Aumentar zoom"
              aria-label="Aumentar zoom"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            {/* Zoom Out */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleZoomOut();
              }}
              className="w-9 h-9 rounded-full flex items-center justify-center text-neutral-200 hover:text-white hover:bg-white/10 active:scale-90 transition-all"
              title="Reducir zoom"
              aria-label="Reducir zoom"
            >
              <ZoomOut className="w-4 h-4" />
            </button>

            {/* Fullscreen inside zoom toolbar */}
            {onOpenFullscreen && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenFullscreen();
                }}
                className="w-9 h-9 rounded-full flex items-center justify-center text-neutral-300 hover:text-white hover:bg-white/10 active:scale-90 transition-all border-t border-white/10 pt-1"
                title="Pantalla completa"
                aria-label="Pantalla completa"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          /* Subtle Fullscreen trigger placed right below the close button */
          onOpenFullscreen && (
            <div className="absolute top-[62px] sm:top-[68px] right-2.5 sm:right-3.5 z-20">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenFullscreen();
                }}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-black/80 backdrop-blur-md border border-white/20 hover:border-[#C5A059] text-neutral-300 hover:text-white flex items-center justify-center transition-all shadow-xl active:scale-95"
                title="Pantalla completa"
                aria-label="Pantalla completa"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          )
        )}

        {/* Mobile Swipe / Drag Hint when zoomed */}
        {scale > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none sm:hidden">
            <span className="text-[9px] uppercase tracking-wider text-neutral-400 bg-black/75 px-2.5 py-1 rounded-full backdrop-blur border border-white/10 flex items-center gap-1 shadow-lg">
              <Move className="w-3 h-3 text-[#C5A059]" />
              Arrastra para mover
            </span>
          </div>
        )}
      </div>

      {/* Thumbnails row (Optimized for iPhone / Android touch scrolling) */}
      {images.length > 1 && (
        <div className="p-2.5 sm:p-3 bg-[#0a0a0a] border-t border-[#1a1a1a] flex items-center gap-2 overflow-x-auto scrollbar-hide touch-pan-x">
          {images.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onSelectImageIndex(i)}
              className={cn(
                "w-12 h-12 sm:w-14 sm:h-14 rounded-md overflow-hidden border-2 transition-all flex-shrink-0 bg-black active:scale-95",
                activeImageIndex === i 
                  ? "border-[#C5A059] ring-1 ring-[#C5A059]/40 scale-105 shadow-md" 
                  : "border-[#242424] opacity-50 hover:opacity-100"
              )}
            >
              <img src={img} alt={`Vista ${i + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
          <span className="text-[10px] text-neutral-500 uppercase tracking-widest pl-1 whitespace-nowrap">
            {activeImageIndex + 1} / {images.length}
          </span>
        </div>
      )}
    </div>
  );
};
