import type { ListingKind } from "./wizardTypes";

export type StepKey =
  | "kind"
  | "basics"
  | "when"
  | "serviceWhen"   
  | "where"
  | "price"
  | "capacity"
  | "servicePhotos"
  | "review";


export function getSteps(kind: ListingKind | null): StepKey[] {
  if (!kind) return ["kind"];
  if (kind === "event_free") return ["kind", "basics", "when", "where", "capacity", "review"];
  if (kind === "event_paid") return ["kind", "basics", "when", "where", "price", "review"];
  return ["kind", "basics", "serviceWhen", "where", "price", "servicePhotos", "review"];
}

