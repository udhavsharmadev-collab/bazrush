"use client";

import dynamic from 'next/dynamic';
import { MapPin } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';

// Dynamic imports - SSR safe
const MapContainer = dynamic(() => import('react-leaflet').then(mod => ({ default: mod.MapContainer })), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => ({ default: mod.TileLayer })), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => ({ default: mod.Marker })), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => ({ default: mod.Popup })), { ssr: false });

const MapPicker = ({ onLocationChange, initialPosition = [20.5937, 78.9629], initialZoom = 16 }) => {
  const [position, setPosition] = useState(initialPosition);
  const [address, setAddress] = useState('');
  const markerRef = useRef(null);
  const leafletLoaded = useRef(false);

  // Fix Leaflet icons CLIENT-SIDE only
  useEffect(() => {
    if (typeof window !== 'undefined' && !leafletLoaded.current) {
      import('leaflet').then(L => {
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });
        leafletLoaded.current = true;
      });
    }
  }, []);

  const reverseGeocode = async (lat, lng) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
      const data = await res.json();
      const addr = data.display_name || `${data.address?.road || ''}, ${data.address?.city || ''}, ${data.address?.state || ''}`.trim() || 'Unknown location';
      return addr;
    } catch {
      return 'Drag marker to set location';
    }
  };

  const handleDragEnd = async (e) => {
    const marker = markerRef.current;
    if (marker) {
      const latlng = marker.getLatLng();
      setPosition([latlng.lat, latlng.lng]);
      const addr = await reverseGeocode(latlng.lat, latlng.lng);
      setAddress(addr);
      onLocationChange({ lat: latlng.lat, lng: latlng.lng, address: addr });
    }
  };

  return (
    <div className="h-64 rounded-xl overflow-hidden shadow-lg relative">
      <MapContainer center={position} zoom={initialZoom} style={{ height: '100%', width: '100%' }} dragging>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker 
          position={position} 
          draggable 
          ref={markerRef}
          eventHandlers={{
            dragend: handleDragEnd,
          }}
        >
          <Popup>Delivered Here <MapPin className="inline ml-1" /></Popup>
        </Marker>
      </MapContainer>
      {address && (
        <div className="absolute bottom-2 left-2 right-2 bg-white/90 backdrop-blur-sm p-2 rounded-lg text-xs text-gray-700">
          {address}
        </div>
      )}
    </div>
  );
};

export default MapPicker;

