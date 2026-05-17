"use client";

import { useState, useEffect } from 'react';
import SellersShopList from './SellersShopList';
import ProductForm from './ProductForm';

const ProductsTab = ({ seller }) => {
  const [shops, setShops] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedShopId, setSelectedShopId] = useState(null);
  const [editingShopId, setEditingShopId] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null); // For edit mode
  const [showConfirmDelete, setShowConfirmDelete] = useState(null);
  const [message, setMessage] = useState('');
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    loadShops();
    loadProducts();
  }, [seller]);

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
        // Filter for this seller
        const sellerProducts = data.products.filter(p => p.sellerPhone === seller?.phoneNumber).map(p => ({
          ...p,
          shopId: typeof p.shopId === 'object' ? p.shopId.id : p.shopId // Fix old bloated data
        }));
        setProducts(sellerProducts);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleAddProduct = async (shopId) => {
    setMessage('✅ Product added successfully!');
    setEditingShopId(null);
    setEditingProduct(null);
    loadProducts(); // Reload products
    setTimeout(() => setMessage(''), 3000);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setEditingShopId(product.shopId); // Preselect shop
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

  const selectShop = (shop) => {
    setSelectedShopId(shop.id);
    setEditingShopId(null);
  };

  const openProductForm = (shop) => {
    setEditingShopId(shop.id);
    setEditingProduct(null); // New product
  };

  const backToShops = () => {
    setSelectedShopId(null);
  };

  // Group products by shop
  const productsByShop = shops.reduce((acc, shop) => {
    acc[shop.id] = products.filter(p => p.shopId === shop.id);
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      {message && (
        <div className={`p-6 rounded-3xl font-bold text-lg ${message.includes('✅') ? 'bg-gradient-to-r from-green-400 to-green-600 text-white shadow-xl' : 'bg-red-100 text-red-800 border border-red-200'}`}>
          {message}
        </div>
      )}
      
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-black bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent drop-shadow-lg">
          Manage Products ({products.length})
        </h1>
        <div className="text-sm text-gray-500">
          {loadingProducts ? 'Loading...' : `${products.length} products across ${shops.length} shops`}
        </div>
      </div>
      
      <SellersShopList 
        seller={seller}
        onShopClick={selectShop}
      />
      
      {/* Products Display */}
      <div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-700 bg-clip-text text-transparent mb-6">
          Your Products
        </h2>
        {/* Delete Confirmation Modal */}
        {showConfirmDelete && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl max-w-md w-full mx-4 p-8 border border-purple-200 animate-in fade-in zoom-in duration-200">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-red-100 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl">
                  <span className="text-3xl">🗑️</span>
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-2">Delete Product?</h3>
                <p className="text-gray-600 mb-6">This action cannot be undone. Are you sure?</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => handleDeleteProduct(showConfirmDelete)}
                  className="flex-1 py-3 px-6 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  Yes, Delete
                </button>
                <button
                  onClick={() => setShowConfirmDelete(null)}
                  className="flex-1 py-3 px-6 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
        {loadingProducts ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-gradient-to-br from-purple-50 to-indigo-50 animate-pulse rounded-3xl p-6 h-64 border border-purple-200" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl border-2 border-dashed border-purple-200 p-12">
            <div className="w-24 h-24 bg-gradient-to-br from-purple-200 to-purple-400 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
              <span className="text-3xl">🛍️</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-800 mb-4">No Products Yet</h3>
            <p className="text-xl text-gray-600 mb-8">Add your first product to get started</p>
            <p className="text-sm text-purple-600 font-semibold">Select a shop above and click Edit</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <div key={product.id} className="group bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-purple-200/50 hover:shadow-3xl hover:-translate-y-3 hover:ring-4 ring-purple-500/20 transition-all duration-500 overflow-hidden hover:border-purple-400">
                <div className="relative h-64 bg-gradient-to-br from-purple-400/30 to-indigo-400/30 overflow-hidden rounded-t-3xl">
                  {/* Price Badge */}
                  <div className="absolute bottom-4 left-4 bg-gradient-to-r from-purple-600 to-purple-700 text-white px-4 py-2 rounded-2xl font-bold text-lg shadow-2xl z-10">
                    ₹{product.price}
                  </div>
                  {/* Status Badge */}
                  <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold shadow-lg z-10 ${product.sizes?.length > 0 ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white' : 'bg-gradient-to-r from-orange-500 to-red-500 text-white'}`}>
                    {product.sizes?.length > 0 ? 'In Stock' : 'Out of Stock'}
                  </div>
                  <img 
                    src={product.mainImageId} 
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 group-hover:rotate-1 transition-all duration-700"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-6">
                    <h4 className="text-white font-bold text-xl mb-1 drop-shadow-lg">{product.name}</h4>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="font-black text-xl bg-gradient-to-r from-gray-900 via-purple-900 to-gray-900 bg-clip-text text-transparent mb-3 line-clamp-1">{product.name}</h3>
                  <p className="text-purple-700 font-bold mb-3 text-sm uppercase tracking-wide">{product.category}</p>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2 bg-gray-50/50 px-3 py-2 rounded-xl">
                    Sizes: <span className="font-semibold text-purple-600">{product.sizes?.join(', ') || 'N/A'}</span> | Colors: <span className="font-semibold text-indigo-600">{product.colors?.join(', ') || 'N/A'}</span>
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500 font-medium bg-white/50 px-3 py-2 rounded-2xl backdrop-blur-sm mb-4">
                    <span>🛒 Shop #{product.shopId?.slice(-4)}</span>
                    <span>· {new Date(product.createdAt).toLocaleDateString('short')}</span>
                  </div>
                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => handleEditProduct(product)}
                      className="flex-1 p-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 text-sm"
                      title="Edit Product"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => setShowConfirmDelete(product.id)}
                      className="p-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center text-sm"
                      title="Delete Product"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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

