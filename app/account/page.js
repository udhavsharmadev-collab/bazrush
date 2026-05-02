"use client";

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Phone, Mail, Calendar, MapPin, Save, LogOut, ArrowLeft, X } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';

const MapPicker = dynamic(() => import('../components/MapPicker.jsx'), { ssr: false });

const AccountPage = () => {
  const { user, logout, updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    email: '',
    address: '',
    lat: 20.5937,
    lng: 78.9629
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [locationFetched, setLocationFetched] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const messageRef = useRef(null);
  const savedProfileRef = useRef({}); // ✅ tracks last server value

  // ✅ fires on every poll — only updates fields user hasn't changed
  useEffect(() => {
    if (!user?.profile) return;
    const source = user.profile;

    setFormData(prev => ({
      name: prev.name === (savedProfileRef.current.name ?? '') ? source.name || '' : prev.name,
      age: prev.age === (savedProfileRef.current.age ?? '') ? source.age || '' : prev.age,
      email: prev.email === (savedProfileRef.current.email ?? '') ? source.email || '' : prev.email,
      address: prev.address === (savedProfileRef.current.address ?? '') ? source.address || '' : prev.address,
      lat: source.lat || 20.5937,
      lng: source.lng || 78.9629,
    }));

    savedProfileRef.current = source; // update tracked server value
  }, [user?.profile]); // ✅ fires every time poll updates user

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      setMessage('❌ Please fill name and email');
      setTimeout(() => messageRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      await updateProfile(formData);
      setMessage('✅ Profile updated successfully!');
    } catch (err) {
      setMessage('❌ Failed to update profile. Try again.');
    }
    setLoading(false);
    setTimeout(() => messageRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const handleFetchLocation = () => {
    setMessage('🔄 Fetching your location...');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
          );
          const data = await res.json();
          const fullAddress = data.display_name || 'Detected location';
          setFormData(prev => ({ ...prev, lat: latitude, lng: longitude, address: fullAddress }));
          setLocationFetched(true);
          setMessage(`✅ Location fetched! "${fullAddress.substring(0, 60)}..." — Click "Show Map" to fine-tune.`);
        } catch {
          const fallback = `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}`;
          setFormData(prev => ({ ...prev, lat: latitude, lng: longitude, address: fallback }));
          setLocationFetched(true);
          setMessage('✅ Coordinates fetched. Enter address manually or use map.');
        }
        setTimeout(() => messageRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      },
      () => {
        setMessage('❌ Location access denied. Please enter manually.');
        setTimeout(() => messageRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const handleMapLocationChange = (newLocation) => {
    setFormData(prev => ({ ...prev, ...newLocation }));
    setMessage('📍 Address updated from map drag!');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-purple-900/20 to-black">
        <Link href="/" className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-xl font-semibold shadow-xl flex items-center">
          <ArrowLeft className="w-5 h-5 mr-2" /> Go Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl">
            <User className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">My Account</h1>
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center justify-center space-x-3 text-gray-700">
              <Phone className="w-5 h-5" />
              <span className="font-semibold">{user.phone || user.profile?.phone || 'N/A'}</span>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-2xl p-6 shadow-lg">
          <form onSubmit={handleSubmit} className="space-y-4">

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <User className="w-4 h-4 mr-2 text-purple-600" /> Full Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter your full name"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Calendar className="w-4 h-4 mr-2 text-purple-600" /> Age
              </label>
              <input
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                placeholder="Your age"
                min="13" max="120"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Mail className="w-4 h-4 mr-2 text-purple-600" /> Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="your.email@example.com"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                <MapPin className="w-4 h-4 mr-2 text-purple-600" /> Address & Location
              </label>
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleFetchLocation}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center space-x-2 text-sm"
                >
                  <MapPin className="w-4 h-4" />
                  <span>📍 Fetch My Location</span>
                </button>

                {locationFetched && (
                  <button
                    type="button"
                    onClick={() => setShowMap(!showMap)}
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center space-x-2 text-sm"
                  >
                    <MapPin className="w-4 h-4" />
                    <span>{showMap ? 'Hide Map' : '🗺️ Show Map & Drag Marker'}</span>
                  </button>
                )}

                <textarea
                  rows="3"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Address auto-fills from location fetch. Drag map marker to adjust."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all resize-none"
                />
              </div>

              {showMap && (
                <div className="mt-4 p-4 bg-white rounded-2xl border-2 border-green-200 shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-bold text-lg text-green-800 flex items-center space-x-2">
                      <MapPin className="w-5 h-5" />
                      <span>Drag to adjust location</span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => setShowMap(false)}
                      className="p-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                    >
                      <X className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                  <div className="h-[300px] rounded-xl overflow-hidden border-2 border-gray-200">
                    <MapPicker
                      onLocationChange={handleMapLocationChange}
                      initialPosition={[formData.lat, formData.lng]}
                      initialZoom={16}
                    />
                  </div>
                </div>
              )}
            </div>

            {message && (
              <div
                ref={messageRef}
                className={`p-4 rounded-2xl text-sm font-medium text-center ${
                  message.startsWith('✅') ? 'bg-green-100 border-2 border-green-300 text-green-800'
                  : message.startsWith('🔄') ? 'bg-blue-100 border-2 border-blue-300 text-blue-800'
                  : 'bg-red-100 border-2 border-red-300 text-red-800'
                }`}
              >
                {message}
              </div>
            )}

            <div className="flex flex-col gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold py-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all disabled:opacity-50 flex items-center justify-center space-x-2 text-lg"
              >
                {loading ? (
                  <>
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Saving Profile...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>Save Profile</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={logout}
                className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold py-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all flex items-center justify-center"
              >
                <LogOut className="w-5 h-5 mr-2" />
                Logout
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default AccountPage;