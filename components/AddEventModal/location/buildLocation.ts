import type { AddressComponent, LocationPayload } from "../types";

function getComp(components: AddressComponent[], type: string) {
  return components.find((c) => c.types?.includes(type));
}

function cityKey(city: string) {
  return city
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s/g, "-");
}

export function buildLocationFromAddressComponents(args: {
  lat: number;
  lng: number;
  formattedAddress?: string;
  placeId?: string;
  components: AddressComponent[];
  source: LocationPayload["source"];
}): LocationPayload | null {
  const c = args.components || [];

  const country = getComp(c, "country");
  const admin1 = getComp(c, "administrative_area_level_1");

  const locality = getComp(c, "locality");
  const postalTown = getComp(c, "postal_town");
  const admin2 = getComp(c, "administrative_area_level_2");
  const admin3 = getComp(c, "administrative_area_level_3");
  const sublocality = getComp(c, "sublocality") || getComp(c, "sublocality_level_1");

  const postal = getComp(c, "postal_code");

  const city =
    locality?.long_name ||
    postalTown?.long_name ||
    admin3?.long_name ||
    admin2?.long_name ||
    "";

  const countryCode = (country?.short_name || "").toUpperCase();

  if (!city || !countryCode) return null;

  return {
    lat: args.lat,
    lng: args.lng,
    formattedAddress: args.formattedAddress ?? "",
    placeId: args.placeId,

    countryCode,
    countryName: country?.long_name || "",

    admin1: admin1?.long_name || "",
    admin1Code: admin1?.short_name || "",

    city,
    cityKey: cityKey(city),

    postalCode: postal?.long_name || "",
    neighborhood: sublocality?.long_name || "",

    source: args.source,
  };
}
