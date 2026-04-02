import type { AddressComponent } from "../types";

export async function reverseGeocode(
  key: string,
  lat: number,
  lng: number
): Promise<{ formattedAddress: string; components: AddressComponent[]; placeId?: string } | null> {
  const u =
    `https://maps.googleapis.com/maps/api/geocode/json` +
    `?latlng=${encodeURIComponent(`${lat},${lng}`)}` +
    `&key=${key}`;

  const res = await fetch(u);
  const json = await res.json();
  const results = Array.isArray(json?.results) ? json.results : [];
  const top = results[0];
  if (!top) return null;

  return {
    formattedAddress: top.formatted_address || "Dropped pin",
    components: (top.address_components || []) as AddressComponent[],
    placeId: top.place_id,
  };
}
