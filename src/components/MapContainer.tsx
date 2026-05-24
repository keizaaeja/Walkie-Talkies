import { useEffect, useRef, useState } from "react";
import { 
  Map, 
  AdvancedMarker, 
  InfoWindow, 
  Pin, 
  useMap, 
  useMapsLibrary, 
  useAdvancedMarkerRef 
} from "@vis.gl/react-google-maps";
import { Place } from "../types";
import { Navigation, Coffee, Landmark, Sparkles, Compass } from "lucide-react";

interface MapContainerProps {
  userLocation: google.maps.LatLngLiteral | null;
  places: Place[];
  selectedPlace: Place | null;
  itinerary: Place[];
  onSelectPlace: (place: Place | null) => void;
  onAskAIAboutPlace: (place: Place) => void;
}

// Custom Route Display with computeRoutes
function ItineraryPath({ 
  origin, 
  waypoints 
}: { 
  origin: google.maps.LatLngLiteral; 
  waypoints: Place[];
}) {
  const map = useMap();
  const routesLib = useMapsLibrary("routes");
  const polylinesRef = useRef<google.maps.Polyline[]>([]);

  useEffect(() => {
    if (!routesLib || !map || !origin || waypoints.length === 0) return;
    
    // Clear previous polylines
    polylinesRef.current.forEach(p => p.setMap(null));
    polylinesRef.current = [];

    const destination = { lat: waypoints[waypoints.length - 1].lat, lng: waypoints[waypoints.length - 1].lng };
    const intermediates = waypoints.slice(0, -1).map(p => ({ location: { lat: p.lat, lng: p.lng } }));

    routesLib.Route.computeRoutes({
      origin: origin,
      destination: destination,
      intermediates: intermediates,
      travelMode: "WALKING",
      fields: ["path", "viewport"],
    })
    .then(({ routes }) => {
      if (routes && routes[0]) {
        const polylines = routes[0].createPolylines();
        polylines.forEach(p => {
          p.setOptions({
            strokeColor: "#38bdf8", 
            strokeOpacity: 0.85,
            strokeWeight: 5,
          });
          p.setMap(map);
        });
        polylinesRef.current = polylines;
        
        if (routes[0].viewport) {
          map.fitBounds(routes[0].viewport);
        }
      }
    })
    .catch(err => {
      console.error("Error computing itinerary route:", err);
    });

    return () => {
      polylinesRef.current.forEach(p => p.setMap(null));
    };
  }, [routesLib, map, origin, waypoints]);

  return null;
}

// Custom Marker with individual state to prevent multi-marker dialog conflicts
function MapMarker({
  place,
  isSelected,
  isOpen,
  onSelect,
  onAskAI
}: {
  place: Place;
  isSelected: boolean;
  isOpen: boolean;
  onSelect: () => void;
  onAskAI: () => void;
  key?: string;
}) {
  const [markerRef, marker] = useAdvancedMarkerRef();

  const getPinDetails = (category: string) => {
    switch (category) {
      case "cafe":
        return { color: "#f59e0b", glyph: "☕" };
      case "museum":
        return { color: "#0284c7", glyph: "🎨" };
      case "attraction":
        return { color: "#6366f1", glyph: "🏛️" };
      case "activity":
        return { color: "#10b981", glyph: "🌳" };
      default:
        return { color: "#64748b", glyph: "📍" };
    }
  };

  const pin = getPinDetails(place.category);

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={{ lat: place.lat, lng: place.lng }}
        onClick={() => {
          onSelect();
        }}
      >
        <Pin 
          background={pin.color} 
          glyph={pin.glyph} 
          borderColor="#020617" 
          scale={isSelected ? 1.2 : 1}
        />
      </AdvancedMarker>

      {isOpen && (
        <InfoWindow
          anchor={marker}
          onCloseClick={() => {
            onSelect(); // This will deselect the place, closing the popup
          }}
        >
          <div className="p-2 text-slate-800 min-w-44 max-w-64 font-sans">
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                {place.category === "cafe" && "Cafe"}
                {place.category === "museum" && "Museum"}
                {place.category === "attraction" && "Landmark"}
                {place.category === "activity" && "Activity"}
              </span>
              {place.distanceMeters !== undefined && (
                <span className="text-[10px] bg-sky-50 text-sky-700 px-1.5 py-0.5 rounded font-bold font-mono">
                  {place.distanceMeters}m
                </span>
              )}
            </div>

            <h4 className="text-sm font-bold text-slate-900 leading-snug mb-1">
              {place.name}
            </h4>

            {place.rating && (
              <div className="flex items-center gap-1 text-xs text-amber-500 mb-1.5">
                <span className="font-semibold">★</span>
                <span className="font-bold text-slate-800">{place.rating.toFixed(1)}</span>
                {place.reviewsCount && <span className="text-slate-450 font-medium">({place.reviewsCount})</span>}
              </div>
            )}

            {place.formattedAddress && (
              <p className="text-[10px] text-slate-500 line-clamp-2 mt-1 italic font-medium leading-relaxed">
                {place.formattedAddress}
              </p>
            )}

            <button
              onClick={(e) => {
                e.stopPropagation();
                onAskAI();
              }}
              className="mt-3.5 w-full bg-sky-500 hover:bg-sky-450 text-white font-bold flex items-center justify-center gap-1 py-1.5 px-3 rounded-lg text-xs tracking-tight transition-all active:scale-95 shadow-md shadow-sky-500/10"
            >
              Ask WalkieTalkies
            </button>
          </div>
        </InfoWindow>
      )}
    </>
  );
}

export default function MapContainer({
  userLocation,
  places,
  selectedPlace,
  itinerary,
  onSelectPlace,
  onAskAIAboutPlace
}: MapContainerProps) {
  const map = useMap();

  // Smoothly pan and zoom when userLocation changes
  useEffect(() => {
    if (map && userLocation) {
      map.panTo(userLocation);
      map.setZoom(15);
    }
  }, [map, userLocation]);

  // Smoothly pan to map marker when selectedPlace changes
  useEffect(() => {
    if (map && selectedPlace) {
      map.panTo({ lat: selectedPlace.lat, lng: selectedPlace.lng });
    }
  }, [map, selectedPlace]);

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-white/5 shadow-2xl bg-[#020617]">
      <Map
        defaultCenter={userLocation || { lat: 37.7749, lng: -122.4194 }}
        defaultZoom={15}
        mapId="DEMO_MAP_ID"
        internalUsageAttributionIds={["gmp_mcp_codeassist_v1_aistudio"]}
        style={{ width: "100%", height: "100%" }}
        disableDefaultUI={true}
        zoomControl={true}
        gestureHandling="greedy"
      >
        {/* User Current Location Marker */}
        {userLocation && (
          <AdvancedMarker position={userLocation} title="You correspond here">
            {/* Glowing user position custom HTML pin */}
            <div className="relative flex items-center justify-center" style={{ width: 32, height: 32 }}>
              <span className="absolute inline-flex h-full w-full rounded-full bg-sky-500/25 animate-ping opacity-75" />
              <div className="relative h-4.5 w-4.5 rounded-full bg-sky-400 border-[3px] border-[#020617] shadow-xl flex items-center justify-center accent-glow">
                <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
              </div>
            </div>
          </AdvancedMarker>
        )}

        {/* Nearby Place Markers */}
        {places.map((place) => (
          <MapMarker
            key={place.id}
            place={place}
            isSelected={selectedPlace?.id === place.id || itinerary.some(p => p.id === place.id)}
            isOpen={selectedPlace?.id === place.id}
            onSelect={() => onSelectPlace(place)}
            onAskAI={() => onAskAIAboutPlace(place)}
          />
        ))}

        {/* Dynamic Walk Path Overlay */}
        {userLocation && itinerary.length > 0 && (
          <ItineraryPath 
            origin={userLocation} 
            waypoints={itinerary}
          />
        )}
        {userLocation && itinerary.length === 0 && selectedPlace && (
          <ItineraryPath 
            origin={userLocation} 
            waypoints={[selectedPlace]}
          />
        )}
      </Map>

      {/* Floating coordinates indicator (Sleek minimalist style) */}
      {userLocation && (
        <div className="absolute top-4 left-4 z-10 backdrop-blur-md bg-[#020617]/75 border border-white/10 rounded-full px-4 py-1.5 flex items-center gap-2 text-slate-200 shadow-xl pointer-events-none">
          <Navigation className="h-3.5 w-3.5 text-sky-400 animate-pulse rotate-45" />
          <span className="text-[10px] font-mono tracking-wider font-bold text-slate-300">
            {userLocation.lat.toFixed(4)}°, {userLocation.lng.toFixed(4)}°
          </span>
        </div>
      )}
    </div>
  );
}

