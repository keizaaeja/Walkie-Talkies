import React, { useState, useEffect } from "react";
import { APIProvider, useMapsLibrary } from "@vis.gl/react-google-maps";
import { 
  Sliders, 
  MapPin, 
  Search, 
  Compass, 
  ShieldAlert, 
  X, 
  Sparkles, 
  Navigation,
  RefreshCw,
  Map as MapIcon,
  MessageSquare
} from "lucide-react";
import MapContainer from "./components/MapContainer";
import ChatPanel from "./components/ChatPanel";
import PlacesList from "./components/PlacesList";
import PreferencesModal from "./components/PreferencesModal";
import { Place, Message, UserPreferences } from "./types";
import { motion, AnimatePresence } from "motion/react";

// Get API dynamic configuration
const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  "";

const hasValidKey = Boolean(API_KEY) && API_KEY !== "YOUR_API_KEY";

// Helper: Haversine distance in meters
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // metres
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// Subcomponent: Dashboard that operates inside the APIProvider
function Dashboard() {
  const placesLib = useMapsLibrary("places");
  const geocodingLib = useMapsLibrary("geocoding");

  // Coordinates coordinates
  const [userLocation, setUserLocation] = useState<google.maps.LatLngLiteral | null>(null);
  const [currentAddress, setCurrentAddress] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  // App states
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [itinerary, setItinerary] = useState<Place[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingChat, setIsLoadingChat] = useState<boolean>(false);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState<boolean>(false);
  const [isPrefsOpen, setIsPrefsOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"chat" | "places" | "itinerary">("chat");
  const [mobileView, setMobileView] = useState<"panel" | "map">("panel");

  const toggleItinerary = (place: Place) => {
    setItinerary(prev => 
      prev.find(p => p.id === place.id)
        ? prev.filter(p => p.id !== place.id)
        : [...prev, place]
    );
  };

  const [userPreferences, setUserPreferences] = useState<UserPreferences>({
    maxWalkingDistance: 1000,
    pace: "moderate",
    interests: ["Specialty Coffee", "Art Museums", "History & Monuments", "Public Parks & Nature"]
  });

  // Attempt Geolocation on mount
  useEffect(() => {
    handleGeolocation();
  }, []);

  const handleGeolocation = () => {
    if (!navigator.geolocation) {
      console.warn("Geolocation not supported. Search starting coordinates manually.");
      // Fallback center: Golden Gate San Francisco
      setUserLocation({ lat: 37.7694, lng: -122.4862 });
      setCurrentAddress("Golden Gate Park, San Francisco, CA");
      return;
    }

    setIsLoadingPlaces(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setUserLocation(coords);
        reverseGeocode(coords);
      },
      (error) => {
        console.warn("Geolocation access denied/failed:", error);
        // Fallback center: Midtown Manhattan New York
        setUserLocation({ lat: 40.7580, lng: -73.9855 });
        setCurrentAddress("Midtown Manhattan, New York, NY");
        setIsLoadingPlaces(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const reverseGeocode = (coords: { lat: number; lng: number }) => {
    if (!geocodingLib) {
      setCurrentAddress(`${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`);
      return;
    }
    const geocoder = new geocodingLib.Geocoder();
    geocoder.geocode({ location: coords }, (results, status) => {
      if (status === "OK" && results && results[0]) {
        setCurrentAddress(results[0].formatted_address);
      } else {
        setCurrentAddress(`${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`);
      }
    });
  };

  useEffect(() => {
    if (geocodingLib && userLocation && (!currentAddress || /^-?\d+\.\d+,\s*-?\d+\.\d+$/.test(currentAddress))) {
      reverseGeocode(userLocation);
    }
  }, [geocodingLib, userLocation]);

  // Perform Address / Point Search via searchByText
  const handleLocationSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!placesLib || !searchQuery.trim()) return;

    setIsLoadingPlaces(true);
    placesLib.Place.searchByText({
      textQuery: searchQuery,
      fields: ["location", "formattedAddress"],
      maxResultCount: 1,
    })
    .then(({ places }) => {
      if (places && places[0]) {
        const loc = places[0].location;
        if (loc) {
          const coords = { lat: loc.lat(), lng: loc.lng() };
          setUserLocation(coords);
          setCurrentAddress(places[0].formattedAddress || searchQuery);
          setSelectedPlace(null);
        }
      } else {
        alert("Location coordinate could not be mapped. Try typing a city, ZIP code, or specific point.");
      }
      setIsLoadingPlaces(false);
    })
    .catch((err) => {
      console.error("Search error:", err);
      setIsLoadingPlaces(false);
    });
  };

  // Scan walking-distance points of interest around coordinates
  useEffect(() => {
    if (!placesLib || !userLocation) return;

    setIsLoadingPlaces(true);
    const centerLatLng = new google.maps.LatLng(userLocation.lat, userLocation.lng);

    // Retrieve cafes, museums, attractions, and parks in parallel using standard Places SDK
    const searchPromises = [
      // 1. Cafes & Coffee Shops
      placesLib.Place.searchNearby({
        fields: ["id", "displayName", "location", "formattedAddress", "rating", "userRatingCount"],
        locationRestriction: { center: centerLatLng, radius: userPreferences.maxWalkingDistance },
        includedPrimaryTypes: ["cafe", "coffee_shop", "bakery"]
      })
      .then(({ places }) => 
        (places || []).map(p => ({
          id: p.id || Math.random().toString(),
          name: p.displayName || "Local Cafe",
          category: "cafe" as const,
          rating: p.rating,
          reviewsCount: p.userRatingCount,
          formattedAddress: p.formattedAddress,
          lat: p.location ? p.location.lat() : 0,
          lng: p.location ? p.location.lng() : 0,
        }))
      )
      .catch(() => []),

      // 2. Museums & Galleries
      placesLib.Place.searchNearby({
        fields: ["id", "displayName", "location", "formattedAddress", "rating", "userRatingCount"],
        locationRestriction: { center: centerLatLng, radius: userPreferences.maxWalkingDistance },
        includedPrimaryTypes: ["museum", "art_gallery"]
      })
      .then(({ places }) => 
        (places || []).map(p => ({
          id: p.id || Math.random().toString(),
          name: p.displayName || "Museum & Art Gallery",
          category: "museum" as const,
          rating: p.rating,
          reviewsCount: p.userRatingCount,
          formattedAddress: p.formattedAddress,
          lat: p.location ? p.location.lat() : 0,
          lng: p.location ? p.location.lng() : 0,
        }))
      )
      .catch(() => []),

      // 3. Landmarks, Viewpoints & Historical attractions
      placesLib.Place.searchNearby({
        fields: ["id", "displayName", "location", "formattedAddress", "rating", "userRatingCount"],
        locationRestriction: { center: centerLatLng, radius: userPreferences.maxWalkingDistance },
        includedPrimaryTypes: ["tourist_attraction", "historical_landmark", "point_of_interest"]
      })
      .then(({ places }) => 
        (places || []).map(p => ({
          id: p.id || Math.random().toString(),
          name: p.displayName || "Scenic Spot / Attraction",
          category: "attraction" as const,
          rating: p.rating,
          reviewsCount: p.userRatingCount,
          formattedAddress: p.formattedAddress,
          lat: p.location ? p.location.lat() : 0,
          lng: p.location ? p.location.lng() : 0,
        }))
      )
      .catch(() => []),

      // 4. Parks, Hiking & Outdoors
      placesLib.Place.searchNearby({
        fields: ["id", "displayName", "location", "formattedAddress", "rating", "userRatingCount"],
        locationRestriction: { center: centerLatLng, radius: userPreferences.maxWalkingDistance },
        includedPrimaryTypes: ["park", "hiking_area", "playground"]
      })
      .then(({ places }) => 
        (places || []).map(p => ({
          id: p.id || Math.random().toString(),
          name: p.displayName || "Park / Activity",
          category: "activity" as const,
          rating: p.rating,
          reviewsCount: p.userRatingCount,
          formattedAddress: p.formattedAddress,
          lat: p.location ? p.location.lat() : 0,
          lng: p.location ? p.location.lng() : 0,
        }))
      )
      .catch(() => [])
    ];

    Promise.all(searchPromises).then((results) => {
      // Flatten arrays
      const flattened = results.flat();
      
      // Filter out double IDs
      const unique = Array.from(new Map((flattened as Place[]).map(item => [item.id, item])).values()) as Place[];

      // Assign walker calculations and sort
      const withDistances = unique.map(place => {
        const dst = calculateDistance(userLocation.lat, userLocation.lng, place.lat, place.lng);
        return { ...place, distanceMeters: dst };
      })
      .filter(place => place.distanceMeters <= userPreferences.maxWalkingDistance)
      .sort((a, b) => a.distanceMeters - b.distanceMeters);

      setPlaces(withDistances);
      setIsLoadingPlaces(false);
    });

  }, [placesLib, userLocation, userPreferences.maxWalkingDistance]);

  // Handle Send Chat query with WalkieTalkies server model
  const handleSendChat = async (text: string) => {
    const userMsg: Message = {
      id: Math.random().toString(),
      sender: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setIsLoadingChat(true);

    // Format top closest places of interest as perfect text grounding context
    const nearbyPlacesContext = places.length > 0
      ? places.slice(0, 10).map((p, idx) => `[${idx+1}] ${p.name} (${p.category}) - ${p.distanceMeters}m walk away at ${p.formattedAddress || "locations coordinate"}. Rating ${p.rating ? p.rating + "★" : "unrated"}.`).join("\n")
      : "No verified points of interest identified within immediate walking distance yet.";

    const payload = {
      messages: updatedMessages,
      nearbyPlacesContext,
      userPreferences
    };

    try {
      const resp = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await resp.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      const botMsg: Message = {
        id: Math.random().toString(),
        sender: "bot",
        text: data.text,
        timestamp: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
      };
      
      // Attempt to link place
      const matchedPlace = places.find(p => botMsg.text.includes(p.name));
      if(matchedPlace) {
          botMsg.linkedPlaceId = matchedPlace.id;
      }
      
      setMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      console.error(err);
      const errMsg: Message = {
        id: Math.random().toString(),
        sender: "bot",
        text: `⚠️ **WalkieTalkies Connection Alert**:\n${err.message || "An issue occurred connecting to WalkieTalkies engine. Please make sure GEMINI_API_KEY is stored securely in settings secrets and try again."}`,
        timestamp: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }),
        isError: true
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setIsLoadingChat(false);
    }
  };

  // Clicking on specific place launches a customized query to WalkieTalkies
  const handleAskAIAboutPlace = (place: Place) => {
    setSelectedPlace(place);
    setActiveTab("chat");
    setMobileView("panel");
    handleSendChat(`Tell me about "${place.name}" nearby. How is the atmosphere there, what are the best things to order/experience, and what is a nice route to walk there from my location?`);
  };

  const handleLinkPlace = (id: string) => {
    const place = places.find(p => p.id === id);
    if (place) {
      setSelectedPlace(place);
      setActiveTab("places");
      setMobileView("map");
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden text-slate-900 font-sans antialiased bg-gradient-to-tr from-slate-100/90 via-slate-50/50 to-slate-100/90 relative">
      {/* 1. High-fidelity glassmorphism ambient background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[15%] -left-[15%] w-[700px] h-[700px] rounded-full blur-[160px] ambient-blob-1 opacity-75" />
        <div className="absolute top-[30%] -right-[10%] w-[650px] h-[650px] rounded-full blur-[140px] ambient-blob-3 opacity-65" />
        <div className="absolute -bottom-[15%] left-[20%] w-[750px] h-[750px] rounded-full blur-[160px] ambient-blob-2 opacity-70" />
      </div>

      {/* Header Toolbar */}
      <nav className={`z-20 bg-white/45 backdrop-blur-lg border-b border-white/60 max-md:bg-white/20 max-md:backdrop-blur-xl max-md:border-white/30 px-4 py-3 md:px-6 md:py-4 shrink-0 gap-3 justify-between items-center relative ${mobileView === "map" ? "hidden sm:flex" : "flex flex-col sm:flex-row"}`}>
        <div className="flex items-center justify-between w-full sm:w-auto">
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-950 flex items-center gap-2">
              <span className="font-logo font-extrabold tracking-tight text-slate-950 text-xl pr-1">WalkieTalkies</span>
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest hidden sm:inline ml-1 border-l border-slate-300 pl-3 leading-none">Chat. Map. Explore.</span>
            </h1>
          </div>
          {/* Coordinates badge - inline on mobile only to save rows */}
          <div className="sm:hidden flex items-center gap-1.5 bg-white/20 border border-white/30 px-2.5 py-1 rounded-full text-slate-707 shadow-sm backdrop-blur-md">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-[10px] font-mono font-bold tracking-tight truncate max-w-[120px]">
              {currentAddress ? currentAddress.split(",")[0] : "Locating..."}
            </span>
          </div>
        </div>

        {/* Dynamic coordinate anchor chip (hidden on extra small screens) */}
        <div className="hidden sm:flex items-center gap-2.5 bg-white/75 border border-white/80 px-4 py-2 rounded-full text-slate-707 shadow-sm backdrop-blur-sm">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="text-xs font-mono font-bold tracking-tight truncate max-w-[180px] md:max-w-[280px]">
            {currentAddress || "Initializing sensor..."}
          </span>
        </div>

        {/* Action controllers & queries finder */}
        <div className="flex items-center w-full sm:w-auto gap-2">
          <form onSubmit={handleLocationSearch} className="relative flex-1 sm:w-48 md:w-64">
            <div className="bg-white/75 backdrop-blur-sm flex items-center rounded-2xl px-3 py-1.5 text-xs border border-white/80 shadow-sm focus-within:border-slate-450 max-md:bg-white/15 max-md:border-white/20 max-md:backdrop-blur-md transition-all duration-300">
              <input
                type="text"
                placeholder="Search location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-none text-slate-950 placeholder-slate-400 focus:outline-none focus:ring-0 text-xs py-0.5 px-1 font-medium"
              />
              <button
                type="submit"
                className="text-slate-400 hover:text-slate-900 transition-colors"
                title="Search location"
              >
                <Search className="h-3.5 w-3.5" />
              </button>
            </div>
          </form>

          {/* Refresh Geolocation */}
          <button
            onClick={handleGeolocation}
            title="Locate via device sensor"
            className="p-2 rounded-xl bg-white/75 text-slate-707 hover:text-slate-900 hover:bg-white border border-white/80 backdrop-blur-sm shadow-sm max-md:bg-white/20 max-md:border-white/25 max-md:backdrop-blur-md transition-all active:scale-95 flex items-center justify-center h-[34px] w-[34px] shrink-0"
          >
            <MapPin className="h-4 w-4" />
          </button>

          {/* Preferences controller */}
          <button
            onClick={() => setIsPrefsOpen(true)}
            className="p-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-950 text-white border border-slate-800 font-extrabold text-xs flex items-center gap-1.5 transition-all shadow-md hover:shadow-lg active:scale-95 h-[34px] shrink-0"
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>Preferences</span>
          </button>
        </div>
      </nav>

      {/* 2. Main Dashboard Layout Area */}
      <main className="flex-1 w-full overflow-hidden relative z-10">
        {/* Left Interactive Panel */}
        <div className={`absolute inset-x-0 top-0 bottom-16 z-20 flex flex-col gap-4 bg-white/70 backdrop-blur-2xl border-b border-white/50 max-md:bg-white/30 max-md:backdrop-blur-3xl max-md:border-b-white/20 p-5 rounded-none shadow-none ${mobileView === "panel" ? "flex" : "hidden md:flex"} md:absolute md:left-6 md:top-6 md:bottom-6 md:h-[calc(100%-48px)] md:w-[420px] md:bg-white/65 md:backdrop-blur-3xl md:border-t md:border-l md:border-white/95 md:border-r md:border-b md:border-slate-300/40 md:shadow-2xl md:rounded-[32px] md:p-5 md:flex`}>
          {/* Dashboard Tab Selector */}
          <div className="hidden md:grid grid-cols-3 p-1.5 bg-slate-950/5 border border-slate-200/50 rounded-2xl shrink-0 shadow-inner relative z-20">
            <button
              onClick={() => setActiveTab("chat")}
              className={`py-2 px-1 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all duration-350 cursor-pointer active:scale-95 ${
                activeTab === "chat"
                  ? "bg-white text-slate-900 border border-slate-200/80 shadow-md shadow-slate-900/5 scale-102"
                  : "text-slate-500 hover:text-slate-800 hover:bg-white/40"
              }`}
            >
              Chat
            </button>
            <button
              onClick={() => setActiveTab("places")}
              className={`py-2 px-1 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all duration-350 cursor-pointer active:scale-95 ${
                activeTab === "places"
                  ? "bg-white text-slate-900 border border-slate-200/80 shadow-md shadow-slate-900/5 scale-102"
                  : "text-slate-500 hover:text-slate-800 hover:bg-white/40"
              }`}
            >
              Places ({places.length})
            </button>
            <button
              onClick={() => setActiveTab("itinerary")}
              className={`py-2 px-1 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition-all duration-350 cursor-pointer active:scale-95 ${
                activeTab === "itinerary"
                  ? "bg-white text-slate-900 border border-slate-200/80 shadow-md shadow-slate-900/5 scale-102"
                  : "text-slate-500 hover:text-slate-800 hover:bg-white/40"
              }`}
            >
              Itinerary ({itinerary.length})
            </button>
          </div>

          {/* Active View Container */}
          <div className="flex-1 flex flex-col overflow-hidden relative p-0 bg-transparent rounded-none border-none shadow-none">
            {activeTab === "chat" ? (
              <ChatPanel
                messages={messages}
                onSendMessage={handleSendChat}
                isLoading={isLoadingChat}
                onClearChat={clearChat}
                locationState={userLocation ? { lat: userLocation.lat, lng: userLocation.lng, address: currentAddress } : null}
                onLinkPlace={handleLinkPlace}
              />
            ) : activeTab === "places" ? (
              <PlacesList
                places={places}
                selectedPlaceId={selectedPlace?.id || null}
                itinerary={itinerary}
                onToggleItinerary={toggleItinerary}
                onSelectPlace={(p) => {
                  setSelectedPlace(p);
                  setMobileView("map");
                }}
                onAskAIAboutPlace={handleAskAIAboutPlace}
                loading={isLoadingPlaces}
              />
            ) : (
                <div className="flex flex-col h-full text-slate-800" id="itinerary-panel">
                    <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200/40 shrink-0">
                        <h3 className="text-sm font-bold text-slate-950 tracking-tight">Personalized Itenerary</h3>
                        <span className="text-[10px] font-mono tracking-wider font-extrabold uppercase text-slate-600 bg-white border border-slate-200 max-md:bg-white/20 max-md:border-white/25 max-md:backdrop-blur-sm px-3 py-1 rounded-full shadow-sm">{itinerary.length} stops</span>
                    </div>
                    {itinerary.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center py-10 text-center">
                        <div className="h-14 w-14 rounded-2xl bg-white/60 border border-white max-md:bg-white/25 max-md:border-white/30 max-md:backdrop-blur-sm flex items-center justify-center mb-4 text-slate-400">
                          <Compass className="h-6 w-6 text-slate-705" />
                        </div>
                        <p className="text-sm font-bold text-slate-900 tracking-tight">No stops scheduled yet.</p>
                        <p className="text-xs text-slate-500 mt-2 max-w-xs px-4 leading-relaxed font-semibold">Explore places nearby and click "Add to Walk Path" to design your personalized walk guide.</p>
                      </div>
                    ) : (
                      <div className="flex-1 overflow-y-auto space-y-3.5 px-1.5 py-1.5 scrollbar-none no-scrollbar">
                        {itinerary.map((place, i) => (
                            <div key={place.id} className="p-4 bg-white/75 border border-white hover:border-slate-300 rounded-2xl flex items-center gap-4 text-sm shadow-sm hover:scale-[1.005] max-md:bg-white/20 max-md:border-white/25 max-md:backdrop-blur-sm hover:max-md:bg-white/30 transition-all duration-300">
                                <span className="h-8 w-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-extrabold text-xs shrink-0 font-mono shadow-sm">{i+1}</span>
                                <div className="flex-1 min-w-0">
                                    <span className="block font-extrabold text-slate-950 truncate leading-snug">{place.name}</span>
                                    <span className="block text-[11px] text-slate-500 capitalize font-bold tracking-wide mt-0.5">{place.category}</span>
                                </div>
                                <button onClick={() => toggleItinerary(place)} className="h-8 w-8 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 hover:border hover:border-red-100 transition-all flex items-center justify-center cursor-pointer active:scale-95">
                                    <X className="h-4.5 w-4.5 stroke-[2.5px]" />
                                </button>
                            </div>
                        ))}
                      </div>
                    )}
                </div>
            )}
          </div>
        </div>

        {/* Right Active Map Canvas Panel */}
        <div className={`absolute inset-x-0 top-0 bottom-16 z-0 ${mobileView === "map" ? "block" : "hidden md:block"} md:absolute md:inset-0 md:w-full md:h-full`}>
          <MapContainer
            userLocation={userLocation}
            places={places}
            selectedPlace={selectedPlace}
            itinerary={itinerary}
            onSelectPlace={(p) => setSelectedPlace(p)}
            onAskAIAboutPlace={handleAskAIAboutPlace}
            onToggleItinerary={toggleItinerary}
          />

          {/* Ambient walking-range indicator info board */}
          {userLocation && (
            <div className="absolute bottom-6 right-6 z-10 pointer-events-none p-5 rounded-[24px] border border-slate-200/50 text-slate-800 shadow-xl max-w-72 bg-white/95 backdrop-blur-md hidden md:block">
              <p className="text-[10px] font-bold tracking-widest uppercase text-slate-900 mb-1.5 flex items-center gap-1.5 font-mono">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Walking Range Grid
              </p>
              <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                Scanning coordinates within <strong className="text-slate-950 font-bold">{userPreferences.maxWalkingDistance}m</strong> from your current anchor.
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Premium Unified Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 z-40 bg-white/35 text-slate-800 rounded-none shadow-lg flex items-center justify-around px-2 backdrop-blur-2xl border-t border-white/25">
        <button
          onClick={() => {
            setMobileView("panel");
            setActiveTab("chat");
          }}
          className={`flex flex-col items-center justify-center gap-1 w-16 h-12 rounded-xl transition-all duration-350 cursor-pointer active:scale-95 ${
            mobileView === "panel" && activeTab === "chat"
              ? "text-slate-900 bg-white/40 border border-white/35 shadow-sm backdrop-blur-sm font-black scale-102"
              : "text-slate-400 hover:text-slate-900"
          }`}
        >
          <MessageSquare className="h-4.5 w-4.5 shrink-0" />
          <span className="text-[10px] font-bold tracking-tight">Chat</span>
        </button>

        <button
          onClick={() => {
            setMobileView("panel");
            setActiveTab("places");
          }}
          className={`flex flex-col items-center justify-center gap-1 w-16 h-12 rounded-xl transition-all duration-350 cursor-pointer active:scale-95 ${
            mobileView === "panel" && activeTab === "places"
              ? "text-slate-900 bg-white/40 border border-white/35 shadow-sm backdrop-blur-sm font-black scale-102"
              : "text-slate-400 hover:text-slate-900"
          }`}
        >
          <Compass className="h-4.5 w-4.5 shrink-0" />
          <span className="text-[10px] font-bold tracking-tight">Places</span>
        </button>

        <button
          onClick={() => {
            setMobileView("panel");
            setActiveTab("itinerary");
          }}
          className={`flex flex-col items-center justify-center gap-1 w-18 h-12 rounded-xl transition-all duration-350 cursor-pointer active:scale-95 ${
            mobileView === "panel" && activeTab === "itinerary"
              ? "text-slate-900 bg-white/40 border border-white/35 shadow-sm backdrop-blur-sm font-black scale-102"
              : "text-slate-400 hover:text-slate-900"
          }`}
        >
          <Navigation className="h-4.5 w-4.5 shrink-0" />
          <span className="text-[10px] font-bold tracking-tight">Route ({itinerary.length})</span>
        </button>

        <button
          onClick={() => setMobileView("map")}
          className={`flex flex-col items-center justify-center gap-1 w-16 h-12 rounded-xl transition-all duration-350 cursor-pointer active:scale-95 ${
            mobileView === "map"
              ? "text-slate-900 bg-white/40 border border-white/35 shadow-sm backdrop-blur-sm font-black scale-102"
              : "text-slate-400 hover:text-slate-900"
          }`}
        >
          <MapIcon className="h-4.5 w-4.5 shrink-0" />
          <span className="text-[10px] font-bold tracking-tight">Map</span>
        </button>
      </div>

      {/* 3. Global preferences modal overlays */}
      <AnimatePresence>
        {isPrefsOpen && (
          <PreferencesModal
            isOpen={isPrefsOpen}
            onClose={() => setIsPrefsOpen(false)}
            preferences={userPreferences}
            onUpdatePreferences={(prefs) => setUserPreferences(prefs)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Global App wrapper rendering the Google Maps API Provider
export default function App() {
  if (!hasValidKey) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950 text-white font-sans p-6">
        <div className="w-full max-w-md p-8 rounded-3xl border border-white/10 bg-slate-900/65 shadow-2xl backdrop-blur-lg text-center" id="setup-screen">
          <div className="h-14 w-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-amber-500/5">
            <ShieldAlert className="h-7 w-7" />
          </div>
          
          <h2 className="text-lg font-bold tracking-tight text-slate-100 mb-2">
            Google Maps API Key Required
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed mb-6">
            A verified Google Maps Platform subscription is required to power local places scanning, reverse geocoding, and interactive map tiles.
          </p>

          <div className="space-y-4.5 text-left border-y border-white/5 py-5 mb-6">
            <div className="flex gap-3">
              <div className="h-5 w-5 rounded-full bg-slate-800 text-xs font-bold text-teal-400 flex items-center justify-center shrink-0">1</div>
              <div>
                <h4 className="text-xs font-bold text-slate-200">Prepare API Credentials</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Securely activate an API Key at{" "}
                  <a 
                    href="https://console.cloud.google.com/google/maps-apis/start?utm_campaign=gmp-code-assist-ais" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-teal-300 hover:underline inline-flex items-center gap-0.5 font-medium"
                  >
                    Google Cloud Developer Console
                  </a>
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="h-5 w-5 rounded-full bg-slate-800 text-xs font-bold text-teal-400 flex items-center justify-center shrink-0">2</div>
              <div>
                <h4 className="text-xs font-bold text-slate-200">Add Key as Secret in AI Studio</h4>
                <ul className="text-[10.5px] text-slate-500 list-disc ml-4 space-y-0.5 mt-1 leading-normal">
                  <li>Click **Settings** (⚙️ gear icon, top-right panel)</li>
                  <li>Click on the **Secrets** section</li>
                  <li>Add custom secret with name: <code className="font-mono text-slate-300 bg-slate-950/50 px-1 rounded">GOOGLE_MAPS_PLATFORM_KEY</code></li>
                  <li>Paste your verified API Key as value, and hit **Enter**</li>
                </ul>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 animate-pulse font-medium">
            This workspace rebuilds automatically immediately once the key is added.
          </p>
        </div>
      </div>
    );
  }

  return (
    <APIProvider apiKey={API_KEY} version="weekly">
      <Dashboard />
    </APIProvider>
  );
}
