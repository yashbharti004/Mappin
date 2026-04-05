"use client";

import { useState, useEffect, useRef } from "react";
import Map, { Marker, MapRef, Source, Layer } from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";
import { Search, MapPin, X, ImagePlus, User, Loader2, Trash2, Navigation, Car } from "lucide-react";

export default function Home() {
  const mapRef = useRef<MapRef>(null);

  const [bottomSheetState, setBottomSheetState] = useState<"peeking" | "mid" | "full">("peeking");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedPinId, setHighlightedPinId] = useState<string | null>(null);
  
  const [routeInfo, setRouteInfo] = useState<{distance: string, duration: string, speed?: string} | null>(null);
  const [routeGeoJSON, setRouteGeoJSON] = useState<any>(null);
  const [isRouting, setIsRouting] = useState(false);

  const [isAddLocationOpen, setIsAddLocationOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{lng: number, lat: number} | null>(null);
  
  const [formData, setFormData] = useState<{title: string, description: string, images: string[]}>({ title: "", description: "", images: [] });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [savedLocations, setSavedLocations] = useState<any[]>([]);
  const [viewingLocation, setViewingLocation] = useState<any>(null);

  const fetchLocations = async () => {
    try {
      const res = await fetch("http://localhost:4000/locations");
      const data = await res.json();
      setSavedLocations(data);
    } catch {
      console.error("Failed to load pins.");
    }
  };

  useEffect(() => { fetchLocations(); }, []);

  const handleMapClick = (e: any) => {
    if (viewingLocation) setViewingLocation(null);
    setSelectedLocation({ lng: e.lngLat.lng, lat: e.lngLat.lat });
    setIsAddLocationOpen(true);
    setHighlightedPinId(null); // Click anywhere removes tracking highlights
    setRouteInfo(null);
    setRouteGeoJSON(null);
    setBottomSheetState("peeking");
  };

  const handleMarkerClick = (loc: any, e: any) => {
    e.originalEvent.stopPropagation();
    setViewingLocation(loc);
    setSelectedLocation(null);
    setIsAddLocationOpen(false);
    setIsSearchOpen(false);
    setRouteInfo(null);
    setRouteGeoJSON(null);
    mapRef.current?.easeTo({
      center: loc.location.coordinates,
      padding: { bottom: 400 },
      duration: 1000
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    setIsUploading(true);
    setUploadProgress(0);

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset || cloudName === "your_cloud_name") {
      alert("Please configure your NEXT_PUBLIC_CLOUDINARY variables in .env.local first!");
      setIsUploading(false);
      return;
    }

    const uploadedUrls: string[] = [];
    
    try {
      const uploadPromises = Array.from(files).map(async (file, index) => {
        const cloudFormData = new FormData();
        cloudFormData.append("file", file);
        cloudFormData.append("upload_preset", uploadPreset);
        
        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { 
          method: "POST", 
          body: cloudFormData 
        });
        
        const data = await res.json();
        if (!res.ok) {
           throw new Error(data.error?.message || "Unknown upload error");
        }
        
        setUploadProgress(prev => prev + (100 / files.length));
        return data.secure_url;
      });

      const urls = await Promise.all(uploadPromises);
      uploadedUrls.push(...urls);
      setFormData(prev => ({ ...prev, images: [...prev.images, ...uploadedUrls] }));
      
    } catch (err: any) {
      console.error(err);
      alert(`Cloudinary Upload Failed: ${err.message}. Ensure your preset is 'Unsigned'!`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleCreateLocation = async () => {
    if (!formData.title || !formData.description || !selectedLocation) return;
    setIsSubmitting(true);
    
    try {
      const res = await fetch("http://localhost:4000/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          images: formData.images,
          coordinates: [selectedLocation.lng, selectedLocation.lat]
        })
      });
      if (res.ok) {
        setIsAddLocationOpen(false);
        setFormData({title: "", description: "", images: []});
        setSelectedLocation(null);
        await fetchLocations();
      }
    } catch {
      alert("Failed to connect to backend server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLocation = async (id: string) => {
    setIsDeleting(true);
    try {
      const res = await fetch(`http://localhost:4000/locations/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setViewingLocation(null);
        setHighlightedPinId(null);
        await fetchLocations(); // Reloads map without the deleted pin!
      } else {
        alert("Failed to delete location.");
      }
    } catch {
      alert("Backend connectivity lost.");
    } finally {
      setIsDeleting(false);
    }
  };

  const executeHybridSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setRouteInfo(null);
    setRouteGeoJSON(null);

    const queryLower = searchQuery.toLowerCase();
    // 1. Search locally within MongoDB Pins first
    const localMatch = savedLocations.find(loc => loc.title.toLowerCase().includes(queryLower) || (loc.description && loc.description.toLowerCase().includes(queryLower)));

    if (localMatch) {
       // We found it inside our own DB! Switch it to Green and fly to it!
       setHighlightedPinId(localMatch._id);
       mapRef.current?.flyTo({ center: localMatch.location.coordinates, zoom: 14, duration: 1500 });
       setIsSearchOpen(false);
       setSearchQuery("");
       setViewingLocation(localMatch); // Open the details tab too
       return;
    }

    // 2. Global Mapbox API Search implementation
    try {
       const mbToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
       const res = await fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=${mbToken}&limit=1`);
       const data = await res.json();
       
       if (data.features && data.features.length > 0) {
         setHighlightedPinId(null);
         setViewingLocation(null);
         const [lng, lat] = data.features[0].center;
         // Fly the camera globally
         mapRef.current?.flyTo({ center: [lng, lat], zoom: 12, duration: 2500 });
         setIsSearchOpen(false);
         setSearchQuery("");
       } else {
         alert("Unable to map this place. Try another keyword!");
       }
    } catch {
       alert("Mapbox Geocoding service failed... Check network config.");
    }
  };

  const handleGetDirections = () => {
    if (!viewingLocation) return;
    setIsRouting(true);
    
    if (!navigator.geolocation) {
       alert("Geolocation is not supported by your browser.");
       setIsRouting(false);
       return;
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
       try {
         const { longitude: userLng, latitude: userLat } = position.coords;
         const [destLng, destLat] = viewingLocation.location.coordinates;
         
         const mbToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
         const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${userLng},${userLat};${destLng},${destLat}?geometries=geojson&access_token=${mbToken}`;
         
         const res = await fetch(url);
         const data = await res.json();
         
         if (data.routes && data.routes.length > 0) {
            const route = data.routes[0];
            const distanceKm = (route.distance / 1000).toFixed(1); // meters to km
            const durationMin = Math.round(route.duration / 60); // seconds to min
            const speedKmh = ((route.distance / 1000) / (route.duration / 3600)).toFixed(0); 

            setRouteInfo({ distance: `${distanceKm} km`, duration: `${durationMin} min`, speed: `${speedKmh} km/h` });
            
            setRouteGeoJSON({
              type: 'Feature',
              properties: {},
              geometry: route.geometry
            });
            
            if (mapRef.current) {
              // Zoom out a bits to fit route
              mapRef.current.easeTo({ zoom: 12, padding: { bottom: 300 } });
            }
         } else {
            alert("Could not find a route to this destination.");
         }
       } catch (err) {
         console.error(err);
         alert("Failed to fetch directions.");
       } finally {
         setIsRouting(false);
       }
    }, (error) => {
       alert("Unable to retrieve your location. Please check browser permissions.");
       setIsRouting(false);
    });
  };

  return (
    <main className="relative w-screen h-screen bg-gray-100 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Map
          ref={mapRef}
          mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
          initialViewState={{ longitude: 79.0882, latitude: 21.1458, zoom: 12 }}
          mapStyle="mapbox://styles/mapbox/navigation-day-v1"
          onClick={handleMapClick}
        >
          {savedLocations.map((loc) => {
            const isHighlighted = loc._id === highlightedPinId;
            return (
              <Marker key={loc._id} longitude={loc.location.coordinates[0]} latitude={loc.location.coordinates[1]} anchor="bottom" onClick={(e) => handleMarkerClick(loc, e)}>
                <div className={`w-8 h-8 rounded-full border-4 border-white flex items-center justify-center cursor-pointer hover:scale-110 transition-transform ${isHighlighted ? 'bg-green-500 shadow-[0_4px_25px_rgba(34,197,94,0.7)] animate-pulse' : 'bg-red-500 shadow-[0_4px_15px_rgba(239,68,68,0.5)]'}`}>
                   <div className="w-2 h-2 bg-white rounded-full" />
                </div>
              </Marker>
            );
          })}

          {selectedLocation && !viewingLocation && (
             <Marker longitude={selectedLocation.lng} latitude={selectedLocation.lat} anchor="bottom">
               <div className="w-8 h-8 rounded-full bg-blue-600 border-4 border-white shadow-[0_0_20px_rgba(37,99,235,0.6)] flex items-center justify-center animate-bounce">
                  <div className="w-2 h-2 bg-white rounded-full" />
               </div>
             </Marker>
          )}

          {routeGeoJSON && (
            <Source id="route" type="geojson" data={routeGeoJSON}>
              <Layer 
                id="routeLayer" 
                type="line" 
                source="route" 
                layout={{ 'line-join': 'round', 'line-cap': 'round' }} 
                paint={{ 'line-color': '#3b9ddd', 'line-width': 5 }} 
              />
            </Source>
          )}
        </Map>
      </div>

      <div 
        className="absolute top-8 left-1/2 -translate-x-1/2 w-11/12 max-w-md z-10 cursor-pointer"
        onClick={() => { setIsSearchOpen(true); setIsAddLocationOpen(false); }}
      >
        <div className="bg-white rounded-2xl p-4 flex items-center shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
           <Search className="text-gray-400 w-5 h-5 mr-3" />
           <span className="text-gray-500 font-medium">{highlightedPinId ? "Showing Search Result!" : "Search for a place..."}</span>
        </div>
      </div>

      {isSearchOpen && (
        <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-md p-6 flex flex-col">
           <form onSubmit={executeHybridSearch} className="flex items-center mb-6 mt-4">
             <input autoFocus type="text" placeholder="Search local pins or cities..." className="flex-1 text-3xl font-bold bg-transparent outline-none placeholder-gray-300" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
             <button type="submit" onClick={() => {if (!searchQuery) setIsSearchOpen(false)}} className="p-3 bg-gray-100 rounded-full hover:bg-gray-200 ml-4 transition-colors"><X className="w-6 h-6"/></button>
           </form>
           <p className="text-gray-400 text-sm mt-4 text-center">Press Enter. Matches your Pins first, then World Geography.</p>
        </div>
      )}

      {/* VIEWING DETAILS PANEL WITH DELETE BUTTON */}
      {viewingLocation && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-11/12 max-w-md z-50 bg-white rounded-[32px] shadow-[0_-15px_40px_rgba(0,0,0,0.15)] flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-300">
           {/* Swipeable Image Filmstrip */}
           {viewingLocation.images && viewingLocation.images.length > 0 ? (
              <div className="w-full h-64 flex overflow-x-auto snap-x snap-mandatory no-scrollbar bg-black border-b border-gray-100">
                 {viewingLocation.images.map((img: string, i: number) => (
                    <img key={i} src={img} alt={`${viewingLocation.title} - ${i}`} className="w-full h-full object-contain shrink-0 snap-center p-2" />
                 ))}
                 {viewingLocation.images.length > 1 && (
                     <div className="absolute top-4 right-4 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-md pointer-events-none font-medium z-10">
                       Swipe to explore ({viewingLocation.images.length})
                     </div>
                 )}
              </div>
           ) : (
              <div className="w-full h-32 bg-gray-100 flex flex-col items-center justify-center">
                 <ImagePlus className="text-gray-300 w-8 h-8 mb-2" />
                 <span className="text-gray-400 text-xs font-medium uppercase tracking-widest">No Media Found</span>
              </div>
           )}
           <div className="p-6">
             <div className="flex justify-between items-start mb-2">
                 <h3 className="font-bold text-2xl text-gray-900">{viewingLocation.title}</h3>
                 <button onClick={() => setViewingLocation(null)} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"><X className="w-4 h-4 text-gray-500" /></button>
             </div>
             
             <div className="flex justify-between items-center mb-4">
                 <div className="text-xs text-gray-500 bg-gray-50 p-2 inline-flex items-center rounded-lg">
                   <MapPin className={`w-3 h-3 mr-1 ${viewingLocation._id === highlightedPinId ? 'text-green-500' : 'text-red-500'}`} /> 
                   {viewingLocation.location.coordinates[0].toFixed(4)}, {viewingLocation.location.coordinates[1].toFixed(4)}
                 </div>
                 
                 {/* DIRECTIONS AND DELETE EXPORT */}
                 <div className="flex gap-2">
                   <button onClick={handleGetDirections} disabled={isRouting} className="text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors p-2 rounded-lg flex items-center">
                      {isRouting ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Navigation className="w-3.5 h-3.5 mr-1" />} {isRouting ? "Loading..." : "Directions"}
                   </button>
                   <button onClick={() => handleDeleteLocation(viewingLocation._id)} disabled={isDeleting} className="text-xs font-bold text-red-500 bg-red-50 hover:bg-red-100 transition-colors p-2 rounded-lg flex items-center">
                      {isDeleting ? "..." : <><Trash2 className="w-3.5 h-3.5 mr-1" /> Delete</>}
                   </button>
                 </div>
             </div>

             {routeInfo && (
                <div className="flex bg-blue-50 border border-blue-100 rounded-xl p-3 mb-4 items-center justify-between">
                  <div className="flex items-center">
                    <Car className="w-5 h-5 text-blue-500 mr-3" />
                    <div>
                      <p className="text-[10px] text-blue-800 font-semibold uppercase tracking-wider">Driving Estimate</p>
                      <p className="text-sm text-blue-900 font-bold">{routeInfo.duration} • {routeInfo.distance}</p>
                    </div>
                  </div>
                  {routeInfo.speed && (
                    <div className="text-right">
                       <p className="text-[10px] text-blue-800 font-semibold uppercase tracking-wider">Avg Speed</p>
                       <p className="text-sm text-blue-900 font-bold">{routeInfo.speed}</p>
                    </div>
                  )}
                </div>
             )}

             <div className="w-full bg-gray-50 rounded-xl p-4 border border-gray-100 max-h-[150px] overflow-y-auto no-scrollbar">
               <p className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed">{viewingLocation.description || "No description available"}</p>
             </div>
           </div>
        </div>
      )}

      {/* ADD LOCATION FORM OVERLAY */}
      {isAddLocationOpen && selectedLocation && !viewingLocation && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-11/12 max-w-md z-50 bg-white rounded-[32px] shadow-[0_-15px_40px_rgba(0,0,0,0.15)] p-6 animate-in slide-in-from-bottom duration-300">
           <div className="flex justify-between items-center mb-4">
             <h3 className="font-bold text-xl text-gray-900">Add New Pin</h3>
             <button onClick={() => setIsAddLocationOpen(false)} className="p-2 bg-gray-100 hover:bg-gray-200 transition-colors rounded-full"><X className="w-4 h-4 text-gray-500" /></button>
           </div>
           
           <input type="text" placeholder="Title" className="w-full bg-gray-100 rounded-xl p-4 mb-3 outline-none focus:ring-2 focus:ring-blue-600 transition-all font-medium" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
           <textarea placeholder="Description" rows={3} className="w-full bg-gray-100 rounded-xl p-4 mb-4 outline-none resize-none focus:ring-2 focus:ring-blue-600 transition-all text-sm" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
           
           <div className="mb-6 flex gap-3">
             <label className="flex-[1_1_0%] flex flex-col items-center justify-center bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-2 cursor-pointer hover:bg-gray-100 transition-colors overflow-hidden">
               <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} />
               {isUploading ? (
                  <div className="flex flex-col items-center">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600 mb-1" />
                    <span className="text-blue-600 text-xs font-bold">{Math.round(uploadProgress)}%</span>
                  </div>
               ) : formData.images.length > 0 ? (
                  <div className="flex flex-col items-center">
                     <span className="text-blue-600 text-sm font-bold">{formData.images.length} added</span>
                     <span className="text-gray-400 text-[10px] mt-1 text-center leading-none">Click to add<br/>more</span>
                  </div>
               ) : (
                  <><ImagePlus className="w-5 h-5 text-gray-400 mb-1" /><span className="text-gray-500 text-xs font-medium text-center">Upload<br/>Photos</span></>
               )}
             </label>
             <button disabled={!formData.title || !formData.description || isSubmitting || isUploading} onClick={handleCreateLocation} className="flex-[2_2_0%] bg-blue-600 text-white font-bold rounded-xl disabled:bg-blue-300 transition-colors shadow-lg shadow-blue-600/30">
               {isSubmitting ? "Saving..." : "Save"}
             </button>
           </div>
        </div>
      )}

      {/* Ambient Exploring Mode Sheet */}
      {!isAddLocationOpen && !isSearchOpen && !viewingLocation && (
        <div 
          className="absolute bottom-0 left-0 w-full bg-white rounded-t-[32px] shadow-[0_-15px_40px_rgba(0,0,0,0.08)] z-20 transition-all duration-300 ease-in-out flex flex-col items-center p-6"
          style={{ height: bottomSheetState === "peeking" ? "120px" : bottomSheetState === "mid" ? "50vh" : "90vh" }}
        >
          <div className="w-12 h-1.5 bg-gray-200 hover:bg-gray-300 rounded-full mb-6 cursor-pointer transition-colors" onClick={() => setBottomSheetState(prev => prev === "peeking" ? "mid" : prev === "mid" ? "full" : "peeking")} />
          <div className="w-full text-left max-w-md mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Explore Map</h2>
            <p className="text-gray-500 font-medium mb-6">Tap anywhere on the map to drop a pin or click Search.</p>
          </div>
        </div>
      )}
    </main>
  );
}
