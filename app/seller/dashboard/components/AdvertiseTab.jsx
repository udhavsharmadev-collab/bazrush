"use client";

import { useEffect, useState, useRef } from 'react';
import { ImagePlus, X, ChevronUp, ChevronDown, Megaphone, Loader2 } from 'lucide-react';

const MAX_IMAGES = 6;

// TODO: confirm this matches the signature route you already built for
// product video uploads (memory says it's "a separate signature API route").
// If the endpoint/param names differ, adjust the two spots marked below.
async function uploadImageToCloudinary(file, onProgress) {
  const sigRes = await fetch('/api/cloudinary/signature', { method: 'POST' });
  if (!sigRes.ok) throw new Error('Could not get upload signature');
  const { signature, timestamp, apiKey, cloudName, folder } = await sigRes.json();

  const formData = new FormData();
  formData.append('file', file);
  formData.append('signature', signature);
  formData.append('timestamp', timestamp);
  formData.append('api_key', apiKey);
  if (folder) formData.append('folder', folder);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const data = JSON.parse(xhr.responseText);
        resolve({ url: data.secure_url, publicId: data.public_id });
      } else {
        reject(new Error('Cloudinary upload failed'));
      }
    };
    xhr.onerror = () => reject(new Error('Cloudinary upload failed'));
    xhr.send(formData);
  });
}

const AdvertiseTab = ({ seller }) => {
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [message, setMessage] = useState('');

  const [title, setTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [images, setImages] = useState([]); // [{ url, publicId, order }]
  const [previewIndex, setPreviewIndex] = useState(0);

  useEffect(() => {
    if (images.length < 2) { setPreviewIndex(0); return; }
    const id = setInterval(() => {
      setPreviewIndex((i) => (i + 1) % images.length);
    }, 2500);
    return () => clearInterval(id);
  }, [images.length]);

  useEffect(() => {
    if (!seller?.phone) { setLoading(false); setMessage('❌ Seller phone not found — can\'t load or save your ad'); return; }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/advertisement?sellerPhone=${encodeURIComponent(seller.phone)}`);
        const data = await res.json();
        if (!cancelled && data.ad) {
          setTitle(data.ad.title || '');
          setLinkUrl(data.ad.linkUrl || '');
          setIsActive(!!data.ad.isActive);
          setImages(data.ad.images || []);
        } else if (!cancelled && data.error) {
          setMessage(`❌ ${data.error}`);
        }
      } catch {
        if (!cancelled) setMessage('❌ Could not load your advertisement');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [seller?.phone]);

  const handleFilesSelected = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = ''; // allow picking the same file again later
    if (!files.length) return;

    const room = MAX_IMAGES - images.length;
    if (room <= 0) {
      setMessage(`❌ Max ${MAX_IMAGES} images — remove one first`);
      return;
    }
    const toUpload = files.slice(0, room);
    setMessage('');
    setUploadingCount(toUpload.length);

    for (const file of toUpload) {
      try {
        const uploaded = await uploadImageToCloudinary(file);
        setImages((prev) => [...prev, { ...uploaded, order: prev.length }]);
      } catch {
        setMessage('❌ One of the images failed to upload — try again');
      } finally {
        setUploadingCount((c) => c - 1);
      }
    }
  };

  const removeImage = (publicId) => {
    setImages((prev) => prev.filter((img) => img.publicId !== publicId));
  };

  const moveImage = (index, direction) => {
    setImages((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch('/api/advertisement', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sellerPhone: seller.phone, title, linkUrl, images, isActive }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage('✅ Advertisement saved!');
        setTimeout(() => setMessage(''), 2000);
      } else {
        setMessage(`❌ ${data.error}`);
      }
    } catch (error) {
      setMessage(`❌ Failed to save: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        Loading...
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-purple-100 text-purple-600">
          <Megaphone className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Advertise</h2>
          <p className="text-sm text-gray-500">
            Put your shop in the homepage featured carousel with a few images.
          </p>
        </div>
      </div>

      {message && (
        <div className="text-sm font-medium px-4 py-2 rounded-lg bg-purple-50 text-purple-700 border border-purple-100">
          {message}
        </div>
      )}

      {/* Live preview — how this'll look cycling on the homepage */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
        <p className="font-medium text-gray-800">Preview</p>
        <div className="relative rounded-xl overflow-hidden aspect-[16/7] bg-gray-100 border border-gray-200">
          {images.length > 0 ? (
            <>
              <img
                src={images[previewIndex]?.url}
                alt=""
                className="w-full h-full object-cover transition-opacity duration-500"
              />
              {title && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                  <p className="text-white text-sm font-medium">{title}</p>
                </div>
              )}
              {images.length > 1 && (
                <div className="absolute bottom-2 right-3 flex gap-1">
                  {images.map((_, i) => (
                    <span
                      key={i}
                      className={`w-1.5 h-1.5 rounded-full ${i === previewIndex ? 'bg-white' : 'bg-white/40'}`}
                    />
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
              Add images below to see your carousel here
            </div>
          )}
        </div>
      </div>

      {/* Active toggle */}
      <div className="flex items-center justify-between bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div>
          <p className="font-medium text-gray-800">Show on homepage</p>
          <p className="text-sm text-gray-500">Turn this off any time to pull your banner down.</p>
        </div>
        <button
          type="button"
          onClick={() => setIsActive((v) => !v)}
          className={`relative w-12 h-6.5 rounded-full transition-colors ${isActive ? 'bg-purple-600' : 'bg-gray-300'}`}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5.5 h-5.5 bg-white rounded-full shadow transition-transform ${isActive ? 'translate-x-5.5' : ''}`}
          />
        </button>
      </div>

      {/* Images */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <p className="font-medium text-gray-800">Carousel images</p>
          <span className="text-xs text-gray-400">{images.length}/{MAX_IMAGES}</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {images.map((img, index) => (
            <div key={img.publicId} className="relative group rounded-xl overflow-hidden border border-gray-200 aspect-video bg-gray-50">
              <img src={img.url} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(img.publicId)}
                className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <div className="absolute bottom-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button type="button" onClick={() => moveImage(index, -1)} disabled={index === 0}
                  className="p-1 rounded-full bg-black/60 text-white disabled:opacity-30">
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button type="button" onClick={() => moveImage(index, 1)} disabled={index === images.length - 1}
                  className="p-1 rounded-full bg-black/60 text-white disabled:opacity-30">
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          {images.length < MAX_IMAGES && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingCount > 0}
              className="aspect-video rounded-xl border-2 border-dashed border-purple-200 text-purple-400 hover:border-purple-400 hover:text-purple-600 transition-colors flex flex-col items-center justify-center gap-1"
            >
              {uploadingCount > 0 ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <ImagePlus className="w-5 h-5" />
                  <span className="text-xs">Add image</span>
                </>
              )}
            </button>
          )}
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" multiple hidden onChange={handleFilesSelected} />
      </div>

      {/* Title & link */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700">Caption (optional)</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value.slice(0, 60))}
            placeholder="e.g. Fresh weekend deals"
            className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-300 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Link (optional)</label>
          <input
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="Defaults to your shop page if left blank"
            className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-300 text-sm"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={saving || uploadingCount > 0}
        className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
        Save advertisement
      </button>
    </div>
  );
};

export default AdvertiseTab;