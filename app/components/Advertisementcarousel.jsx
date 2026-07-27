"use client";

import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const SLIDE_DURATION = 4000;

// One slide per seller's ad, auto-advancing through that ad's own images
// underneath. Dash indicators + a fill bar live BELOW the image, not on top of it.
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

  if (loading || !ads.length) return null; // nothing active — homepage just skips this section

  const ad = ads[activeAd];
  const img = ad.images[activeImg] || ad.images[0];

  const goTo = (adIndex) => {
    clearInterval(timerRef.current);
    goToSlide(adIndex, 0, adIndex > activeAd ? 1 : -1);
  };
  const prev = () => {
    clearInterval(timerRef.current);
    goToSlide((activeAd - 1 + ads.length) % ads.length, 0, -1);
  };
  const next = () => {
    clearInterval(timerRef.current);
    goToSlide((activeAd + 1) % ads.length, 0, 1);
  };

  return (
    <div className="rounded-2xl overflow-hidden shadow-md shadow-purple-100 border border-purple-100 group">
      {/* image area */}
      <div className="relative">
        <a href={ad.linkUrl || '#'} className="block relative aspect-[2/1] sm:aspect-[3/1] max-h-[180px] sm:max-h-[260px] bg-gray-100 overflow-hidden">
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

        {ads.length > 1 && (
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

      {/* dash indicators + fill bar, below the image */}
      {ads.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 py-2.5 bg-white">
          {ads.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className="relative h-1 w-6 rounded-full bg-purple-100 overflow-hidden"
              aria-label={`Go to slide ${i + 1}`}
            >
              {i === activeAd ? (
                <span
                  key={`${activeAd}-${activeImg}-bar`}
                  className="absolute inset-y-0 left-0 bg-purple-600 rounded-full progress-fill"
                  style={{ animationDuration: `${SLIDE_DURATION}ms` }}
                />
              ) : i < activeAd ? (
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