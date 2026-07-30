"use client";

import { useEffect, useState, useRef, useMemo } from 'react';
import { ImagePlus, X, ChevronUp, ChevronDown, Megaphone, Loader2 } from 'lucide-react';

const MAX_IMAGES = 6;

// Matches ProductForm.jsx's uploadImage() exactly — same endpoint your products already use.
async function uploadImage(file) {
  const formData = new FormData();
  formData.append('image', file);
  const res = await fetch('/api/upload-product-image', { method: 'POST', body: formData });
  if (!res.ok) throw new Error('Upload failed');
  return await res.text(); // returns the image id as plain text
}

const AdvertiseTab = ({ seller }) => {
  const fileInputRef = useRef(null);
  const sellerPhone = seller?.phoneNumber || seller?.phone || seller?.sellerPhone || seller?.mobile || seller?.mobileNumber || seller?.contactNumber || '';
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [message, setMessage] = useState('');

  const [title, setTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [images, setImages] = useState([]); // [{ url, publicId, order }]
  const [previewIndex, setPreviewIndex] = useState(0);

  const [linkType, setLinkType] = useState('none'); // 'none' | 'shop' | 'product'
  const [linkTarget, setLinkTarget] = useState(null); // { id, name, image }
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [ownProducts, setOwnProducts] = useState([]);

  const ownShops = useMemo(() => {
    return (seller?.shops || []).map((s) => ({
      id: s.id || s.shopId,
      name: s.shopName || s.name,
      image: s.mainPhotoId,
    }));
  }, [seller]);

  useEffect(() => {
    if (images.length < 2) { setPreviewIndex(0); return; }
    const id = setInterval(() => {
      setPreviewIndex((i) => (i + 1) % images.length);
    }, 2500);
    return () => clearInterval(id);
  }, [images.length]);

  useEffect(() => {
    if (!sellerPhone) { setLoading(false); setMessage('❌ Seller phone not found — can\'t load or save your ad'); return; }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/advertisement?sellerPhone=${encodeURIComponent(sellerPhone)}`);
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
  }, [sellerPhone]);

  // Fetch this seller's own products (for the redirect picker)
  useEffect(() => {
    const shopIds = (seller?.shops || []).map((s) => s.id || s.shopId);
    if (!shopIds.length) return;
    fetch('/api/products')
      .then((res) => res.json())
      .then((data) => {
        const products = data.products || data || [];
        setOwnProducts(
          products
            .filter((p) => shopIds.includes(p.shopId))
            .map((p) => ({ id: p.id, name: p.name, image: p.mainImageId }))
        );
      })
      .catch(() => {});
  }, [seller]);

  // Resolve the saved linkUrl back into a picked shop/product once data is loaded
  useEffect(() => {
    if (!linkUrl) { setLinkType('none'); setLinkTarget(null); return; }
    const shopMatch = linkUrl.match(/^\/shop\/(.+)$/);
    const productMatch = linkUrl.match(/^\/product\/(.+)$/);
    if (shopMatch) {
      const found = ownShops.find((s) => s.id === shopMatch[1]);
      if (found) { setLinkType('shop'); setLinkTarget(found); return; }
    }
    if (productMatch) {
      const found = ownProducts.find((p) => p.id === productMatch[1]);
      if (found) { setLinkType('product'); setLinkTarget(found); return; }
    }
  }, [linkUrl, ownShops, ownProducts]);

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
        const imageId = await uploadImage(file);
        setImages((prev) => [...prev, { imageId, order: prev.length }]);
      } catch {
        setMessage('❌ One of the images failed to upload — try again');
      } finally {
        setUploadingCount((c) => c - 1);
      }
    }
  };

  const removeImage = (imageId) => {
    setImages((prev) => prev.filter((img) => img.imageId !== imageId));
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

  const selectLinkTarget = (type, target) => {
    setLinkType(type);
    setLinkTarget(target);
    setLinkUrl(`/${type}/${target.id}`);
    setPickerOpen(false);
    setPickerSearch('');
  };

  const clearLink = () => {
    setLinkType('none');
    setLinkTarget(null);
    setLinkUrl('');
  };

  const pickerList = linkType === 'shop' ? ownShops : linkType === 'product' ? ownProducts : [];
  const pickerResults = (() => {
    const q = pickerSearch.toLowerCase().trim();
    return (q ? pickerList.filter((item) => item.name?.toLowerCase().includes(q)) : pickerList).slice(0, 20);
  })();

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch('/api/advertisement', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sellerPhone, title, linkUrl, images, isActive }),
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
    <div className="max-w-3xl mx-auto space-y-6 px-4 sm:px-6 lg:px-0">
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-xl bg-purple-100 text-purple-600">
          <Megaphone className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-gray-800">Advertise</h2>
          <p className="text-sm text-gray-500 break-words">
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
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5 space-y-3">
        <p className="font-medium text-gray-800">Preview</p>
        <div className="relative rounded-xl overflow-hidden aspect-[16/7] bg-gray-100 border border-gray-200">
          {images.length > 0 ? (
            <>
              <img
                 src={images[previewIndex]?.imageId}
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
      <div className="flex items-center justify-between gap-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
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
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5 space-y-4">
        <div className="flex items-center justify-between">
          <p className="font-medium text-gray-800">Carousel images</p>
          <span className="text-xs text-gray-400">{images.length}/{MAX_IMAGES}</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
          {images.map((img, index) => (
            <div key={img.imageId} className="relative group rounded-xl overflow-hidden border border-gray-200 aspect-video bg-gray-50">
              
              <img src={img.imageId} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(img.imageId)}
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
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5 space-y-4">
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
          <label className="text-sm font-medium text-gray-700">Redirect on click</label>
          <p className="text-xs text-gray-400 mt-0.5 mb-2">Send shoppers to your shop or one of your products when they tap the ad.</p>

          <div className="flex flex-wrap gap-2 mb-3">
            {[
              { key: 'none', label: 'None' },
              { key: 'shop', label: 'My Shop' },
              { key: 'product', label: 'My Product' },
            ].map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => {
                  if (opt.key === 'none') { clearLink(); return; }
                  setLinkType(opt.key);
                  setPickerOpen(true);
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                  linkType === opt.key
                    ? 'bg-purple-600 text-white border-purple-600'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-purple-300'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {linkType !== 'none' && (
            <div className="space-y-2">
              {linkTarget ? (
                <div className="flex items-center gap-3 px-3 py-2 rounded-xl border border-gray-200 bg-gray-50">
                  <div className="w-9 h-9 rounded-lg overflow-hidden bg-white border border-gray-200 flex-shrink-0">
                    {linkTarget.image && <img src={linkTarget.image} alt="" className="w-full h-full object-cover" />}
                  </div>
                  <span className="text-sm text-gray-700 font-medium truncate flex-1">{linkTarget.name}</span>
                  <button type="button" onClick={() => setPickerOpen(true)} className="text-xs text-purple-600 font-semibold">
                    Change
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setPickerOpen(true)}
                  className="w-full px-3 py-2 rounded-xl border-2 border-dashed border-purple-200 text-purple-500 text-sm font-medium hover:border-purple-400"
                >
                  Select a {linkType === 'shop' ? 'shop' : 'product'}…
                </button>
              )}

              {pickerOpen && (
                <div className="border border-gray-200 rounded-xl p-2 space-y-2 bg-white">
                  <input
                    autoFocus
                    value={pickerSearch}
                    onChange={(e) => setPickerSearch(e.target.value)}
                    placeholder={`Search your ${linkType === 'shop' ? 'shops' : 'products'}…`}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-300 text-sm"
                  />
                  <div className="max-h-56 overflow-y-auto space-y-1">
                    {pickerResults.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-4">
                        No {linkType === 'shop' ? 'shops' : 'products'} found
                      </p>
                    ) : (
                      pickerResults.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => selectLinkTarget(linkType, item)}
                          className="w-full flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-purple-50 text-left"
                        >
                          <div className="w-8 h-8 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                            {item.image && <img src={item.image} alt="" className="w-full h-full object-cover" />}
                          </div>
                          <span className="text-sm text-gray-700 truncate">{item.name}</span>
                        </button>
                      ))
                    )}
                  </div>
                  <button type="button" onClick={() => setPickerOpen(false)} className="text-xs text-gray-400 hover:text-gray-600">
                    Close
                  </button>
                </div>
              )}
            </div>
          )}
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