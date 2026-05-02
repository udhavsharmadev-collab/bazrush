"use client";

import { useState, useEffect, useRef } from 'react';
import ProductForm from './ProductForm';

const ProductsTab = ({ seller }) => {
  const [shops, setShops] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedShopId, setSelectedShopId] = useState(null);
  const [editingShopId, setEditingShopId] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(null);
  const [message, setMessage] = useState('');
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Prevent re-fetching when parent re-renders with same seller
  const loadedForPhone = useRef(null);

  useEffect(() => {
    if (!seller?.phoneNumber) return;
    if (loadedForPhone.current === seller.phoneNumber) return; // already loaded
    loadedForPhone.current = seller.phoneNumber;
    loadShops();
    loadProducts();
  }, [seller?.phoneNumber]);

  const loadShops = async () => {
    try {
      const response = await fetch(`/api/sellers?phoneNumber=${encodeURIComponent(seller?.phoneNumber)}`);
      if (response.ok) {
        const data = await response.json();
        setShops(data?.seller?.shops || []);
      }
    } catch (error) {
      console.error('Error loading shops:', error);
    }
  };

  const loadProducts = async () => {
    try {
      setLoadingProducts(true);
      const response = await fetch('/api/products');
      if (response.ok) {
        const data = await response.json();
        const sellerProducts = data.products
          .filter(p => p.sellerPhone === seller?.phoneNumber)
          .map(p => ({
            ...p,
            shopId: typeof p.shopId === 'object' ? p.shopId.id : p.shopId,
          }));
        setProducts(sellerProducts);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleAddProduct = async () => {
    setMessage('✅ Product added successfully!');
    setEditingShopId(null);
    setEditingProduct(null);
    loadProducts();
    setTimeout(() => setMessage(''), 3000);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setEditingShopId(product.shopId);
  };

  const handleDeleteProduct = async (productId) => {
    try {
      const res = await fetch(`/api/products?id=${productId}`, { method: 'DELETE' });
      if (res.ok) {
        setMessage('🗑️ Product deleted successfully!');
        loadProducts();
      } else {
        setMessage('❌ Delete failed. Try again.');
      }
    } catch (error) {
      setMessage('❌ Delete error. Check console.');
      console.error(error);
    }
    setShowConfirmDelete(null);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleShopSelect = (shopId) => {
    setSelectedShopId(shopId);
    setEditingShopId(null);
    setEditingProduct(null);
  };

  const handleAddProductForShop = (shopId) => {
    setEditingShopId(shopId);
    setEditingProduct(null);
  };

  const productsByShop = shops.reduce((acc, shop) => {
    acc[shop.id] = products.filter(p => p.shopId === shop.id);
    return acc;
  }, {});

  const selectedShop = shops.find(s => s.id === selectedShopId);
  const shopProducts = selectedShopId ? (productsByShop[selectedShopId] || []) : products;

  useEffect(() => {
    if (shops.length > 0 && !selectedShopId) setSelectedShopId(shops[0].id);
  }, [shops, selectedShopId]);

  return (
    <div className="space-y-5">
      {/* Message */}
      {message && (
        <div className={`p-4 rounded-2xl font-bold text-sm ${message.includes('✅') ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
          {message}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
        <h1 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent">
          {selectedShop ? `${selectedShop.shopName} (${shopProducts.length})` : `All Products (${products.length})`}
        </h1>
        <p className="text-xs text-gray-400">
          {loadingProducts ? 'Loading...' : `${products.length} products · ${shops.length} shops`}
        </p>
      </div>

      {/* Shop Selector */}
      {shops.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 p-6">
          <span className="text-4xl">🏪</span>
          <h3 className="text-lg font-bold text-gray-700 mt-3 mb-1">No Shops Yet</h3>
          <p className="text-gray-500 text-sm">Create a shop first in the Shop tab</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-3 border border-purple-100 shadow-sm">
          <div className="flex overflow-x-auto gap-2 pb-1">
            {shops.map((shop) => {
              const count = productsByShop[shop.id]?.length || 0;
              const isActive = selectedShopId === shop.id;
              return (
                <div key={shop.id} className="flex flex-col items-center gap-1.5 min-w-[120px] flex-shrink-0">
                  <button
                    onClick={() => handleShopSelect(shop.id)}
                    className={`w-full px-3 py-2.5 rounded-xl font-bold text-xs transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-md ring-2 ring-purple-400/40'
                        : 'bg-purple-50 text-gray-700 border border-purple-100 hover:border-purple-300 hover:bg-purple-100'
                    }`}
                  >
                    {shop.shopName.length > 12 ? shop.shopName.slice(0, 12) + '…' : shop.shopName}
                    <span className={`ml-1 font-normal ${isActive ? 'text-purple-200' : 'text-purple-400'}`}>({count})</span>
                  </button>
                  <button
                    onClick={() => handleAddProductForShop(shop.id)}
                    className="w-full px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-semibold rounded-lg shadow-sm hover:shadow-md hover:scale-105 transition-all"
                  >
                    + Add
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Products Grid */}
      <div>
        <h2 className="text-lg font-bold text-gray-700 mb-4">Your Products</h2>

        {/* Delete Confirm Modal */}
        {showConfirmDelete && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 border border-purple-100">
              <div className="text-center mb-5">
                <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">🗑️</span>
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-1">Delete Product?</h3>
                <p className="text-gray-500 text-sm">This cannot be undone.</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => handleDeleteProduct(showConfirmDelete)}
                  className="flex-1 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold rounded-xl text-sm"
                >
                  Yes, Delete
                </button>
                <button
                  onClick={() => setShowConfirmDelete(null)}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {loadingProducts ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-purple-50 animate-pulse rounded-2xl h-52" />
            ))}
          </div>
        ) : shopProducts.length === 0 ? (
          <div className="text-center py-14 bg-purple-50 rounded-2xl border-2 border-dashed border-purple-200">
            <span className="text-4xl">🛍️</span>
            <h3 className="text-lg font-bold text-gray-700 mt-3 mb-1">No Products Yet</h3>
            <p className="text-sm text-gray-500">Select a shop above and click + Add</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {shopProducts.map((product) => (
              <div
                key={product.id}
                className="group bg-white rounded-2xl shadow-md border border-purple-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
              >
                {/* Image */}
                <div className="relative h-36 sm:h-44 bg-gradient-to-br from-purple-50 to-indigo-50 overflow-hidden">
                  <img
                    src={`/images/${product.mainImageId}`}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => { e.target.style.opacity = '0.1'; }}
                  />
                  <div className="absolute bottom-2 left-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white px-2.5 py-1 rounded-lg font-bold text-xs shadow-md">
                    ₹{product.price}
                  </div>
                  <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    product.stockStatus === 'in_stock'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-orange-500 text-white'
                  }`}>
                    {product.stockStatus === 'in_stock' ? `✓ ${product.stockQuantity || 0}` : 'Out'}
                  </div>
                </div>

                {/* Info */}
                <div className="p-3">
                  <p className="font-bold text-gray-900 text-sm truncate">{product.name}</p>
                  <p className="text-purple-500 text-xs font-semibold mb-2">{product.category}</p>
                  <p className="text-[11px] text-gray-400 mb-3 truncate">
                    {product.sizes?.join(', ') || '—'} · {product.colors?.join(', ') || '—'}
                  </p>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditProduct(product)}
                      className="flex-1 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white text-xs font-bold rounded-xl hover:shadow-md hover:scale-105 transition-all"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => setShowConfirmDelete(product.id)}
                      className="py-2 px-3 bg-red-50 text-red-500 text-xs font-bold rounded-xl border border-red-100 hover:bg-red-100 transition-all"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Product Form */}
      {editingShopId && (
        <ProductForm
          shopId={editingShopId}
          seller={seller}
          editingProduct={editingProduct}
          onProductAdded={handleAddProduct}
        />
      )}
    </div>
  );
};

export default ProductsTab;