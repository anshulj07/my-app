import type { WizardState } from "./wizardTypes";

export function toStartsAtISO(dateISO: string, time24: string) {
  if (!dateISO || !time24) return null;
  // local time -> Date -> ISO
  const d = new Date(`${dateISO}T${time24}:00`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export function isFutureStart(dateISO: string, time24: string) {
  const iso = toStartsAtISO(dateISO, time24);
  if (!iso) return false;
  return new Date(iso).getTime() > Date.now();
}

export function validateStep(state: WizardState, step: string): string | null {
  if (step === "kind") {
    if (!state.kind) return "Pick a type to continue.";
  }

  if (step === "basics") {
    if (!state.title.trim()) return "Title is required.";
    if (!state.description.trim()) return "Description is required.";
  }

  if (step === "when") {
    if (!state.dateISO) return "Date is required.";
    if (!state.time24) return "Time is required.";
    if (!isFutureStart(state.dateISO, state.time24)) return "Event must be in the future.";
  }

  if (step === "where") {
    if (!state.coord) return "Location is required.";
    if (!state.selectedAddress.trim()) return "Please select a place so address is set.";
    if (!state.locationPayload?.countryCode || !state.locationPayload?.city) {
      return "Please pick a place so city/country are available.";
    }
  }

  if (step === "price") {
    if (!state.priceText.trim()) return "Price is required.";
    const n = Number(state.priceText);
    if (!Number.isFinite(n) || n <= 0) return "Enter a valid price (> 0).";
  }

  if (step === "capacity") {
    const raw = state.capacityText.trim();
    if (!raw) return null;

    const n = parseInt(raw, 10);
    if (!Number.isFinite(n) || n <= 0) return "Capacity must be > 0 (or leave empty).";
  }


  if (step === "servicePhotos") {
    if (!state.servicePhotos.length) return "Upload at least 1 service photo.";
  }

  return null;
}

export function validateAll(state: WizardState): string | null {
  // final guard (covers everything + future)
  const steps = ["kind", "basics", "when", "where"];
  for (const s of steps) {
    const e = validateStep(state, s);
    if (e) return e;
  }
  if (state.kind === "event_paid" || state.kind === "service") {
    const e = validateStep(state, "price");
    if (e) return e;
  }
  if (state.kind === "service") {
    const e = validateStep(state, "servicePhotos");
    if (e) return e;
  }
  return null;
}
