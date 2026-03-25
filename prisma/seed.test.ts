/**
 * Seed Data Verification Tests
 *
 * Integration tests that run against the real database (DATABASE_URL from .env).
 * These tests verify that the seed script loaded all reference data correctly.
 *
 * Run: npx vitest run prisma/seed.test.ts --reporter=verbose
 * Prerequisites: npx prisma db seed must have been run first
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

beforeAll(async () => {
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("Seed Data Verification", () => {
  it("should have approximately 30 employees", async () => {
    const count = await prisma.employee.count();
    expect(count).toBeGreaterThanOrEqual(25);
    expect(count).toBeLessThanOrEqual(35);
  });

  it("should have exactly 7 areas", async () => {
    const count = await prisma.area.count();
    expect(count).toBe(7);
  });

  it("should have shift templates for all areas", async () => {
    const count = await prisma.shiftTemplate.count();
    expect(count).toBeGreaterThanOrEqual(30);
  });

  it("should have admin user", async () => {
    const user = await prisma.user.findUnique({
      where: { email: "yuli@diferencialdx.com" },
    });
    expect(user).not.toBeNull();
    expect(user?.name).toBe("Administradora");
  });

  it("should have correct area names", async () => {
    const areas = await prisma.area.findMany({ select: { name: true } });
    const areaNames = areas.map((a) => a.name);

    // These are the exact names from the Laravel DatabaseSeeder
    expect(areaNames).toContain("General");
    expect(areaNames).toContain("Buffet");
    expect(areaNames).toContain("Cosmetico");
    expect(areaNames).toContain("Domicilio");
    expect(areaNames).toContain("Electrodomestico");
    expect(areaNames).toContain("Marking");
    expect(areaNames).toContain("Valery Camacho");
  });

  it("should have shift templates for all 7 days of the week", async () => {
    const days = await prisma.shiftTemplate.groupBy({
      by: ["dayOfWeek"],
    });
    const dayNumbers = days.map((d) => d.dayOfWeek);

    // 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat, 7=Sun
    expect(dayNumbers).toContain(1);
    expect(dayNumbers).toContain(2);
    expect(dayNumbers).toContain(3);
    expect(dayNumbers).toContain(4);
    expect(dayNumbers).toContain(5);
    expect(dayNumbers).toContain(6);
    expect(dayNumbers).toContain(7);
  });

  it("should have wildcard templates marked as isWildcard=true", async () => {
    const wildcardCount = await prisma.shiftTemplate.count({
      where: { isWildcard: true },
    });
    expect(wildcardCount).toBeGreaterThan(0);
  });

  it("should have all areas with a color hex value", async () => {
    const areas = await prisma.area.findMany({ select: { name: true, color: true } });
    for (const area of areas) {
      expect(area.color).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it("should have employee skills (EmployeeArea records)", async () => {
    const skillCount = await prisma.employeeArea.count();
    expect(skillCount).toBeGreaterThan(0);
  });

  it("admin user should have a credential account record", async () => {
    const user = await prisma.user.findUnique({
      where: { email: "yuli@diferencialdx.com" },
      include: { accounts: true },
    });
    expect(user).not.toBeNull();
    const credentialAccount = user?.accounts.find(
      (a) => a.providerId === "credential"
    );
    expect(credentialAccount).not.toBeUndefined();
    expect(credentialAccount?.password).not.toBeNull();
    expect(credentialAccount?.password?.length).toBeGreaterThan(20);
  });
});
