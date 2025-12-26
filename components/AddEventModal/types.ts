export type CreateEvent = { title: string; lat: number; lng: number; emoji: string };
export type EventKind = ListingKind;

export type Suggestion = { id: string; main: string; secondary?: string };
export type Option = { label: string; value: string };

// ✅ events can be free/paid, and services are separate
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
  title: string;
  description?: string;
  emoji?: string;

  // for events (free/paid)
  date?: string;   // yyyy-mm-dd
  time?: string;   // HH:mm
  timezone?: string;

  // for paid event + service
  priceCents?: number;

  // location
  location: LocationPayload;
};
