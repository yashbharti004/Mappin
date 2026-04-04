'use client';

export default function Navbar({ onAddLocation }) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-30 bg-white border-b border-gray-100 shadow-sm">
      <div className="flex items-center justify-between h-16 px-4 max-w-7xl mx-auto">
        <span className="text-xl font-bold text-blue-600 tracking-tight">
          📍 Mappin
        </span>
        <button
          onClick={onAddLocation}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          Add Location
        </button>
      </div>
    </nav>
  );
}
