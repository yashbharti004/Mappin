'use client';

import { useState, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import MapView from '@/components/MapView';
import FloatingSearchCard from '@/components/FloatingSearchCard';
import BottomSheet from '@/components/BottomSheet';
import LocationDetailPanel from '@/components/LocationDetailPanel';
import AddLocationModal from '@/components/AddLocationModal';

export default function Home() {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [clickedCoords, setClickedCoords] = useState(null);
  const [showDetailPanel, setShowDetailPanel] = useState(false);

  const handleMapClick = useCallback((coords) => {
    setClickedCoords(coords);
    setShowAddModal(true);
  }, []);

  const handleMarkerClick = useCallback((location) => {
    setSelectedLocation(location);
    setShowDetailPanel(true);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedLocation(null);
    setShowDetailPanel(false);
  }, []);

  const handleCloseModal = useCallback(() => {
    setShowAddModal(false);
    setClickedCoords(null);
  }, []);

  const handleAddLocation = useCallback(() => {
    setShowAddModal(true);
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-white">
      <div className="absolute inset-0 z-0">
        <MapView
          onMapClick={handleMapClick}
          onMarkerClick={handleMarkerClick}
          selectedLocation={selectedLocation}
        />
      </div>

      <div className="relative z-20">
        <Navbar onAddLocation={handleAddLocation} />
      </div>

      <div className="absolute inset-x-0 top-0 z-10 pointer-events-none">
        <div className="pointer-events-auto">
          <FloatingSearchCard />
        </div>
      </div>

      {/* Desktop: side panel (hidden on mobile) */}
      {showDetailPanel && (
        <div className="hidden md:block">
          <LocationDetailPanel
            location={selectedLocation}
            onClose={handleCloseDetail}
          />
        </div>
      )}

      {/* Mobile: bottom sheet (always present, hidden on desktop when side panel is active) */}
      <div className={showDetailPanel ? 'md:hidden' : ''}>
        <BottomSheet
          selectedLocation={selectedLocation}
          onClose={handleCloseDetail}
        />
      </div>

      {showAddModal && (
        <AddLocationModal
          coords={clickedCoords}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
