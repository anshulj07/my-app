export function formatTime12h(hh: number, mm: number) {
    const ampm = hh >= 12 ? "PM" : "AM";
    const h12 = ((hh + 11) % 12) + 1;
    return `${h12}:${String(mm).padStart(2, "0")} ${ampm}`;
  }
  
  export function parsePriceToCents(priceText: string): number | null {
    const cleaned = priceText.replace(/[^\d.]/g, "");
    const n = Number.parseFloat(cleaned);
    if (!Number.isFinite(n) || n <= 0) return null;
    return Math.round(n * 100);
  }
  