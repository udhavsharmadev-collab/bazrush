"use client";

import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// One slide per seller's ad, auto-advancing through that ad's own images
// underneath, with a smooth sliding transition between slides.
const AdvertisementCarousel = () => {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeAd, setActiveAd] = useState(0);
  const [activeImg, setActiveImg] = useState(0);
  const [prevSlide, setPrevSlide] = useState(null); // { img } sliding out
  const [direction, setDirection] = useState(1); // 1 = forward (next), -1 = backward (prev)
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
    }, 4000);
    return () => clearInterval(timerRef.current);
  }, [ads, activeAd, activeImg]);

  if (loading || !ads.length) return null; // nothing active — homepage just skips this section

  const ad = ads[activeAd];
  const img = ad.images[activeImg] || ad.images[0];

  const goTo = (adIndex) => goToSlide(adIndex, 0, adIndex > activeAd ? 1 : -1);
  const prev = () => goToSlide((activeAd - 1 + ads.length) % ads.length, 0, -1);
  const next = () => goToSlide((activeAd + 1) % ads.length, 0, 1);

  return (
    <div className="relative rounded-2xl overflow-hidden shadow-md shadow-purple-100 border border-purple-100 group">
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
          <div className="absolute bottom-2 right-3 flex gap-1 z-10">
            {ads.map((_, i) => (
              <span key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === activeAd ? 'bg-white w-3' : 'bg-white/40'}`} />
            ))}
          </div>
        </>
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
        .slide-in {
          animation: slideInFromRight 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        .slide-out {
          animation: slideOutToLeft 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
      `}</style>
    </div>
  );
};

export default AdvertisementCarousel;