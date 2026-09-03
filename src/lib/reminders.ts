import type { Match, Player } from "@/lib/types";

export function normalizeWhatsAppNumber(phone: string | null) {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (/^01\d{9}$/.test(digits)) return `88${digits}`;
  if (/^8801\d{9}$/.test(digits)) return digits;
  if (/^1\d{9}$/.test(digits)) return `880${digits}`;
  return digits.length >= 10 && digits.length <= 15 ? digits : null;
}

export function buildDueReminder(player: Player, match: Match | undefined, amount: number) {
  const matchDetails = match
    ? ` for the ${match.match_date} match at ${match.turf_name}`
    : "";
  return `Hi ${player.name}, friendly reminder from Saturday Football: Tk ${amount.toLocaleString("en-BD")} is still due${matchDetails}. Please pay when convenient and submit the payment from My Account. Thank you!`;
}

export function buildWhatsAppUrl(phone: string | null, message: string) {
  const number = normalizeWhatsAppNumber(phone);
  return number ? `https://wa.me/${number}?text=${encodeURIComponent(message)}` : null;
}