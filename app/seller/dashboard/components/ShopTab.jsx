"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import ShopPhotosSection from './ShopPhotosSection';
import ShopInfoForm from './ShopInfoForm';
import ShopTimingStatus from './ShopTimingStatus';
import SellersShopList from './SellersShopList';

const ShopTab = ({ seller }) => {
  const router = useRouter();
  const [shopData, setShopData] = useState({
    shopName: '',
    ownerName: seller?.name || '',
    category: '',
    address: '',
    mainPhotoId: '',
    photoIds: ['', '', '', ''],
    isOpen: true,
    timing: {
      Monday: { open: '09:00', close: '21:00', closed: false },
      Tuesday: { open: '09:00', close: '21:00', closed: false },
      Wednesday: { open: '09:00', close: '21:00', closed: false },
      Thursday: { open: '09:00', close: '21:00', closed: false },
      Friday: { open: '09:00', close: '21:00', closed: false },
      Saturday: { open: '09:00', close: '21:00', closed: false },
      Sunday: { open: '09:00', close: '21:00', closed: true },
    },
  });

  const [previewPhotos, setPreviewPhotos] = useState({
    mainPhoto: null,
    photos: [null, null, null, null],
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingShopId, setEditingShopId] = useState(null);
  const [message, setMessage] = useState('');
  const [viewMode, setViewMode] = useState('shops'); // 'create' or 'shops'
  const [savedShops, setSavedShops] = useState([]);
  const [selectedShop, setSelectedShop] = useState(null);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const mainPhotoFile = useRef(null);
  const photosFiles = useRef([null, null, null, null]);

  useEffect(() => {
    if (viewMode === 'shops') {
      loadSavedShops();
    }
  }, [seller?.phoneNumber, viewMode]);

  const loadSavedShops = async () => {
    try {
      const response = await fetch(`/api/sellers?phoneNumber=${encodeURIComponent(seller?.phoneNumber)}`);
      if (!response.ok) return;
      const data = await response.json();
      const sellerData = data?.seller;
      if (sellerData?.shops) {
        setSavedShops(sellerData.shops);
      }
    } catch (error) {
      console.error('Error loading saved shops:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setShopData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setMessage('');
  };

  const handleMainPhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      mainPhotoFile.current = file;
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewPhotos((prev) => ({
          ...prev,
          mainPhoto: reader.result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGalleryPhotoChange = (index, e) => {
    const file = e.target.files[0];
    if (file) {
      photosFiles.current[index] = file;
      const reader = new FileReader();
      reader.onloadend = () => {
        const newPreviews = [...previewPhotos.photos];
        newPreviews[index] = reader.result;
        setPreviewPhotos((prev) => ({
          ...prev,
          photos: newPreviews,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFetchAddress = async () => {
    if (!navigator.geolocation) {
      alert('Geolocation not supported');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
          );
          const data = await response.json();
          const address = data.display_name || 'Address not found';
          
          setShopData(prev => ({
            ...prev,
            address
          }));
          
          console.log('Address fetched:', address);
        } catch (error) {
          console.error('Geocoding failed:', error);
          setShopData(prev => ({
            ...prev,
            address: `Lat: ${latitude}, Lng: ${longitude}`
          }));
        }
      },
      (error) => {
        console.error('Location error:', error);
        alert('Location access denied. Please enable location permission.');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    );
  };

  const uploadPhoto = async (file) => {
    if (!file) return '';
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch('/api/upload-shop-image', { method: 'POST', body: formData });
    const text = await res.text();
    if (!res.ok) throw new Error('Upload failed');
    return text.trim();
  };

  const handleSaveShop = async () => {
    setIsSaving(true);
    setMessage('');

    try {
      let currentShops = savedShops;

      let response;
      let mainPhotoId = shopData.mainPhotoId || '';
      let photoIds = (shopData.photoIds || []).slice(0, 4);

      if (mainPhotoFile.current) {
        mainPhotoId = await uploadPhoto(mainPhotoFile.current);
      }

      const newGalleryPhotoIds = [];
      for (let i = 0; i < 4; i++) {
        if (photosFiles.current[i]) {
          const newId = await uploadPhoto(photosFiles.current[i]);
          newGalleryPhotoIds[i] = newId;
        } else {
          newGalleryPhotoIds[i] = photoIds[i] || '';
        }
      }
      photoIds = newGalleryPhotoIds;

      if (isEditing && editingShopId) {
        currentShops = currentShops.map(shop => 
          shop.id === editingShopId ? { 
            ...shop,
            ...shopData,
            mainPhotoId,
            photoIds,
            updatedAt: new Date().toISOString()
          } : shop
        );
        response = await fetch('/api/sellers', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phoneNumber: seller.phoneNumber,
            shops: currentShops,
          }),
        });
        setIsEditing(false);
        setEditingShopId(null);
      } else {
        const newShop = {
          id: Date.now().toString(),
          ...shopData,
          mainPhotoId,
          photoIds,
          createdAt: new Date().toISOString(),
        };
        response = await fetch('/api/sellers', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phoneNumber: seller.phoneNumber,
            shop: newShop,
          }),
        });
      }

      if (response.ok) {
        setMessage(`✅ Shop ${isEditing ? 'updated' : 'created'} successfully!`);
        mainPhotoFile.current = null;
        photosFiles.current = [null, null, null, null];
        setPreviewPhotos({ mainPhoto: null, photos: [null, null, null, null] });
        setViewMode('shops');
        loadSavedShops();
        router.refresh();
      } else {
        const errorData = await response.json();
        setMessage(`❌ ${errorData.error || 'Failed to save shop'}`);
      }
    } catch (error) {
      setMessage('❌ Error saving shop: ' + error.message);
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSelectShop = (shop) => {
    if (shop.action === 'create') {
      setShopData({
        shopName: '',
        ownerName: seller?.name || '',
        category: '',
        address: '',
        mainPhotoId: '',
        photoIds: ['', '', '', ''],
        isOpen: true,
        timing: {
          Monday: { open: '09:00', close: '21:00', closed: false },
          Tuesday: { open: '09:00', close: '21:00', closed: false },
          Wednesday: { open: '09:00', close: '21:00', closed: false },
          Thursday: { open: '09:00', close: '21:00', closed: false },
          Friday: { open: '09:00', close: '21:00', closed: false },
          Saturday: { open: '09:00', close: '21:00', closed: false },
          Sunday: { open: '09:00', close: '21:00', closed: true },
        },
      });
      setPreviewPhotos({ mainPhoto: null, photos: [null, null, null, null] });
      mainPhotoFile.current = null;
      photosFiles.current = [null, null, null, null];
      setIsEditing(false);
      setEditingShopId(null);
      setViewMode('create');
    } else {
      setSelectedShop(shop);
    }
  };

  const handleEditShop = (shop) => {
    setShopData(shop);
    setPreviewPhotos({
      mainPhoto: shop.mainPhotoId ? `/images/${shop.mainPhotoId}` : null,
      photos: (shop.photoIds || []).slice(0, 4).map(id => id ? `/images/${id}` : null).concat(Array(4 - Math.max(0, (shop.photoIds || []).length)).fill(null)),
    });
    setIsEditing(true);
    setEditingShopId(shop.id);
    setViewMode('create');
  };

  const handleCancelEdit = () => {
    setShopData({
      shopName: '',
      ownerName: seller?.name || '',
      category: '',
      address: '',
      mainPhotoId: '',
      photoIds: ['', '', '', ''],
      isOpen: true,
      timing: {
        Monday: { open: '09:00', close: '21:00', closed: false },
        Tuesday: { open: '09:00', close: '21:00', closed: false },
        Wednesday: { open: '09:00', close: '21:00', closed: false },
        Thursday: { open: '09:00', close: '21:00', closed: false },
        Friday: { open: '09:00', close: '21:00', closed: false },
        Saturday: { open: '09:00', close: '21:00', closed: false },
        Sunday: { open: '09:00', close: '21:00', closed: true },
      },
    });
    setPreviewPhotos({ mainPhoto: null, photos: [null, null, null, null] });
    mainPhotoFile.current = null;
    photosFiles.current = [null, null, null, null];
    setIsEditing(false);
    setEditingShopId(null);
    setMessage('');
  };

  const handleBackToShops = () => {
    setSelectedShop(null);
    setViewMode('shops');
  };

  if (viewMode === 'shops') {
    return (
      <SellersShopList 
        seller={seller}
        onSelectShop={handleSelectShop}
        onEditShop={handleEditShop}
      />
    );
  }

  if (selectedShop) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={handleBackToShops}
            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-semibold flex items-center gap-2"
          >
            ← Back to Shops
          </button>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent">
            {selectedShop.shopName}
          </h2>
        </div>
        <div className="bg-white rounded-2xl shadow-lg border border-purple-100 p-8">
          <div className="text-center mb-8">
            <img 
              src={selectedShop.mainPhotoId ? `/api/upload-shop-image/${selectedShop.mainPhotoId}` : '/default-shop.jpg'} 
              alt={selectedShop.shopName}
              className="w-32 h-32 rounded-full mx-auto mb-4 object-cover shadow-xl border-4 border-purple-200"
            />
            <h3 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent">
              {selectedShop.shopName}
            </h3>
            <p className="text-xl text-gray-600">{selectedShop.address}</p>
            <p className={`text-2xl font-black mt-2 ${selectedShop.isOpen ? 'text-green-600' : 'text-red-600'}`}>
              {selectedShop.isOpen ? '🟢 Open' : '🔴 Closed'}
            </p>
          </div>
          <button
            onClick={() => handleEditShop(selectedShop)}
            className="w-full px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-2xl font-bold text-lg shadow-xl transition"
          >
            ✏️ Edit Shop
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {message && (
        <div className={`p-4 rounded-xl font-semibold text-lg ${message.startsWith('✅') ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
          {message}
        </div>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent">
          {isEditing ? 'Edit Shop' : 'Create Your Shop'}
        </h2>
        <div className="flex gap-3">
          <button
            onClick={() => setViewMode('shops')}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-semibold shadow-lg transition"
          >
            👁️ View Shops
          </button>
          {isEditing && (
            <button
              onClick={handleCancelEdit}
              className="px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white rounded-lg font-semibold shadow-lg transition"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      <ShopPhotosSection 
        shopData={shopData}
        previewPhotos={previewPhotos}
        onMainPhotoChange={handleMainPhotoChange}
        onGalleryPhotoChange={handleGalleryPhotoChange}
      />
      
      <ShopInfoForm 
        shopData={shopData}
        seller={seller}
        onInputChange={handleInputChange}
        onFetchAddress={handleFetchAddress}
      />
      
      <ShopTimingStatus 
        shopData={shopData}
        days={days}
        onTimingChange={(day, field, value) => {
          setShopData((prev) => ({
            ...prev,
            timing: {
              ...prev.timing,
              [day]: {
                ...prev.timing[day],
                [field]: value,
              },
            },
          }));
        }}
        onClosedToggle={(day) => {
          setShopData((prev) => ({
            ...prev,
            timing: {
              ...prev.timing,
              [day]: {
                ...prev.timing[day],
                closed: !prev.timing[day].closed,
              },
            },
          }));
        }}
        onShopStatusToggle={() => {
          setShopData((prev) => ({
            ...prev,
            isOpen: !prev.isOpen,
          }));
        }}
      />

      <button
        onClick={handleSaveShop}
        disabled={isSaving || !shopData.shopName || !shopData.category || !shopData.address}
        className="w-full px-8 py-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-bold text-xl shadow-2xl transition transform hover:scale-[1.02] active:scale-[0.98]"
      >
        {isSaving ? '⏳ Saving...' : (isEditing ? '✏️ Update Shop' : '💾 Create Shop')}
      </button>
    </div>
  );
};

export default ShopTab;
