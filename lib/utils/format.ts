import { format } from "date-fns";
import { es } from "date-fns/locale";

/**
 * Returns Spanish month and year with capitalized first letter.
 * Example: new Date("2024-03-01") -> "Marzo 2024"
 */
export function formatMonthYear(date: Date): string {
  const raw = format(date, "MMMM yyyy", { locale: es });
  return raw.charAt(0).toUpperCase() + raw.slice(1);
}

/**
 * Returns short day name in Spanish.
 * Example: Monday -> "lun.", Tuesday -> "mar."
 */
export function formatDayShort(date: Date): string {
  return format(date, "EEE", { locale: es });
}
