import type { WizardState, ListingKind, ServicePhoto } from "./wizardTypes";

export const initialWizardState: WizardState = {
  kind: null,

  title: "",
  description: "",
  dateISO: "",
  time24: "",

  query: "",
  selectedAddress: "",
  coord: null,
  locationPayload: null,

  priceText: "",
  capacityText: "",
  servicePhotos: [],

  submitting: false,
  err: null,
};

export type WizardAction =
  | { type: "SET_KIND"; kind: ListingKind }
  | { type: "SET"; key: keyof WizardState; value: any }
  | { type: "SET_ERR"; err: string | null }
  | { type: "ADD_SERVICE_PHOTOS"; photos: ServicePhoto[] }
  | { type: "REMOVE_SERVICE_PHOTO"; uri: string }
  | { type: "UPDATE_SERVICE_PHOTO"; uri: string; patch: Partial<ServicePhoto> }
  | { type: "RESET" };

export function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case "SET_KIND": {
      // reset kind-specific fields when switching
      const base = { ...state, kind: action.kind, err: null };
      if (action.kind === "event_free") {
        return { ...base, priceText: "", servicePhotos: [] };
      }
      if (action.kind === "event_paid") {
        return { ...base, capacityText: "", servicePhotos: [] };
      }
      return { ...base, capacityText: "" }; // service
    }
    case "SET":
      return { ...state, [action.key]: action.value, err: null };
    case "SET_ERR":
      return { ...state, err: action.err };
    // in wizardReducer.ts
    case "ADD_SERVICE_PHOTOS": {
      const merged = [...state.servicePhotos, ...action.photos];

      // dedupe by local uri (or by key when present)
      const seen = new Set<string>();
      const deduped = merged.filter((p) => {
        const id = p.key ?? p.uri;
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      });

      return { ...state, servicePhotos: deduped.slice(0, 6) };
    }
    case "UPDATE_SERVICE_PHOTO": {
      return {
        ...state,
        servicePhotos: state.servicePhotos.map((p) =>
          p.uri === action.uri ? { ...p, ...action.patch } : p
        ),
      };
    }
    case "REMOVE_SERVICE_PHOTO":
      return { ...state, servicePhotos: state.servicePhotos.filter(p => p.uri !== action.uri), err: null };
    case "RESET":
      return initialWizardState;
    default:
      return state;
  }
}
