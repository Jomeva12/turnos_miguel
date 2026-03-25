/**
 * Area colors mapped from Bootstrap badge classes in the Laravel reference system.
 * Area names exactly as they appear in the DatabaseSeeder of yuli_turnos.
 *
 * Bootstrap class mappings:
 * - General: secondary -> gray
 * - Valery Camacho: danger -> red
 * - Buffet: warning -> amber
 * - Domicilio: primary -> blue
 * - Electrodomestico: dark -> purple
 * - Cosmetico: info -> pink
 * - Marking: success -> emerald
 */
export const AREA_COLORS: Record<string, string> = {
  General: "#6b7280",
  "Valery Camacho": "#ef4444",
  Buffet: "#f59e0b",
  Domicilio: "#3b82f6",
  Electrodomestico: "#8b5cf6",
  Cosmetico: "#ec4899",
  Marking: "#10b981",
};

export const AREA_NAMES = Object.keys(AREA_COLORS) as string[];
