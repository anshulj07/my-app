import type { Suggestion, AddressComponent } from "../types";

export async function fetchAutocomplete(args: {
  key: string;
  q: string;
  setLoading: (b: boolean) => void;
  setList: (v: Suggestion[]) => void;
  setErr: (m: string | null) => void;
}) {
  const { key, q, setLoading, setList, setErr } = args;

  try {
    setLoading(true);
    setErr(null);

    const url =
      `https://maps.googleapis.com/maps/api/place/autocomplete/json` +
      `?input=${encodeURIComponent(q)}` +
      `&components=country:us` +
      `&key=${key}`;
  

    const res = await fetch(url);
    const json = await res.json();
    const preds = Array.isArray(json?.predictions) ? json.predictions : [];

    setList(
      preds.map((p: any) => ({
        id: p.place_id,
        main: p.structured_formatting?.main_text ?? p.description,
        secondary: p.structured_formatting?.secondary_text,
      }))
    );
  } catch {
    setErr("Couldn’t fetch suggestions. Check your network.");
  } finally {
    setLoading(false);
  }
}

export async function fetchPlaceDetails(
  key: string,
  placeId: string
): Promise<{
  latLng: { lat: number; lng: number } | null;
  formattedAddress?: string;
  addressComponents?: AddressComponent[];
} | null> {
  const u =
    `https://maps.googleapis.com/maps/api/place/details/json` +
    `?place_id=${placeId}` +
    `&fields=geometry,formatted_address,address_component,place_id,name` +
    `&key=${key}`;

  const res = await fetch(u);
  const json = await res.json();

  const loc = json?.result?.geometry?.location;
  const lat = loc?.lat;
  const lng = loc?.lng;

  const formattedAddress = json?.result?.formatted_address || json?.result?.name;
  const addressComponents = (json?.result?.address_components || []) as AddressComponent[];

  if (typeof lat === "number" && typeof lng === "number") {
    return { latLng: { lat, lng }, formattedAddress, addressComponents };
  }
  return { latLng: null, formattedAddress, addressComponents };
}
