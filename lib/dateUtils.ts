/**
 * Formats event date and time into a user-friendly string.
 * Example: "Today • 6:00 PM", "Tomorrow • 10:30 AM", "Wed, 12 Apr • 4:00 PM"
 */
export function formatEventDateTime(dateStr?: string, timeStr?: string): string {
  if (!dateStr && !timeStr) return "TBA";
  if (!dateStr) return timeStr || "TBA";

  const now = new Date();
  // Ensure we parse YYYY-MM-DD correctly without timezone shifts
  const [year, month, day] = dateStr.split("-").map(Number);
  const eventDate = new Date(year, month - 1, day);

  // Format Time (HH:mm -> h:mm AM/PM)
  let formattedTime = "";
  if (timeStr) {
    const [h, m] = timeStr.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    formattedTime = `${h12}:${m < 10 ? "0" + m : m} ${ampm}`;
  }

  // Check Relative
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  let datePart = "";
  if (diffDays === 0) datePart = "Today";
  else if (diffDays === 1) datePart = "Tomorrow";
  else if (diffDays === -1) datePart = "Yesterday";
  else {
    // Wed, 12 Apr
    const options: Intl.DateTimeFormatOptions = { weekday: "short", day: "numeric", month: "short" };
    datePart = eventDate.toLocaleDateString("en-US", options);
  }

  if (!formattedTime) return datePart;
  return `${datePart} • ${formattedTime}`;
}
