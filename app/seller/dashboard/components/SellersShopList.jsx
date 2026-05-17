"use client";

import { useState, useEffect } from 'react';


const SellersShopList = ({ seller, onSelectShop, onEditShop }) => {
  const [shops, setShops] = useState([]);
  const [viewingShop, setViewingShop] = useState(null);

  useEffect(() => {
    loadShops();
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

  const handleViewShop = (shop) => {
    setViewingShop(shop);
  };

  const closeView = () => {
    setViewingShop(null);
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-8 hover:shadow-xl transition-shadow relative">
      {/* View Modal Overlay */}
      {viewingShop && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={closeView}>
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl max-h-[90vh] overflow-y-auto w-full mx-4 relative animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white p-6 border-b border-gray-200 rounded-t-3xl z-10 flex items-center justify-between">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent">
                {viewingShop.shopName}
              </h2>
              <button onClick={closeView} className="p-2 hover:bg-gray-200 rounded-xl transition">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-8 space-y-8">
              {/* Main Photo & Status */}
              <div className="text-center">
                <div className={`inline-block p-2 rounded-2xl mb-4 ${viewingShop.isOpen ? 'bg-green-100 border-4 border-green-200' : 'bg-red-100 border-4 border-red-200'}`}>
                  <img 
                    src={viewingShop.mainPhotoId ? `/images/${viewingShop.mainPhotoId}` : '/default-shop.jpg'}
                    alt={viewingShop.shopName}
                    className="w-48 h-48 rounded-2xl object-cover shadow-xl"
                  />
                </div>
                <h3 className="text-4xl font-black mb-2 bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent">
                  {viewingShop.shopName}
                </h3>
                <p className="text-xl text-gray-600 mb-2">{viewingShop.address}</p>
                <p className={`text-2xl font-black ${viewingShop.isOpen ? 'text-green-600' : 'text-red-600'}`}>
                  {viewingShop.isOpen ? '🟢 Open Now' : '🔴 Closed'}
                </p>
              </div>

              {/* Category & Basic Info */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-2xl border border-purple-200">
                  <h4 className="text-lg font-bold text-purple-800 mb-4">Category</h4>
                  <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent">
                    {viewingShop.category}
                  </div>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-200">
                  <h4 className="text-lg font-bold text-blue-800 mb-4">Owner</h4>
                  <p className="text-xl font-semibold text-gray-900">{viewingShop.ownerName}</p>
                </div>
              </div>

              {/* Gallery Photos */}
              {viewingShop.photoIds && viewingShop.photoIds.some(id => id) && (
                <div>
                  <h4 className="text-xl font-bold mb-4 bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">Gallery Photos</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {viewingShop.photoIds.slice(0, 4).map((id, index) => (
                      id ? (
                        <img key={index} src={`/images/${id}`} alt={`Gallery ${index + 1}`} className="w-full h-32 object-cover rounded-xl shadow-lg hover:scale-105 transition transform" />
                      ) : (
                        <div key={index} className="w-full h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center">
                          <span className="text-gray-400">No photo</span>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}

              {/* Operating Hours */}
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-6 rounded-2xl border border-emerald-200">
                <h4 className="text-xl font-bold mb-6 bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">Operating Hours</h4>
                <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => {
                    const timing = viewingShop.timing?.[day];
                    const isClosed = timing?.closed;
                    return (
                      <div key={day} className={`p-4 rounded-xl border ${isClosed ? 'bg-red-50 border-red-200' : 'bg-white border-emerald-200 shadow-sm'}`}>
                        <div className="font-semibold text-gray-900 text-sm uppercase tracking-wide mb-1">{day.slice(0,3)}</div>
                        {isClosed ? (
                          <div className="text-red-600 font-bold text-sm">Closed</div>
                        ) : (
                          <div className="text-sm text-gray-700">{timing?.open} - {timing?.close}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent">
          Your Shops ({shops.length})
        </h3>
        <button
          onClick={() => onSelectShop({ action: 'create' })}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg font-semibold shadow-lg transition"
        >
          + Add New Shop
        </button>
      </div>

      {shops.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🏪</span>
          </div>
          <h4 className="text-xl font-bold text-gray-900 mb-2">No Shops Yet</h4>
          <p className="text-gray-600 mb-6">Create your first shop to get started</p>
          <button onClick={() => onSelectShop({ action: 'create' })} className="px-8 py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg font-semibold shadow-lg transition">
            Create Shop
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
{shops.map((shop) => (
            <div key={shop.id} className="group bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200 p-6 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 overflow-hidden">
              <div className="relative mb-4">
                <div className="w-full h-40 rounded-lg overflow-hidden bg-purple-200 group-hover:bg-purple-300 transition">
                  {shop.mainPhotoId && !shop.mainPhotoId.startsWith('{') ? (
                    <img
                      src={shop.mainPhotoId}
                      alt={shop.shopName}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-3xl">🏪</span>
                    </div>
                  )}
                </div>
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-bold text-gray-800 shadow-lg">
                  {shop.isOpen ? '🟢 Open' : '🔴 Closed'}
                </div>
              </div>

              <h4 className="text-lg font-bold text-gray-900 mb-2 truncate">{shop.shopName}</h4>
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{shop.address}</p>
              <p className="text-xs text-purple-600 font-semibold mb-4">{shop.category}</p>

              <div className="flex gap-2">
                <button
                  onClick={() => handleViewShop(shop)}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-lg text-sm font-semibold shadow-md transition"
                >
                  View
                </button>
                <button
                  onClick={() => onEditShop(shop)}
                  className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg text-sm font-semibold shadow-md transition"
                >
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SellersShopList;

