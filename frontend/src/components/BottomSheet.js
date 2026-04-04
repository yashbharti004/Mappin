'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

const PEEK_HEIGHT = 100;

function getSnapHeights() {
  if (typeof window === 'undefined') return { peek: PEEK_HEIGHT, mid: 400, full: 700 };
  return {
    peek: PEEK_HEIGHT,
    mid: Math.round(window.innerHeight * 0.5),
    full: Math.round(window.innerHeight * 0.9),
  };
}

export default function BottomSheet({ selectedLocation, onClose }) {
  const [snapState, setSnapState] = useState('peeking');
  const [translateY, setTranslateY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);
  const dragStartY = useRef(0);
  const dragStartTranslate = useRef(0);
  const containerHeight = useRef(0);

  const getTranslateForSnap = useCallback((snap) => {
    const heights = getSnapHeights();
    const ch = containerHeight.current || (typeof window !== 'undefined' ? window.innerHeight : 800);
    return ch - heights[snap === 'peeking' ? 'peek' : snap === 'mid' ? 'mid' : 'full'];
  }, []);

  useEffect(() => {
    if (containerRef.current) {
      containerHeight.current = containerRef.current.offsetHeight;
    } else if (typeof window !== 'undefined') {
      containerHeight.current = window.innerHeight;
    }
    const snap = selectedLocation ? 'mid' : 'peeking';
    setSnapState(snap);
    setTranslateY(getTranslateForSnap(snap));
  }, [selectedLocation, getTranslateForSnap]);

  const snapTo = useCallback((snap) => {
    setSnapState(snap);
    setTranslateY(getTranslateForSnap(snap));
  }, [getTranslateForSnap]);

  const getNearestSnap = useCallback((currentTranslate) => {
    const ch = containerHeight.current || window.innerHeight;
    const heights = getSnapHeights();
    const snaps = [
      { name: 'peeking', translate: ch - heights.peek },
      { name: 'mid', translate: ch - heights.mid },
      { name: 'full', translate: ch - heights.full },
    ];
    let nearest = snaps[0];
    let minDist = Math.abs(currentTranslate - snaps[0].translate);
    for (const s of snaps) {
      const dist = Math.abs(currentTranslate - s.translate);
      if (dist < minDist) {
        minDist = dist;
        nearest = s;
      }
    }
    return nearest.name;
  }, []);

  /* ── Touch events ── */
  const onTouchStart = (e) => {
    setIsDragging(true);
    dragStartY.current = e.touches[0].clientY;
    dragStartTranslate.current = translateY;
  };

  const onTouchMove = (e) => {
    if (!isDragging) return;
    const delta = e.touches[0].clientY - dragStartY.current;
    const ch = containerHeight.current || window.innerHeight;
    const heights = getSnapHeights();
    const minTranslate = ch - heights.full;
    const maxTranslate = ch - heights.peek;
    const next = Math.max(minTranslate, Math.min(maxTranslate, dragStartTranslate.current + delta));
    setTranslateY(next);
  };

  const onTouchEnd = () => {
    setIsDragging(false);
    const nearest = getNearestSnap(translateY);
    snapTo(nearest);
  };

  /* ── Mouse events (desktop) ── */
  const onMouseDown = (e) => {
    setIsDragging(true);
    dragStartY.current = e.clientY;
    dragStartTranslate.current = translateY;
    e.preventDefault();
  };

  useEffect(() => {
    if (!isDragging) return;
    const onMouseMove = (e) => {
      const delta = e.clientY - dragStartY.current;
      const ch = containerHeight.current || window.innerHeight;
      const heights = getSnapHeights();
      const minTranslate = ch - heights.full;
      const maxTranslate = ch - heights.peek;
      const next = Math.max(minTranslate, Math.min(maxTranslate, dragStartTranslate.current + delta));
      setTranslateY(next);
    };
    const onMouseUp = () => {
      setIsDragging(false);
      const nearest = getNearestSnap(translateY);
      snapTo(nearest);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isDragging, translateY, getNearestSnap, snapTo]);

  const showClose = snapState === 'mid' || snapState === 'full';

  const imageUrl =
    selectedLocation?.imageUrl ||
    (Array.isArray(selectedLocation?.images) && selectedLocation.images[0]) ||
    null;

  return (
    <div
      ref={containerRef}
      className="fixed bottom-0 left-0 right-0 z-20"
      style={{ height: '100vh', pointerEvents: 'none' }}
    >
      <div
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.1)]"
        style={{
          transform: `translateY(${translateY}px)`,
          transition: isDragging ? 'none' : 'transform 300ms ease-out',
          height: '100vh',
          pointerEvents: 'auto',
        }}
      >
        {/* Handle */}
        <div
          className="flex justify-center cursor-grab active:cursor-grabbing select-none"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onMouseDown={onMouseDown}
        >
          <div className="w-10 h-1 bg-gray-300 rounded-full my-3" />
        </div>

        {/* Close button */}
        {showClose && (
          <button
            onClick={() => {
              onClose?.();
              snapTo('peeking');
            }}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        )}

        {/* Content */}
        <div className="px-5 pb-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 60px)' }}>
          {selectedLocation ? (
            <>
              {imageUrl && (
                <img
                  src={imageUrl}
                  alt={selectedLocation.title}
                  className="w-full h-48 object-cover rounded-xl mb-4"
                />
              )}
              <h2 className="text-xl font-bold text-gray-900 mb-1">
                {selectedLocation.title}
              </h2>
              <p className="text-gray-600 text-sm mb-4">
                {selectedLocation.description}
              </p>
              <button
                onClick={() => snapTo('full')}
                className="w-full bg-black hover:bg-gray-900 text-white font-bold py-3 rounded-xl transition-colors"
              >
                View Full Details
              </button>
            </>
          ) : (
            <>
              <h3 className="text-base font-semibold text-gray-800 mb-1">
                Suggested Places
              </h3>
              <p className="text-xs text-gray-400">Tap the map to explore or add a location.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
