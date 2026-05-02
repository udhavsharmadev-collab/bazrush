'use client';

import { useState, useEffect, lazy, Suspense } from 'react';
import { useAuth } from '../../context/AuthContext';
import { MapPin, Save, Phone, User, Home } from 'lucide-react';
const SimpleMapPicker = lazy(() => import('../SimpleMapPicker.jsx'));

const AddressForm = ({ addressToEdit, onClose, onSuccess }) => {
  const { user, saveAddress, updateAddress } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    landmark: '',
    type: 'home',
    isDefault: false
  });
  const [loading, setLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [locationData, setLocationData] = useState({ lat: 20.5937, lng: 78.9629, address: '' });

  useEffect(() => {
    if (user) {
      setFormData(prev => ({ ...prev, phone: user.phone }));
    }
  }, [user]);

  useEffect(() => {
    if (addressToEdit) {
      setFormData(addressToEdit);
    }
  }, [addressToEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.address) return;

    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (addressToEdit) {
      updateAddress(addressToEdit.id, formData);
    } else {
      saveAddress(formData);
    }

    setLoading(false);
    onSuccess();
    onClose?.();
  };

  const handleMapLocationChange = (newLocation) => {
    setLocationData(newLocation);
    setFormData(prev => ({ ...prev, address: newLocation.address }));
  };

  const addressTypes = [
    { value: 'home', label: 'Home', icon: '🏠' },
    { value: 'work', label: 'Work', icon: '🏢' },
    { value: 'other', label: 'Other', icon: '📍' }
  ];

  return (
    <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center">
            <MapPin className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {addressToEdit ? 'Edit Address' : 'Add Delivery Address'}
            </h2>
            <p className="text-gray-600">Save your address for quick delivery</p>
          </div>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="p-2 rounded-2xl hover:bg-gray-100 transition-colors"
          >
            <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
            <User className="w-4 h-4 mr-2 text-gray-400" />
            Full Name
          </label>
          <input
            type="text"
            placeholder="John Doe"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
            required
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
            <Phone className="w-4 h-4 mr-2 text-gray-400" />
            Phone Number
          </label>
          <input
            type="tel"
            placeholder="+91 91234 56789"
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all bg-gray-50"
            disabled
          />
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center">
            <Home className="w-4 h-4 mr-2 text-gray-400" />
            Complete Address
          </label>
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setShowMap(true)}
              className="w-full px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-all flex items-center justify-center space-x-2 text-sm"
            >
              📍 Fetch Loc & Show Map
            </button>
            <textarea
              rows={3}
              placeholder="House/Flat No, Street, Area/Locality, City, PIN Code"
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all resize-none"
              required
            />
            {showMap && (
              <div className="mt-4 p-4 bg-gray-50 rounded-2xl border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-gray-900 flex items-center space-x-2">
                    <MapPin className="w-5 h-5 text-green-600" />
                    <span>Delivered Here (Drag marker)</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowMap(false)}
                    className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 font-medium"
                  >
                    Hide Map
                  </button>
                </div>
                <div className="h-80">
                  <Suspense fallback={<div className="w-full h-full bg-gray-200 rounded animate-pulse flex items-center justify-center"><p className="text-gray-500">Loading map...</p></div>}>
                    <SimpleMapPicker onLocationChange={handleMapLocationChange} />
                  </Suspense>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Landmark */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Landmark (Optional)
          </label>
          <input
            type="text"
            placeholder="Near XYZ Mall, Opposite ABC Park"
            value={formData.landmark}
            onChange={(e) => setFormData({...formData, landmark: e.target.value})}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
          />
        </div>

        {/* Address Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Label this address as
          </label>
          <div className="grid grid-cols-3 gap-3">
            {addressTypes.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setFormData({...formData, type: type.value})}
                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center space-y-2 ${
                  formData.type === type.value
                    ? 'border-purple-500 bg-purple-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="text-2xl">{type.icon}</span>
                <span className="text-sm font-medium">{type.label}</span>
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold rounded-2xl shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-lg flex items-center justify-center space-x-2"
        >
          {loading ? (
            <>
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              <span>{addressToEdit ? 'Update Address' : 'Save Address'}</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default AddressForm;

