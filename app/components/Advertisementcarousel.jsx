"use client";

import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const SLIDE_DURATION = 4000;

const AdvertisementCarousel = () => {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeAd, setActiveAd] = useState(0);
  const [activeImg, setActiveImg] = useState(0);
  const [prevSlide, setPrevSlide] = useState(null);
  const [direction, setDirection] = useState(1);
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

  return (
    // Outer wrapper has NO border/background — just groups the two pieces vertically
    <div className="group">
      {/* image box — its own rounded border, contains ONLY the image + arrows */}
      <div className="relative rounded-2xl overflow-hidden shadow-md shadow-purple-100 border border-purple-100">
        <a href={ad.linkUrl || '#'} className="block w-full relative aspect-[2/1] sm:aspect-[3/1] bg-gray-100 overflow-hidden">
          {prevSlide && (
            <img
              key={`prev-${prevSlide.img.imageId}`}
              src={prevSlide.img.imageId}
              alt=""
              className="absolute inset-0 w-full h-full object-cover slide-out"
              style={{ '--dir': direction }}
            />
          )}
          <img
            key={`${activeAd}-${activeImg}`}
            src={img.imageId}
            alt={ad.title || 'Featured shop'}
            className={`absolute inset-0 w-full h-full object-cover ${prevSlide ? 'slide-in' : ''}`}
            style={{ '--dir': direction }}
          />
        </a>

        {ad.title && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 pointer-events-none">
            <p className="text-white font-medium text-sm sm:text-base">{ad.title}</p>
          </div>
        )}

        {hasMultipleSlides && (
          <>
            <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/80 opacity-0 group-hover:opacity-100 transition-opacity z-10">
              <ChevronLeft className="w-4 h-4 text-purple-700" />
            </button>
            <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/80 opacity-0 group-hover:opacity-100 transition-opacity z-10">
              <ChevronRight className="w-4 h-4 text-purple-700" />
            </button>
          </>
        )}
      </div>

      {/* dash indicators + fill bar — completely separate block below the image box, no shared border/background */}
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