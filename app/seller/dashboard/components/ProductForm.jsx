"use client";

import { useState, useEffect } from 'react';

const categories = [
  'Clothing', 'Electronics', 'Shoes', 'Accessories', 'Beauty',
  'Home & Garden', 'Sports', 'Books', 'Toys', 'Other'
];

const ProductForm = ({ shopId, seller, editingProduct, onProductAdded }) => {
  const isEditing = !!editingProduct;

  const [productData, setProductData] = useState({
    name: '',
    category: '',
    sizes: '',
    colors: '',
    price: '',
    stockQuantity: 0,
    stockStatus: 'out_of_stock',
    mainImageId: null,
    imageIds: [],
  });
  const [previews, setPreviews] = useState({ main: null, images: [] });
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [files, setFiles] = useState({ mainImage: null, images: [] });

  useEffect(() => {
    if (editingProduct) {
      setProductData({
        name: editingProduct.name || '',
        category: editingProduct.category || '',
        sizes: editingProduct.sizes ? editingProduct.sizes.join(', ') : '',
        colors: editingProduct.colors ? editingProduct.colors.join(', ') : '',
        price: editingProduct.price || '',
        stockQuantity: editingProduct.stockQuantity || 0,
        stockStatus: editingProduct.stockStatus || 'out_of_stock',
        mainImageId: editingProduct.mainImageId || null,
        imageIds: editingProduct.imageIds || [],
      });
      if (editingProduct.mainImageId)
        setPreviews(prev => ({ ...prev, main: `/images/${editingProduct.mainImageId}` }));
      if (editingProduct.imageIds?.length > 0)
        setPreviews(prev => ({ ...prev, images: editingProduct.imageIds.map(id => `/images/${id}`) }));
    }
  }, [editingProduct]);

  const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch('/api/upload-product-image', { method: 'POST', body: formData });
    if (!res.ok) throw new Error('Upload failed');
    return await res.text();
  };

  const handleImageChange = (mainFile, sideFiles) => {
    if (mainFile) {
      setFiles(prev => ({ ...prev, mainImage: mainFile }));
      setPreviews(prev => ({ ...prev, main: URL.createObjectURL(mainFile) }));
      setProductData(prev => ({ ...prev, mainImageId: null }));
    }
    if (sideFiles) {
      const validFiles = Array.from(sideFiles).slice(0, 4);
      setFiles(prev => ({ ...prev, images: validFiles }));
      setPreviews(prev => ({ ...prev, images: validFiles.map(f => URL.createObjectURL(f)) }));
      setProductData(prev => ({ ...prev, imageIds: [] }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!seller || !shopId) return;
    setUploading(true);
    setUploadProgress('Processing...');

    try {
      if (files.mainImage) {
        setUploadProgress('Uploading main image...');
        productData.mainImageId = await uploadImage(files.mainImage);
      }
      if (files.images.length > 0) {
        setUploadProgress('Uploading side images...');
        productData.imageIds = await Promise.all(files.images.map(uploadImage));
      }

      const finalData = {
        ...productData,
        shopId,
        sellerPhone: seller.phoneNumber,
        sizes: productData.sizes.split(',').map(s => s.trim()).filter(Boolean),
        colors: productData.colors.split(',').map(c => c.trim()).filter(Boolean),
        price: parseFloat(productData.price),
        stockQuantity: parseInt(productData.stockQuantity) || 0,
      };

      setUploadProgress('Saving product...');
      const method = isEditing ? 'PUT' : 'POST';
      const url = isEditing ? `/api/products?id=${editingProduct.id}` : '/api/products';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalData),
      });

      if (!res.ok) throw new Error(`${method} failed`);
      onProductAdded();
      setProductData({ name: '', category: '', sizes: '', colors: '', price: '', stockQuantity: 0, stockStatus: 'out_of_stock', mainImageId: null, imageIds: [] });
      setPreviews({ main: null, images: [] });
      setFiles({ mainImage: null, images: [] });
      setUploadProgress(`✅ Product ${isEditing ? 'updated' : 'added'}!`);
      setTimeout(() => setUploadProgress(''), 3000);
    } catch (error) {
      setUploadProgress(`❌ Error: ${error.message}`);
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

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Basic fields — single column on mobile, 2 col on sm+ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="Product Name *"
            value={productData.name}
            onChange={(e) => setProductData({ ...productData, name: e.target.value })}
            className={inputClass}
            required
          />
          <select
            value={productData.category}
            onChange={(e) => setProductData({ ...productData, category: e.target.value })}
            className={inputClass}
            required
          >
            <option value="">Select Category *</option>
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          <input
            type="text"
            placeholder="Sizes (S, M, L)"
            value={productData.sizes}
            onChange={(e) => setProductData({ ...productData, sizes: e.target.value })}
            className={inputClass}
          />
          <input
            type="text"
            placeholder="Colors (Red, Blue)"
            value={productData.colors}
            onChange={(e) => setProductData({ ...productData, colors: e.target.value })}
            className={inputClass}
          />
          <input
            type="number"
            step="0.01"
            placeholder="Price *"
            value={productData.price}
            onChange={(e) => setProductData({ ...productData, price: e.target.value })}
            className={inputClass}
            required
          />
          <input
            type="number"
            min="0"
            placeholder="Stock Quantity"
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
            className={`${inputClass} sm:col-span-2`}
          >
            <option value="out_of_stock">Out of Stock</option>
            <option value="in_stock">In Stock</option>
          </select>
        </div>

        {/* Images — side by side on sm+ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Main image */}
          <div>
            <label className="block text-sm font-bold text-purple-700 mb-2">Main Image *</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageChange(e.target.files[0], null)}
              className="w-full p-3 border-2 border-dashed border-purple-200 rounded-xl bg-purple-50 hover:bg-purple-100 transition-all cursor-pointer text-sm"
            />
            {previews.main ? (
              <img src={previews.main} alt="Preview" className="mt-3 w-full h-32 object-cover rounded-xl border-2 border-purple-100 shadow-sm" />
            ) : (
              <div className="mt-3 w-full h-32 bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-dashed border-purple-200 rounded-xl flex items-center justify-center text-2xl">🖼️</div>
            )}
          </div>

          {/* Side images */}
          <div>
            <label className="block text-sm font-bold text-purple-700 mb-2">Side Images (up to 4)</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleImageChange(null, e.target.files)}
              className="w-full p-3 border-2 border-dashed border-purple-200 rounded-xl bg-purple-50 hover:bg-purple-100 transition-all cursor-pointer text-sm"
            />
            <div className="mt-3 grid grid-cols-4 gap-2">
              {previews.images.length > 0
                ? previews.images.map((src, i) => (
                    <img key={i} src={src} alt={`Side ${i + 1}`} className="w-full aspect-square object-cover rounded-lg border border-purple-100" />
                  ))
                : (
                  <div className="col-span-4 h-16 bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-dashed border-purple-200 rounded-xl flex items-center justify-center text-xl">📸</div>
                )
              }
            </div>
          </div>
        </div>

        {/* Progress */}
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
          {uploading ? '⏳ Processing...' : isEditing ? '💾 Update Product' : '🚀 Add Product'}
        </button>
      </form>
    </div>
  );
};

export default ProductForm;