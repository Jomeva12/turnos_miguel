import { describe, it, expect } from "vitest";
import { formatMonthYear, formatDayShort } from "./format";

// Use Date constructor with year/month/day (local time) to avoid TZ parsing issues
// DO NOT use ISO string format like new Date("2024-03-04") — those parse as UTC midnight
// which shifts the date by 1 day in negative-offset timezones (America/Bogota = UTC-5)

describe("formatMonthYear", () => {
  it("capitalizes the first letter of the Spanish month", () => {
    const date = new Date(2024, 2, 15); // March 15, 2024 (month is 0-indexed)
    const result = formatMonthYear(date);
    expect(result.charAt(0)).toBe(result.charAt(0).toUpperCase());
    expect(result.charAt(0)).not.toBe(result.charAt(0).toLowerCase());
  });

  it("returns Spanish month name for marzo", () => {
    const date = new Date(2024, 2, 15); // March
    const result = formatMonthYear(date);
    expect(result).toMatch(/[Mm]arzo/i);
    expect(result.charAt(0)).toBe("M");
  });

  it("returns Spanish month name for enero", () => {
    const date = new Date(2024, 0, 1); // January
    const result = formatMonthYear(date);
    expect(result).toMatch(/Enero/);
  });

  it("includes the year", () => {
    const date = new Date(2024, 5, 1); // June
    const result = formatMonthYear(date);
    expect(result).toContain("2024");
  });

  it("returns Diciembre correctly capitalized", () => {
    const date = new Date(2024, 11, 25); // December
    const result = formatMonthYear(date);
    expect(result).toMatch(/Diciembre/);
  });
});

describe("formatDayShort", () => {
  it("returns Spanish abbreviation for Monday (lunes)", () => {
    // 2024-03-04 is a Monday — use local time constructor
    const monday = new Date(2024, 2, 4);
    const result = formatDayShort(monday);
    expect(result.toLowerCase()).toMatch(/lun/);
  });

  it("returns Spanish abbreviation for Tuesday (martes)", () => {
    // 2024-03-05 is a Tuesday
    const tuesday = new Date(2024, 2, 5);
    const result = formatDayShort(tuesday);
    expect(result.toLowerCase()).toMatch(/mar/);
  });

  it("returns Spanish abbreviation for Wednesday (miércoles)", () => {
    // 2024-03-06 is a Wednesday
    const wednesday = new Date(2024, 2, 6);
    const result = formatDayShort(wednesday);
    expect(result.toLowerCase()).toMatch(/mi/);
  });

  it("returns Spanish abbreviation for Sunday (domingo)", () => {
    // 2024-03-10 is a Sunday
    const sunday = new Date(2024, 2, 10);
    const result = formatDayShort(sunday);
    expect(result.toLowerCase()).toMatch(/dom/);
  });

  it("returns Spanish abbreviation for Saturday (sábado)", () => {
    // 2024-03-09 is a Saturday
    const saturday = new Date(2024, 2, 9);
    const result = formatDayShort(saturday);
    expect(result.toLowerCase()).toMatch(/sáb|sab/);
  });
});
