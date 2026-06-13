'use client';
import { useState, useRef, useEffect } from 'react';

export default function ARViewer({ product }) {
  const [mode, setMode] = useState(null); // null | 'ar' | 'camera-fallback'
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const has3DModel = !!product.modelGlbUrl;

  // ── Camera fallback (image overlay on live camera) ──────────────────────
  const startCameraAR = async () => {
    setMode('camera-fallback');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      alert('Camera permission denied. Please allow camera access.');
      setMode(null);
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setMode(null);
  };

  useEffect(() => {
    return () => streamRef.current?.getTracks().forEach((t) => t.stop());
  }, []);

  // ── Main AR button logic ─────────────────────────────────────────────────
  const handleARClick = () => {
    if (has3DModel) {
      setMode('ar');
    } else {
      startCameraAR();
    }
  };

  return (
    <>
      {/* ── AR Button ── */}
      <button
        onClick={handleARClick}
        className="w-full py-3.5 rounded-2xl border-2 border-dashed border-violet-300 bg-violet-50 text-violet-600 font-black text-sm flex items-center justify-center gap-2.5 hover:bg-violet-100 hover:border-violet-400 active:scale-95 transition-all duration-200 group"
      >
        <span className="text-lg">🪄</span>
        <span>View in Your Space</span>
        <span className="text-[10px] font-bold bg-violet-600 text-white px-2 py-0.5 rounded-full">AR</span>
      </button>

      {/* ── Model Viewer (real AR with 3D model) ── */}
      {mode === 'ar' && has3DModel && (
        <div className="fixed inset-0 z-1000 bg-black flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 bg-black/80 backdrop-blur">
            <p className="text-white font-black text-sm">📦 {product.name}</p>
            <button
              onClick={() => setMode(null)}
              className="w-9 h-9 rounded-full bg-white/20 text-white font-bold flex items-center justify-center"
            >
              ✕
            </button>
          </div>

          {/* eslint-disable-next-line */}
          <model-viewer
            src={product.modelGlbUrl}
            ios-src={product.modelUsdzUrl}
            alt={product.name}
            ar
            ar-modes="webxr scene-viewer quick-look"
            camera-controls
            auto-rotate
            shadow-intensity="1"
            style={{ width: '100%', flex: 1, background: '#111' }}
          >
            <button
              slot="ar-button"
              className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-violet-600 text-white font-black px-8 py-4 rounded-2xl shadow-xl text-sm"
            >
              🪄 Place in Your Room
            </button>
          </model-viewer>
        </div>
      )}

      {/* ── Camera Fallback (image overlay) ── */}
      {mode === 'camera-fallback' && (
        <div className="fixed inset-0 z-1000 bg-black overflow-hidden">
          {/* Live camera feed */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Draggable product overlay */}
          <DraggableProductOverlay
            imageId={product.mainImageId}
            productName={product.name}
          />

          {/* UI Chrome */}
          <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-3 bg-linear-to-b from-black/60 to-transparent">
            <p className="text-white font-black text-sm">🪄 {product.name} — AR Preview</p>
            <button
              onClick={stopCamera}
              className="w-9 h-9 rounded-full bg-white/20 backdrop-blur text-white font-bold flex items-center justify-center"
            >
              ✕
            </button>
          </div>

          <div className="absolute bottom-6 left-0 right-0 text-center">
            <p className="text-white/70 text-xs font-semibold bg-black/30 backdrop-blur-sm px-4 py-2 rounded-full inline-block">
              Drag the product to place it in your space
            </p>
          </div>
        </div>
      )}
    </>
  );
}

// ── Draggable Product Overlay ─────────────────────────────────────────────
function DraggableProductOverlay({ imageId, productName }) {
  const [pos, setPos] = useState({ x: '50%', y: '40%' });
  const [size, setSize] = useState(180);
  const startDistRef = useRef(null);
  const startSizeRef = useRef(180);

  const handleTouchMove = (e) => {
    if (e.touches.length === 1) {
      setPos({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (startDistRef.current) {
        const ratio = dist / startDistRef.current;
        setSize(Math.max(80, Math.min(350, startSizeRef.current * ratio)));
      }
    }
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      startDistRef.current = Math.sqrt(dx * dx + dy * dy);
      startSizeRef.current = size;
    }
  };

  const handleTouchEnd = () => {
    startDistRef.current = null;
  };

  return (
    <div
      onTouchMove={handleTouchMove}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{
        position: 'absolute',
        left: pos.x,
        top: pos.y,
        transform: 'translate(-50%, -50%)',
        width: size,
        height: size,
        cursor: 'grab',
        touchAction: 'none',
        filter: 'drop-shadow(0 8px 32px rgba(0,0,0,0.5))',
      }}
    >
      <img
        src={imageId}
        alt={productName}
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        draggable={false}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          border: '2px dashed rgba(255,255,255,0.3)',
          borderRadius: 16,
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}