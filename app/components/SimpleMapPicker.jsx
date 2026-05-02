"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapPin } from 'lucide-react';

// Leaflet marker fix
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const SimpleMapPicker = ({ onLocationChange }) => {
  const [position, setPosition] = useState([20.5937, 78.9629]);
  const [address, setAddress] = useState('');
  const [loadingLoc, setLoadingLoc] = useState(false);
  const markerRef = useRef(null);
  const geocodeTimeoutRef = useRef(null);

  // Debounced reverse geocoding (max 1 call per 1.5s)
  const reverseGeocode = useCallback(async (lat, lng, immediate = false) => {
    if (geocodeTimeoutRef.current && !immediate) clearTimeout(geocodeTimeoutRef.current);
    
    const doGeocode = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        if (!res.ok) throw new Error('Geocoding failed');
        const data = await res.json();
        const addr = data.display_name || `${data.address?.road || ''}, ${data.address?.city || data.address?.town || ''}`;
        setAddress(addr);
        onLocationChange({ lat, lng, address: addr });
      } catch (err) {
        // Silently fail - keep existing address
        console.warn('Geocoding error:', err.message);
      }
    };

    if (immediate) {
      await doGeocode();
    } else {
      geocodeTimeoutRef.current = setTimeout(doGeocode, 1500);
    }
  }, [onLocationChange]);

  const handleDragEnd = useCallback(async (e) => {
    const marker = markerRef.current;
    if (marker) {
      const latlng = marker.getLatLng();
      setPosition([latlng.lat, latlng.lng]);
      await reverseGeocode(latlng.lat, latlng.lng);
    }
  }, [reverseGeocode]);

  const fetchLocation = useCallback(() => {
    setLoadingLoc(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setPosition([latitude, longitude]);
        await reverseGeocode(latitude, longitude, true);
        setLoadingLoc(false);
      },
      () => {
        setLoadingLoc(false);
      },
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 }
    );
  }, [reverseGeocode]);

  return (
    <div className="space-y-3">
      <button
        onClick={fetchLocation}
        disabled={loadingLoc}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center space-x-2 text-sm px-4"
      >
        {loadingLoc ? (
          <>
            <div className="w-4 h-4 border-2 border-white rounded-full animate-spin" />
            <span>Fetching...</span>
          </>
        ) : (
          <>
            <MapPin className="w-4 h-4" />
            <span>Fetch Location</span>
          </>
        )}
      </button>
      <div className="h-64 rounded-xl overflow-hidden shadow-lg relative border">
        <MapContainer center={position} zoom={16} style={{ height: '100%', width: '100%' }} dragging>
          <TileLayer
            attribution='&copy; OpenStreetMap'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker 
            position={position} 
            draggable 
            ref={markerRef}
            eventHandlers={{ dragend: handleDragEnd }}
          >
            <Popup>Drag to set delivery location</Popup>
          </Marker>
        </MapContainer>
        {address && (
          <div className="absolute bottom-2 left-2 right-2 bg-white/95 p-2 rounded text-xs font-medium text-gray-800">
            📍 {address}
          </div>
        )}
      </div>
    </div>
  );
};

export default SimpleMapPicker;

