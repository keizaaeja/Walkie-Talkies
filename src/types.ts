export interface Place {
  id: string;
  name: string;
  category: "cafe" | "museum" | "attraction" | "activity" | "general";
  rating?: number;
  userRatingCount?: number;
  formattedAddress?: string;
  lat: number;
  lng: number;
  distanceMeters?: number;
  reviewsCount?: number;
}

export interface Message {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: string;
  isError?: boolean;
  linkedPlaceId?: string;
}

export interface UserPreferences {
  maxWalkingDistance: number; // in meters
  pace: "relaxed" | "moderate" | "brisk";
  interests: string[]; // e.g., ["Coffee & Tea", "Art Galleries", "History", "Nature", "Shopping"]
}
