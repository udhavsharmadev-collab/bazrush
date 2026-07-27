"use client";

import { useEffect, useRef, useState, useMemo } from 'react';

const SLIDE_DURATION = 4000;
const DRAG_THRESHOLD_RATIO = 0.18; // fraction of width needed to trigger a slide change
const SETTLE_MS = 320;

const AdvertisementCarousel = () => {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);

  // flat list of every image across every ad, so dragging just moves along one line
  const slides = useMemo(() => {
    const flat = [];
    ads.forEach((ad, adIndex) => {
      (ad.images || []).forEach((image, imgIndex) => {
        flat.push({ adIndex, imgIndex, image, ad });
      });
    });
    return flat;
  }, [ads]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isSettling, setIsSettling] = useState(false); // true while the release animation plays
  const [settleTarget, setSettleTarget] = useState(0); // -1 = go prev, 0 = snap back, 1 = go next

  const dragStartX = useRef(0);
  const draggingRef = useRef(false);
  const containerRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    fetch('/api/advertisement')
      .then((res) => res.json())
      .then((data) => { if (data.ads) setAds(data.ads); })
      .finally(() => setLoading(false));
  }, []);

  const hasMultipleSlides = slides.length > 1;

  const startTimer = () => {
    clearInterval(timerRef.current);
    if (!hasMultipleSlides) return;
    timerRef.current = setInterval(() => {
      goNext();
    }, SLIDE_DURATION);
  };

  // (re)start the autoplay timer whenever the active slide settles
  useEffect(() => {
    startTimer();
    return () => clearInterval(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, hasMultipleSlides]);

  if (loading || !slides.length) return null;

  const mod = (n, m) => ((n % m) + m) % m;

  const goNext = () => {
    setSettleTarget(1);
    setIsSettling(true);
  };

  const goPrev = () => {
    setSettleTarget(-1);
    setIsSettling(true);
  };

  const goToIndex = (targetIndex) => {
    if (targetIndex === currentIndex) return;
    clearInterval(timerRef.current);
    setSettleTarget(targetIndex > currentIndex ? 1 : -1);
    setIsSettling(true);
  };

  // called when the settle transition finishes (whether it moved or snapped back)
  const handleTransitionEnd = () => {
    if (!isSettling) return;
    if (settleTarget !== 0) {
      setCurrentIndex((i) => mod(i + settleTarget, slides.length));
    }
    setIsSettling(false);
    setSettleTarget(0);
    setDragX(0);
  };

  // ---- drag handlers ----
  const handlePointerDown = (e) => {
    if (!hasMultipleSlides || isSettling) return;
    clearInterval(timerRef.current);
    draggingRef.current = true;
    setIsDragging(true);
    dragStartX.current = e.clientX;
    setDragX(0);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!draggingRef.current) return;
    setDragX(e.clientX - dragStartX.current);
  };

  const handlePointerUp = () => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setIsDragging(false);

    const width = containerRef.current?.offsetWidth || 1;
    const ratio = dragX / width;

    if (ratio <= -DRAG_THRESHOLD_RATIO) {
      setSettleTarget(1);
    } else if (ratio >= DRAG_THRESHOLD_RATIO) {
      setSettleTarget(-1);
    } else {
      setSettleTarget(0);
    }
    setIsSettling(true);
  };

  const prevIndex = mod(currentIndex - 1, slides.length);
  const nextIndex = mod(currentIndex + 1, slides.length);

  const current = slides[currentIndex];
  const prevSlide = slides[prevIndex];
  const nextSlide = slides[nextIndex];

  // resting position keeps "current" centered at -100%; settling drives the track
  // fully to -200% (next) or 0% (prev) so the swipe finishes instead of snapping
  const finalTransform = isSettling
    ? `translateX(${-100 + settleTarget * 100 * -1}%)`
    : `translateX(calc(-100% + ${dragX}px))`;

  const renderSlide = (slide, key) => (
    <a
      key={key}
      href={slide.ad.linkUrl || '#'}
      onClick={(e) => { if (isDragging || Math.abs(dragX) > 5) e.preventDefault(); }}
      className="relative block w-full h-full flex-shrink-0 bg-gray-100 overflow-hidden"
      style={{ width: '100%' }}
      draggable={false}
    >
      <img
        src={slide.image.imageId}
        alt={slide.ad.title || 'Featured shop'}
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />
      {slide.ad.title && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 pointer-events-none">
          <p className="text-white font-medium text-sm sm:text-base">{slide.ad.title}</p>
        </div>
      )}
    </a>
  );

  // current-ad dot indicators (reset per ad, matching the previous behavior)
  const dotImages = current.ad.images || [];

  return (
    <div className="group">
      <div
        ref={containerRef}
        className="relative rounded-2xl overflow-hidden shadow-md shadow-purple-100 border border-purple-100 select-none touch-pan-y cursor-grab active:cursor-grabbing"
      >
        <div
          className="relative w-full aspect-[2/1] sm:aspect-[3/1] overflow-hidden"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <div
            className="flex h-full"
            style={{
              width: '300%',
              transform: finalTransform,
              transition: isDragging ? 'none' : `transform ${SETTLE_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`,
            }}
            onTransitionEnd={handleTransitionEnd}
          >
            <div className="w-1/3 h-full flex-shrink-0">{renderSlide(prevSlide, 'prev')}</div>
            <div className="w-1/3 h-full flex-shrink-0">{renderSlide(current, 'current')}</div>
            <div className="w-1/3 h-full flex-shrink-0">{renderSlide(nextSlide, 'next')}</div>
          </div>
        </div>
      </div>

      {hasMultipleSlides && (
        <div className="flex items-center justify-center gap-1.5 pt-3">
          {dotImages.map((_, i) => {
            const flatTarget = slides.findIndex((s) => s.adIndex === current.adIndex && s.imgIndex === i);
            return (
              <button
                key={i}
                onClick={() => goToIndex(flatTarget)}
                className="relative h-1 w-6 rounded-full bg-purple-100 overflow-hidden"
                aria-label={`Go to image ${i + 1}`}
              >
                {i === current.imgIndex ? (
                  <span
                    key={`${currentIndex}-bar`}
                    className="absolute inset-y-0 left-0 bg-purple-600 rounded-full progress-fill"
                    style={{ animationDuration: `${SLIDE_DURATION}ms` }}
                  />
                ) : i < current.imgIndex ? (
                  <span className="absolute inset-0 bg-purple-300 rounded-full" />
                ) : null}
              </button>
            );
          })}
        </div>
      )}

      <style jsx>{`
        @keyframes fillBar {
          from { width: 0%; }
          to { width: 100%; }
        }
        .progress-fill {
          width: 0%;
          animation-name: fillBar;
          animation-timing-function: linear;
          animation-fill-mode: forwards;
        }
      `}</style>
    </div>
  );
};

export default AdvertisementCarousel;