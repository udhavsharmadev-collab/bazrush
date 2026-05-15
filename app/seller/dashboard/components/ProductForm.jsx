"use client";

import { useState, useEffect } from 'react';

const categories = [
  'Clothing', 'Electronics', 'Shoes', 'Accessories', 'Beauty',
  'Home & Garden', 'Sports', 'Books', 'Toys', 'Other'
];

// ── Small helpers ────────────────────────────────────────────────────────────

const ImageDropZone = ({ label, preview, onChange, onRemove, small = false }) => (
  <div className={small ? 'relative group' : ''}>
    {!small && label && (
      <label className="block text-xs font-bold text-purple-600 mb-1.5">{label}</label>
    )}
    {preview ? (
      <div className="relative group">
        <img
          src={preview}
          alt={label}
          className={`object-cover rounded-xl border-2 border-purple-100 w-full ${small ? 'aspect-square' : 'h-28'}`}
        />
        <button
          type="button"
          onClick={onRemove}
          className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
        >✕</button>
      </div>
    ) : (
      <label className={`flex flex-col items-center justify-center cursor-pointer border-2 border-dashed border-purple-200 rounded-xl bg-purple-50 hover:bg-purple-100 transition-all w-full ${small ? 'aspect-square text-xl' : 'h-28 gap-1'}`}>
        <span className={small ? '' : 'text-2xl'}>📷</span>
        {!small && <span className="text-[11px] text-purple-400 font-semibold">Click to upload</span>}
        <input type="file" accept="image/*" className="hidden" onChange={onChange} />
      </label>
    )}
  </div>
);

// ── Main component ───────────────────────────────────────────────────────────

const ProductForm = ({ shopId, seller, editingProduct, onProductAdded }) => {
  const isEditing = !!editingProduct;

  // Core fields
  const [productData, setProductData] = useState({
    name: '',
    category: '',
    sizes: '',
    price: '',
    stockQuantity: 0,
    stockStatus: 'out_of_stock',
  });

  // Main image
  const [mainImageFile, setMainImageFile] = useState(null);
  const [mainImagePreview, setMainImagePreview] = useState(null);
  const [mainImageId, setMainImageId] = useState(null);

  // Side images — up to 4, independent of colors
  // Each: { file, preview, imageId }
  const [sideImages, setSideImages] = useState([]);

  // Color variants — each: { colorName, file, preview, imageId }
  const [colorVariants, setColorVariants] = useState([]);
  const [newColorName, setNewColorName] = useState('');

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');

  // ── Populate when editing ──────────────────────────────────────────────────
  useEffect(() => {
    if (!editingProduct) return;
    setProductData({
      name: editingProduct.name || '',
      category: editingProduct.category || '',
      sizes: editingProduct.sizes ? editingProduct.sizes.join(', ') : '',
      price: editingProduct.price || '',
      stockQuantity: editingProduct.stockQuantity || 0,
      stockStatus: editingProduct.stockStatus || 'out_of_stock',
    });
    if (editingProduct.mainImageId) {
      setMainImageId(editingProduct.mainImageId);
      setMainImagePreview(`/images/${editingProduct.mainImageId}`);
    }
    // Side images
    if (editingProduct.imageIds?.length) {
      setSideImages(editingProduct.imageIds.map(id => ({ file: null, preview: `/images/${id}`, imageId: id })));
    }
    // Color variants: colors[i] ↔ colorImageIds[i]
    if (editingProduct.colors?.length) {
      setColorVariants(
        editingProduct.colors.map((name, i) => ({
          colorName: name,
          file: null,
          preview: editingProduct.colorImageIds?.[i] ? `/images/${editingProduct.colorImageIds[i]}` : null,
          imageId: editingProduct.colorImageIds?.[i] || null,
        }))
      );
    }
  }, [editingProduct]);

  // ── Upload helper ──────────────────────────────────────────────────────────
  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch('/api/upload-product-image', { method: 'POST', body: formData });
    if (!res.ok) throw new Error('Upload failed');
    return await res.text();
  };

  // ── Main image ─────────────────────────────────────────────────────────────
  const handleMainImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMainImageFile(file);
    setMainImagePreview(URL.createObjectURL(file));
    setMainImageId(null);
  };

  // ── Side images ────────────────────────────────────────────────────────────
  const handleSideImageAdd = (e) => {
    const incoming = Array.from(e.target.files || []);
    setSideImages(prev => {
      const slots = 4 - prev.length;
      const toAdd = incoming.slice(0, slots).map(file => ({
        file,
        preview: URL.createObjectURL(file),
        imageId: null,
      }));
      return [...prev, ...toAdd];
    });
    e.target.value = '';
  };

  const removeSideImage = (index) => {
    setSideImages(prev => prev.filter((_, i) => i !== index));
  };

  // ── Color variants ─────────────────────────────────────────────────────────
  const addColorVariant = () => {
    const name = newColorName.trim();
    if (!name) return;
    if (colorVariants.some(c => c.colorName.toLowerCase() === name.toLowerCase())) return;
    setColorVariants(prev => [...prev, { colorName: name, file: null, preview: null, imageId: null }]);
    setNewColorName('');
  };

  const handleColorImageChange = (index, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setColorVariants(prev =>
      prev.map((c, i) =>
        i === index ? { ...c, file, preview: URL.createObjectURL(file), imageId: null } : c
      )
    );
  };

  const removeColorVariant = (index) => {
    setColorVariants(prev => prev.filter((_, i) => i !== index));
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!seller || !shopId) return;
    setUploading(true);

    try {
      // Main image
      let finalMainImageId = mainImageId;
      if (mainImageFile) {
        setUploadProgress('Uploading main image…');
        finalMainImageId = await uploadImage(mainImageFile);
      }

      // Side images
      setUploadProgress('Uploading side images…');
      const finalImageIds = await Promise.all(
        sideImages.map(img => img.file ? uploadImage(img.file) : Promise.resolve(img.imageId))
      );

      // Color variant images
      setUploadProgress('Uploading color images…');
      const finalColorImageIds = await Promise.all(
        colorVariants.map(cv => cv.file ? uploadImage(cv.file) : Promise.resolve(cv.imageId))
      );

      const finalData = {
        ...productData,
        shopId,
        sellerPhone: seller.phoneNumber,
        mainImageId: finalMainImageId,
        imageIds: finalImageIds.filter(Boolean),
        colors: colorVariants.map(c => c.colorName),
        colorImageIds: finalColorImageIds,
        sizes: productData.sizes.split(',').map(s => s.trim()).filter(Boolean),
        price: parseFloat(productData.price),
        stockQuantity: parseInt(productData.stockQuantity) || 0,
      };

      setUploadProgress('Saving product…');
      const method = isEditing ? 'PUT' : 'POST';
      const url = isEditing ? `/api/products?id=${editingProduct.id}` : '/api/products';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalData),
      });

      if (!res.ok) throw new Error(`${method} failed`);

      onProductAdded();
      // Reset
      setProductData({ name: '', category: '', sizes: '', price: '', stockQuantity: 0, stockStatus: 'out_of_stock' });
      setMainImageFile(null); setMainImagePreview(null); setMainImageId(null);
      setSideImages([]);
      setColorVariants([]);
      setUploadProgress(`✅ Product ${isEditing ? 'updated' : 'added'}!`);
      setTimeout(() => setUploadProgress(''), 3000);
    } catch (err) {
      setUploadProgress(`❌ Error: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const inputClass = "w-full px-4 py-3 text-sm border border-purple-200 rounded-xl bg-purple-50/50 focus:outline-none focus:ring-2 ring-purple-400/30 focus:border-purple-400 transition-all";

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-4 sm:p-6">
      <h3 className="text-xl sm:text-2xl font-black bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent mb-5 text-center">
        {isEditing ? '✏️ Update Product' : '🚀 Add New Product'}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* ── Basic fields ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="text" placeholder="Product Name *"
            value={productData.name}
            onChange={(e) => setProductData({ ...productData, name: e.target.value })}
            className={inputClass} required
          />
          <select
            value={productData.category}
            onChange={(e) => setProductData({ ...productData, category: e.target.value })}
            className={inputClass} required
          >
            <option value="">Select Category *</option>
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          <input
            type="text" placeholder="Sizes (S, M, L, XL)"
            value={productData.sizes}
            onChange={(e) => setProductData({ ...productData, sizes: e.target.value })}
            className={inputClass}
          />
          <input
            type="number" step="0.01" placeholder="Price *"
            value={productData.price}
            onChange={(e) => setProductData({ ...productData, price: e.target.value })}
            className={inputClass} required
          />
          <input
            type="number" min="0" placeholder="Stock Quantity"
            value={productData.stockQuantity}
            onChange={(e) => setProductData({ ...productData, stockQuantity: parseInt(e.target.value) || 0 })}
            className={inputClass}
          />
          <select
            value={productData.stockStatus}
            onChange={(e) => {
              const status = e.target.value;
              setProductData(prev => ({ ...prev, stockStatus: status, ...(status === 'out_of_stock' && { stockQuantity: 0 }) }));
            }}
            className={inputClass}
          >
            <option value="out_of_stock">Out of Stock</option>
            <option value="in_stock">In Stock</option>
          </select>
        </div>

        {/* ── Main image ── */}
        <div className="p-4 rounded-2xl border border-purple-100 bg-purple-50/30">
          <p className="text-sm font-black text-purple-700 mb-3">🖼️ Main Image <span className="text-red-400">*</span></p>
          <ImageDropZone
            label="Main image"
            preview={mainImagePreview}
            onChange={handleMainImageChange}
            onRemove={() => { setMainImageFile(null); setMainImagePreview(null); setMainImageId(null); }}
          />
        </div>

        {/* ── Side images ── */}
        <div className="p-4 rounded-2xl border border-purple-100 bg-purple-50/30">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-black text-purple-700">📸 Side Images <span className="text-purple-400 font-normal text-xs">({sideImages.length}/4)</span></p>
            {sideImages.length < 4 && (
              <label className="text-xs font-bold text-purple-600 bg-white border border-purple-200 px-3 py-1.5 rounded-xl cursor-pointer hover:bg-purple-50 transition-all">
                + Add
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleSideImageAdd} />
              </label>
            )}
          </div>
          <div className="grid grid-cols-4 gap-2">
            {sideImages.map((img, i) => (
              <ImageDropZone
                key={i}
                small
                preview={img.preview}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setSideImages(prev => prev.map((s, si) =>
                    si === i ? { ...s, file, preview: URL.createObjectURL(file), imageId: null } : s
                  ));
                }}
                onRemove={() => removeSideImage(i)}
              />
            ))}
            {sideImages.length === 0 && (
              <div className="col-span-4 h-16 flex items-center justify-center text-purple-300 text-sm font-semibold border-2 border-dashed border-purple-200 rounded-xl">
                No side images yet
              </div>
            )}
          </div>
          {sideImages.length > 0 && sideImages.length < 4 && (
            <p className="text-xs text-purple-400 mt-2 text-center">{4 - sideImages.length} more slot(s) available</p>
          )}
        </div>

        {/* ── Color variants ── */}
        <div className="p-4 rounded-2xl border border-purple-100 bg-purple-50/30">
          <p className="text-sm font-black text-purple-700 mb-3">🎨 Color Variants <span className="text-purple-400 font-normal text-xs">(each color gets its own image)</span></p>

          {/* Add new color */}
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="Color name (e.g. Red, Navy…)"
              value={newColorName}
              onChange={(e) => setNewColorName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addColorVariant(); } }}
              className="flex-1 px-3 py-2.5 text-sm border border-purple-200 rounded-xl bg-white focus:outline-none focus:ring-2 ring-purple-400/30 focus:border-purple-400 transition-all"
            />
            <button
              type="button"
              onClick={addColorVariant}
              className="px-4 py-2.5 bg-purple-600 text-white text-sm font-bold rounded-xl hover:bg-purple-700 active:scale-95 transition-all"
            >
              + Add
            </button>
          </div>

          {/* Color variant rows */}
          {colorVariants.length === 0 ? (
            <div className="h-14 flex items-center justify-center text-purple-300 text-sm font-semibold border-2 border-dashed border-purple-200 rounded-xl">
              No colors added yet
            </div>
          ) : (
            <div className="space-y-2">
              {colorVariants.map((cv, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 bg-white border border-purple-100 rounded-xl px-3 py-2.5"
                >
                  {/* Color image swatch */}
                  <div className="w-14 h-14 flex-shrink-0">
                    {cv.preview ? (
                      <div className="relative group w-14 h-14">
                        <img
                          src={cv.preview}
                          alt={cv.colorName}
                          className="w-full h-full object-cover rounded-lg border border-purple-100"
                        />
                        <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                          <span className="text-white text-xs font-bold">Change</span>
                          <input
                            type="file" accept="image/*" className="hidden"
                            onChange={(e) => handleColorImageChange(i, e)}
                          />
                        </label>
                      </div>
                    ) : (
                      <label className="w-14 h-14 flex flex-col items-center justify-center border-2 border-dashed border-purple-200 rounded-lg bg-purple-50 hover:bg-purple-100 cursor-pointer transition-all">
                        <span className="text-lg">📷</span>
                        <span className="text-[9px] text-purple-400 font-bold">Upload</span>
                        <input
                          type="file" accept="image/*" className="hidden"
                          onChange={(e) => handleColorImageChange(i, e)}
                        />
                      </label>
                    )}
                  </div>

                  {/* Color name */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-gray-800 capitalize">{cv.colorName}</p>
                    <p className="text-[11px] text-purple-400 mt-0.5">
                      {cv.preview ? '✓ Image added' : 'No image yet — upload one'}
                    </p>
                  </div>

                  {/* Remove */}
                  <button
                    type="button"
                    onClick={() => removeColorVariant(i)}
                    className="w-7 h-7 flex items-center justify-center rounded-full bg-red-50 border border-red-200 text-red-500 hover:bg-red-100 transition-all text-sm flex-shrink-0"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Progress ── */}
        {uploadProgress && (
          <div className={`p-3 rounded-xl font-bold text-sm text-center ${
            uploadProgress.includes('✅') ? 'bg-green-100 text-green-700 border border-green-200'
            : uploadProgress.includes('❌') ? 'bg-red-100 text-red-700 border border-red-200'
            : 'bg-purple-100 text-purple-700 border border-purple-200'
          }`}>
            {uploadProgress}
          </div>
        )}

        <button
          type="submit"
          disabled={uploading}
          className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-black py-4 rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all text-base disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? '⏳ Processing…' : isEditing ? '💾 Update Product' : '🚀 Add Product'}
        </button>
      </form>
    </div>
  );
};

export default ProductForm;