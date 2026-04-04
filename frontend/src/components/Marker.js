'use client';

import { Marker as MapboxMarker } from 'react-map-gl';

export default function Marker({ location, onMarkerClick }) {
  const [lng, lat] = location.coordinates || [0, 0];

  return (
    <MapboxMarker longitude={lng} latitude={lat} anchor="center">
      <div
        className="relative flex items-center justify-center cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          onMarkerClick(location);
        }}
      >
        {/* Glow ring */}
        <div
          className="absolute w-8 h-8 rounded-full bg-blue-400/30"
          style={{ boxShadow: '0 0 0 4px rgba(37, 99, 235, 0.2)' }}
        />
        {/* Dot */}
        <div className="relative w-5 h-5 rounded-full bg-blue-600 border-2 border-white shadow-lg" />
      </div>
    </MapboxMarker>
  );
}
