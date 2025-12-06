export type CreateEvent = { title: string; lat: number; lng: number; emoji: string };

export type Suggestion = { id: string; main: string; secondary?: string };
export type Option = { label: string; value: string };

export type EventKind = "free" | "service";

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
