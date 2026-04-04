'use client';

export default function FloatingSearchCard() {
  return (
    <div className="absolute top-20 left-4 right-4 md:right-auto md:w-80 z-10">
      <div className="bg-white rounded-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] p-4">
        <div className="flex items-center gap-3">
          <svg
            className="w-5 h-5 text-gray-400 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search places..."
            className="flex-1 text-sm text-gray-700 placeholder-gray-400 outline-none bg-transparent"
            readOnly
          />
        </div>
      </div>
    </div>
  );
}
