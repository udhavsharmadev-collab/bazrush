"use client";

import { useEffect, useRef, useState } from 'react';

const SLIDE_DURATION = 4000;
const DRAG_THRESHOLD = 50; // px to trigger a slide change

const AdvertisementCarousel = () => {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeAd, setActiveAd] = useState(0);
  const [activeImg, setActiveImg] = useState(0);
  const [prevSlide, setPrevSlide] = useState(null);
  const [direction, setDirection] = useState(1);

  // drag state
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const draggingRef = useRef(false);

  const timerRef = useRef(null);
  const slideTimeoutRef = useRef(null);

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

  // ---- drag handlers ----
  const handlePointerDown = (e) => {
    if (!hasMultipleSlides) return;
    clearInterval(timerRef.current);
    draggingRef.current = true;
    setIsDragging(true);
    dragStartX.current = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    setDragX(0);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!draggingRef.current) return;
    const clientX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
    setDragX(clientX - dragStartX.current);
  };

  const handlePointerUp = () => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setIsDragging(false);

    if (dragX <= -DRAG_THRESHOLD) {
      next();
    } else if (dragX >= DRAG_THRESHOLD) {
      prev();
    }
    setDragX(0);
  };

  return (
    <div className="group">
      <div
        className="relative rounded-2xl overflow-hidden shadow-md shadow-purple-100 border border-purple-100 select-none touch-pan-y cursor-grab active:cursor-grabbing"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <a
          href={ad.linkUrl || '#'}
          onClickCapture={(e) => { if (Math.abs(dragX) > 5 || isDragging) e.preventDefault(); }}
          className="block w-full relative aspect-[2/1] sm:aspect-[3/1] bg-gray-100 overflow-hidden"
        >
          {prevSlide && (
            <img
              key={`prev-${prevSlide.img.imageId}`}
              src={prevSlide.img.imageId}
              alt=""
              className="absolute inset-0 w-full h-full object-cover slide-out"
              style={{ '--dir': direction }}
              draggable={false}
            />
          )}
          <img
            key={`${activeAd}-${activeImg}`}
            src={img.imageId}
            alt={ad.title || 'Featured shop'}
            className={`absolute inset-0 w-full h-full object-cover ${prevSlide ? 'slide-in' : ''}`}
            style={{
              '--dir': direction,
              transform: isDragging ? `translateX(${dragX}px)` : undefined,
              transition: isDragging ? 'none' : 'transform 0.25s ease',
            }}
            draggable={false}
          />
        </a>

        {ad.title && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 pointer-events-none">
            <p className="text-white font-medium text-sm sm:text-base">{ad.title}</p>
          </div>
        )}
      </div>

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