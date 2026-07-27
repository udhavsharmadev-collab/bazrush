"use client";

import { useEffect, useRef, useState } from 'react';

const SLIDE_DURATION = 4000;
const SWIPE_THRESHOLD = 50; // px needed to trigger a slide change

const AdvertisementCarousel = () => {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeAd, setActiveAd] = useState(0);
  const [activeImg, setActiveImg] = useState(0);
  const [prevSlide, setPrevSlide] = useState(null);
  const [direction, setDirection] = useState(1);
  const timerRef = useRef(null);
  const slideTimeoutRef = useRef(null);

  // drag state
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const pointerActive = useRef(false);

  useEffect(() => {
    fetch('/api/advertisement')
      .then((res) => res.json())
      .then((data) => { if (data.ads) setAds(data.ads); })
      .finally(() => setLoading(false));
  }, []);

  const goToSlide = (nextAd, nextImg, dir) => {
    if (!ads.length) return;
    const currentImg = ads[activeAd]?.images?.[activeImg] || ads[activeAd]?.images?.[0];
    setDirection(dir);
    setPrevSlide({ img: currentImg });
    setActiveAd(nextAd);
    setActiveImg(nextImg);

    clearTimeout(slideTimeoutRef.current);
    slideTimeoutRef.current = setTimeout(() => setPrevSlide(null), 500);
  };

  useEffect(() => {
    if (!ads.length) return;
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const currentAdImages = ads[activeAd]?.images || [];
      if (activeImg < currentAdImages.length - 1) {
        goToSlide(activeAd, activeImg + 1, 1);
      } else {
        goToSlide((activeAd + 1) % ads.length, 0, 1);
      }
    }, SLIDE_DURATION);
    return () => clearInterval(timerRef.current);
  }, [ads, activeAd, activeImg]);

  if (loading || !ads.length) return null;

  const ad = ads[activeAd];
  const adImages = ad.images || [];
  const img = adImages[activeImg] || adImages[0];

  const hasMultipleSlides = ads.length > 1 || adImages.length > 1;

  const goToImg = (imgIndex) => {
    clearInterval(timerRef.current);
    goToSlide(activeAd, imgIndex, imgIndex > activeImg ? 1 : -1);
  };

  const prev = () => {
    clearInterval(timerRef.current);
    if (activeImg > 0) {
      goToSlide(activeAd, activeImg - 1, -1);
    } else {
      const prevAd = (activeAd - 1 + ads.length) % ads.length;
      const prevAdImages = ads[prevAd]?.images || [];
      goToSlide(prevAd, Math.max(prevAdImages.length - 1, 0), -1);
    }
  };

  const next = () => {
    clearInterval(timerRef.current);
    if (activeImg < adImages.length - 1) {
      goToSlide(activeAd, activeImg + 1, 1);
    } else {
      goToSlide((activeAd + 1) % ads.length, 0, 1);
    }
  };

  // ── Swipe / drag handlers (pointer events cover touch + mouse) ──
  const handlePointerDown = (e) => {
    if (!hasMultipleSlides) return;
    pointerActive.current = true;
    dragStartX.current = e.clientX;
    setIsDragging(true);
    clearInterval(timerRef.current);
  };

  const handlePointerMove = (e) => {
    if (!pointerActive.current) return;
    setDragX(e.clientX - dragStartX.current);
  };

  const endDrag = () => {
    if (!pointerActive.current) return;
    pointerActive.current = false;
    setIsDragging(false);

    if (dragX <= -SWIPE_THRESHOLD) {
      next();
    } else if (dragX >= SWIPE_THRESHOLD) {
      prev();
    }
    setDragX(0);
  };

  return (
    <div className="group">
      {/* image box */}
      <div className="relative rounded-2xl overflow-hidden shadow-md shadow-purple-100 border border-purple-100">
        
          href={!isDragging ? (ad.linkUrl || '#') : undefined}
          onClick={(e) => { if (isDragging || Math.abs(dragX) > 5) e.preventDefault(); }}
          className="block w-full relative aspect-[2/1] sm:aspect-[3/1] bg-gray-100 overflow-hidden select-none touch-pan-y cursor-grab active:cursor-grabbing"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
          onPointerLeave={endDrag}
          onPointerCancel={endDrag}
        >
          {prevSlide && (
            <img
              key={`prev-${prevSlide.img.imageId}`}
              src={prevSlide.img.imageId}
              alt=""
              draggable={false}
              className="absolute inset-0 w-full h-full object-cover slide-out"
              style={{ '--dir': direction }}
            />
          )}
          <img
            key={`${activeAd}-${activeImg}`}
            src={img.imageId}
            alt={ad.title || 'Featured shop'}
            draggable={false}
            className={`absolute inset-0 w-full h-full object-cover ${prevSlide ? 'slide-in' : ''}`}
            style={{
              '--dir': direction,
              transform: isDragging ? `translateX(${dragX}px)` : undefined,
              transition: isDragging ? 'none' : undefined,
            }}
          />
        </a>

        {ad.title && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 pointer-events-none">
            <p className="text-white font-medium text-sm sm:text-base">{ad.title}</p>
          </div>
        )}
      </div>

      {/* dash indicators + fill bar */}
      {hasMultipleSlides && (
        <div className="flex items-center justify-center gap-1.5 pt-3">
          {adImages.map((_, i) => (
            <button
              key={i}
              onClick={() => goToImg(i)}
              className="relative h-1 w-6 rounded-full bg-purple-100 overflow-hidden"
              aria-label={`Go to image ${i + 1}`}
            >
              {i === activeImg ? (
                <span
                  key={`${activeAd}-${activeImg}-bar`}
                  className="absolute inset-y-0 left-0 bg-purple-600 rounded-full progress-fill"
                  style={{ animationDuration: `${SLIDE_DURATION}ms` }}
                />
              ) : i < activeImg ? (
                <span className="absolute inset-0 bg-purple-300 rounded-full" />
              ) : null}
            </button>
          ))}
        </div>
      )}

      <style jsx>{`
        @keyframes slideInFromRight {
          from { transform: translateX(calc(100% * var(--dir))); }
          to { transform: translateX(0); }
        }
        @keyframes slideOutToLeft {
          from { transform: translateX(0); }
          to { transform: translateX(calc(-100% * var(--dir))); }
        }
        @keyframes fillBar {
          from { width: 0%; }
          to { width: 100%; }
        }
        .slide-in {
          animation: slideInFromRight 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        .slide-out {
          animation: slideOutToLeft 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
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