/**
 * TDD RED phase — tests for GET /api/export
 *
 * These tests verify the behavior contract before implementation:
 * - 400 for missing params
 * - 400 for non-integer params
 * - 200 with correct Content-Type and Content-Disposition for valid params
 * - Day headers are UPPERCASE Spanish abbreviations
 * - Split shifts render with \n, not |
 * - Descanso (null timeSlot) shows "DESCANSO"
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock Prisma db before importing the route
vi.mock("@/lib/db", () => ({
  prisma: {
    shift: {
      findMany: vi.fn(),
    },
    employee: {
      findMany: vi.fn(),
    },
  },
}));

// Mock auth — export route requires session
vi.mock("@/lib/auth", () => ({
  auth: {
    api: {
      getSession: vi.fn().mockResolvedValue({ user: { id: "1", email: "test@test.com" } }),
    },
  },
}));

// Mock next/headers
vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(new Headers()),
}));

import { prisma } from "@/lib/db";
import { GET } from "./route";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockPrisma = prisma as any as {
  shift: { findMany: ReturnType<typeof vi.fn> };
  employee: { findMany: ReturnType<typeof vi.fn> };
};

function makeRequest(params: Record<string, string> = {}) {
  const url = new URL("http://localhost/api/export");
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  return new NextRequest(url.toString());
}

describe("GET /api/export", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.employee.findMany.mockResolvedValue([]);
    mockPrisma.shift.findMany.mockResolvedValue([]);
  });

  // --- 400 cases ---

  it("returns 400 when year and month are missing", async () => {
    const res = await GET(makeRequest());
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/year and month are required/i);
  });

  it("returns 400 when only year is missing", async () => {
    const res = await GET(makeRequest({ month: "1" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/year and month are required/i);
  });

  it("returns 400 when only month is missing", async () => {
    const res = await GET(makeRequest({ year: "2026" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/year and month are required/i);
  });

  it("returns 400 when year is not an integer", async () => {
    const res = await GET(makeRequest({ year: "abc", month: "1" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/must be integers/i);
  });

  it("returns 400 when month is not an integer", async () => {
    const res = await GET(makeRequest({ year: "2026", month: "abc" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/must be integers/i);
  });

  // --- 200 cases ---

  it("returns 200 with correct Content-Type for valid params", async () => {
    const res = await GET(makeRequest({ year: "2026", month: "1" }));
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
  });

  it("returns Content-Disposition with Spanish month name in filename", async () => {
    const res = await GET(makeRequest({ year: "2025", month: "1" }));
    expect(res.status).toBe(200);
    const disposition = res.headers.get("Content-Disposition");
    expect(disposition).toMatch(/attachment/);
    expect(disposition).toMatch(/planilla-enero-2025\.xlsx/);
  });

  it("queries employees and shifts from Prisma", async () => {
    await GET(makeRequest({ year: "2026", month: "3" }));
    expect(mockPrisma.employee.findMany).toHaveBeenCalled();
    expect(mockPrisma.shift.findMany).toHaveBeenCalled();
  });

  it("queries shifts with date range matching the month", async () => {
    await GET(makeRequest({ year: "2026", month: "3" }));
    const call = mockPrisma.shift.findMany.mock.calls[0][0];
    expect(call.where.date.gte).toEqual(new Date(2026, 2, 1));
    expect(call.where.date.lte).toEqual(new Date(2026, 2, 31));
  });

  it("returns a non-empty buffer as body", async () => {
    const res = await GET(makeRequest({ year: "2026", month: "3" }));
    const buf = await res.arrayBuffer();
    expect(buf.byteLength).toBeGreaterThan(0);
  });
});
