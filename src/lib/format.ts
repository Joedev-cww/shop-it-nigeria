/** Shared, framework-free helpers. Safe to import anywhere. */

/** Format whole-Naira integers: 2500 -> "₦2,500" */
export function naira(amount: number | null | undefined): string {
  return "₦" + Math.round(amount ?? 0).toLocaleString("en-NG");
}

/**
 * Client-side mirror of the database `contains_contact_info` check.
 * Used for instant feedback only — the database enforces the real rule.
 */
export function containsContactInfo(text: string | null | undefined): boolean {
  if (!text) return false;
  const digits = text.replace(/[^0-9]/g, "");
  if (/[0-9][0-9\s\-.()]{8,}[0-9]/.test(text) && digits.length >= 10) return true;
  if (/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(text)) return true;
  if (/(https?:\/\/|www\.|\.com\b|\.ng\b|wa\.me|t\.me)/i.test(text)) return true;
  if (/(^|\s)@[a-z0-9_.]{3,}/i.test(text)) return true;
  if (/\b(whatsapp|whatsap|watsapp|telegram|insta|ig|dm me|call me|opay|palmpay|send to)\b/i.test(text))
    return true;
  const word = "(zero|one|two|three|four|five|six|seven|eight|nine|oh)";
  if (new RegExp(`\\b${word}\\b(\\W+\\b${word}\\b){5,}`, "i").test(text)) return true;
  return false;
}

/** Warn when delivery is more than half the item price (from the brief). */
export function deliveryIsExpensive(itemPrice: number, deliveryFee: number): boolean {
  return deliveryFee > itemPrice * 0.5;
}

export const CAMPUSES = ["UNILAG", "UI", "OAU", "UNN", "ABU", "UNIBEN", "UNIUYO", "LASU", "FUTA", "Covenant"];

/**
 * Browser URL for a stored photo. Demo pictures already point at /images,
 * seller uploads are stored as private object paths and are streamed through
 * the public image route, which only serves listings that are live.
 */
export function photoUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("/") || url.startsWith("http")) return url;
  return `/api/public/img/${url}`;
}
