'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchLocationById } from '@/lib/api';

export default function LocationDetailPanel({ location, onClose }) {
  const locationId = location?._id || location?.id;

  const {
    data: detail,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['location', locationId],
    queryFn: () => fetchLocationById(locationId),
    enabled: !!locationId,
    initialData: location,
  });

  const imageUrl =
    detail?.imageUrl ||
    (Array.isArray(detail?.images) && detail.images[0]) ||
    null;

  const [lng, lat] = detail?.coordinates || [null, null];

  return (
    <div className="fixed right-0 top-0 bottom-0 w-96 z-20 bg-white shadow-xl overflow-y-auto">
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors z-10"
        aria-label="Close"
      >
        ✕
      </button>

      {isLoading && (
        <div className="flex items-center justify-center h-full">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {isError && (
        <div className="flex items-center justify-center h-full text-red-500 text-sm px-6">
          Unable to load details
        </div>
      )}

      {!isLoading && !isError && detail && (
        <>
          {imageUrl && (
            <img
              src={imageUrl}
              alt={detail.title}
              className="w-full h-48 object-cover rounded-b-xl"
            />
          )}

          <div className="mt-4 px-6 pb-8">
            <h1 className="text-2xl font-bold text-gray-900">{detail.title}</h1>

            {detail.type && (
              <span className="inline-block mt-2 bg-blue-100 text-blue-700 text-xs font-medium px-3 py-1 rounded-full capitalize">
                {detail.type}
              </span>
            )}

            <p className="text-gray-600 text-sm mt-3 leading-relaxed">
              {detail.description}
            </p>

            {detail.metadata && Object.keys(detail.metadata).length > 0 && (
              <div className="mt-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Details
                </h3>
                <dl className="space-y-1">
                  {Object.entries(detail.metadata).map(([key, value]) => (
                    <div key={key} className="flex gap-2 text-sm">
                      <dt className="text-gray-500 capitalize">{key}:</dt>
                      <dd className="text-gray-800 font-medium">{String(value)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {lng !== null && lat !== null && (
              <p className="text-xs text-gray-400 mt-4">
                📍 {Number(lat).toFixed(5)}, {Number(lng).toFixed(5)}
              </p>
            )}

            <div className="flex gap-3 mt-6">
              <button className="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold py-2.5 rounded-xl text-sm transition-colors">
                Save
              </button>
              <button className="flex-1 border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold py-2.5 rounded-xl text-sm transition-colors">
                Share
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
