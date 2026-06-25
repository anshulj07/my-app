export type CreateEvent = { title: string; lat: number; lng: number; emoji: string; distanceKm?: number };

export type Suggestion = { id: string; main: string; secondary?: string };
export type Option = { label: string; value: string };

// ✅ events can be free/paid, services are separate
export type ListingKind = "event_free" | "event_paid" | "service";

export type LocationPayload = {
  lat: number;
  lng: number;
  formattedAddress?: string;
  placeId?: string;

  countryCode: string; // "US"
  countryName?: string;

  admin1?: string; // "New York"
  admin1Code?: string; // "NY"

  city: string; // "Potsdam"
  cityKey?: string;

  postalCode?: string;
  neighborhood?: string;

  source?: "user_typed" | "places_autocomplete" | "reverse_geocode";
};

export type AddressComponent = { long_name: string; short_name: string; types: string[] };

// ✅ optional: data you submit from the modal (no backend stuff here)
export type CreateListingPayload = {
  kind: ListingKind;
  isRecurring?: boolean;
  title: string;
  description?: string;
  emoji?: string;

  // for events (free/paid)
  date?: string;   // yyyy-mm-dd
  time?: string;   // HH:mm
  endDate?: string; // yyyy-mm-dd
  endTime?: string; // HH:mm
  timezone?: string;

  // for paid event + service
  priceCents?: number;

  // for recurring activities
  bookingWindowDays?: number; // 0 = same day, 1 = 1 day ahead, 7 = week ahead
  dailyCapacity?: number | null; // max bookings per day (null = unlimited)
  recurringSchedule?: { day: number; startTime: string; endTime: string }[];


  // location
  location: LocationPayload;
};
