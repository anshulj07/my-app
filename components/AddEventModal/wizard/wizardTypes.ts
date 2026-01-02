export type ListingKind = "event_free" | "event_paid" | "service";

export type ServicePhoto = {
  uri: string;     // local uri
  url?: string;    // uploaded url (optional until upload)
  key?: string;    // uploaded key (optional until upload)
};

export type WizardState = {
  kind: ListingKind | null;

  // required for all kinds
  title: string;
  description: string;      // REQUIRED now (you asked all fields required)
  dateISO: string;          // REQUIRED
  time24: string;           // REQUIRED

  // location REQUIRED
  query: string;
  selectedAddress: string;
  coord: { lat: number; lng: number } | null;
  locationPayload: any | null; // keep your LocationPayload shape

  // required based on kind
  priceText: string;         // required for paid + service
  capacityText: string;      // required for free (example: always required)
  servicePhotos: ServicePhoto[]; // required for service (>=1)

  // UI state
  submitting: boolean;
  err: string | null;
};
