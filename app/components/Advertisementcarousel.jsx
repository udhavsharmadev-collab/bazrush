"use client";

import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// One slide per seller's ad, auto-advancing through that ad's own images
// underneath, with a soft crossfade between slides.
const AdvertisementCarousel = () => {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeAd, setActiveAd] = useState(0);
  const [activeImg, setActiveImg] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    fetch('/api/advertisement')
      .then((res) => res.json())
      .then((data) => { if (data.ads) setAds(data.ads); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!ads.length) return;
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setActiveImg((prevImg) => {
        const currentAdImages = ads[activeAd]?.images || [];
        if (prevImg < currentAdImages.length - 1) return prevImg + 1;
        setActiveAd((prevAd) => (prevAd + 1) % ads.length);
        return 0;
      });
    }, 4000);
    return () => clearInterval(timerRef.current);
  }, [ads, activeAd]);

  if (loading || !ads.length) return null; // nothing active — homepage just skips this section

  const ad = ads[activeAd];
  const img = ad.images[activeImg] || ad.images[0];

  const goTo = (adIndex) => { setActiveAd(adIndex); setActiveImg(0); };
  const prev = () => goTo((activeAd - 1 + ads.length) % ads.length);
  const next = () => goTo((activeAd + 1) % ads.length);

  return (
    <div className="relative rounded-2xl overflow-hidden shadow-md shadow-purple-100 border border-purple-100 group">
      <a href={ad.linkUrl || '#'} className="block aspect-[16/7] sm:aspect-[21/7] bg-gray-100">
        <img
          key={`${activeAd}-${activeImg}`}
         src={img.imageId}
          alt={ad.title || 'Featured shop'}
          className="w-full h-full object-cover adfade"
        />
      </a>

      {ad.title && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
          <p className="text-white font-medium text-sm sm:text-base">{ad.title}</p>
        </div>
      )}

      {ads.length > 1 && (
        <>
          <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/80 opacity-0 group-hover:opacity-100 transition-opacity">
            <ChevronLeft className="w-4 h-4 text-purple-700" />
          </button>
          <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/80 opacity-0 group-hover:opacity-100 transition-opacity">
            <ChevronRight className="w-4 h-4 text-purple-700" />
          </button>
          <div className="absolute bottom-2 right-3 flex gap-1">
            {ads.map((_, i) => (
              <span key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === activeAd ? 'bg-white w-3' : 'bg-white/40'}`} />
            ))}
          </div>
        </>
      )}

      <style jsx>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .adfade { animation: fadeIn 0.6s ease; }
      `}</style>
    </div>
  );
};

export default AdvertisementCarousel;