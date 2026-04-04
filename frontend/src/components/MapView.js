'use client';

import { useRef, useCallback, useEffect } from 'react';
import Map, { NavigationControl, GeolocateControl } from 'react-map-gl';
import { useLocations } from '@/hooks/useLocations';
import Marker from './Marker';

export default function MapView({ onMapClick, onMarkerClick, selectedLocation }) {
  const mapRef = useRef(null);
  const { data: locations, isLoading, isError } = useLocations();

  useEffect(() => {
    if (!selectedLocation || !mapRef.current) return;
    const [lng, lat] = selectedLocation.location?.coordinates || selectedLocation.coordinates || [0, 0];
    mapRef.current.easeTo({
      center: [lng, lat],
      padding: { bottom: 250 },
      duration: 400,
    });
  }, [selectedLocation]);

  const handleMapClick = useCallback(
    (event) => {
      const { lngLat } = event;
      onMapClick({ lat: lngLat.lat, lng: lngLat.lng });
    },
    [onMapClick]
  );

  return (
    <div className="relative w-full h-full">
      <Map
        ref={mapRef}
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
        initialViewState={{
          longitude: 79.0882,
          latitude: 21.1458,
          zoom: 12,
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/light-v11"
        onClick={handleMapClick}
      >
        <NavigationControl position="top-right" />
        <GeolocateControl
          position="top-right"
          trackUserLocation
          showUserHeading
        />

        {locations &&
          locations.map((location) => (
            <Marker
              key={location._id || location.id}
              location={location}
              onMarkerClick={onMarkerClick}
            />
          ))}
      </Map>

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/60 pointer-events-none">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {isError && (
        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-lg px-4 py-2 text-sm text-red-500 pointer-events-none">
          Failed to load locations
        </div>
      )}
    </div>
  );
}
