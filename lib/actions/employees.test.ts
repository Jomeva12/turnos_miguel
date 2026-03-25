/**
 * Tests for toggleEmployeeArea behavior.
 *
 * Since Server Actions require an HTTP request context for auth checks,
 * these tests validate the underlying Prisma operations (upsert/deleteMany)
 * directly against a real database. Run with a test database or integration environment.
 *
 * To run: DATABASE_URL=<test-db> npx vitest run lib/actions/employees.test.ts
 */

import { PrismaClient } from "@prisma/client";
import { describe, it, expect, beforeAll, afterAll } from "vitest";

describe("toggleEmployeeArea", () => {
  let prisma: PrismaClient;

  // Use fixed test IDs that are expected to exist in a seeded database.
  // These correspond to the first employee and first area from the seed data.
  const TEST_EMPLOYEE_ID = 1;
  const TEST_AREA_ID = 1;

  beforeAll(() => {
    prisma = new PrismaClient();
  });

  afterAll(async () => {
    // Clean up any test record we may have left behind
    await prisma.employeeArea.deleteMany({
      where: { employeeId: TEST_EMPLOYEE_ID, areaId: TEST_AREA_ID },
    });
    await prisma.$disconnect();
  });

  it("should create EmployeeArea when enabled=true", async () => {
    // Ensure no record exists first
    await prisma.employeeArea.deleteMany({
      where: { employeeId: TEST_EMPLOYEE_ID, areaId: TEST_AREA_ID },
    });

    // Simulate the upsert logic from toggleEmployeeArea
    await prisma.employeeArea.upsert({
      where: {
        employeeId_areaId: { employeeId: TEST_EMPLOYEE_ID, areaId: TEST_AREA_ID },
      },
      create: { employeeId: TEST_EMPLOYEE_ID, areaId: TEST_AREA_ID },
      update: {},
    });

    const record = await prisma.employeeArea.findUnique({
      where: {
        employeeId_areaId: { employeeId: TEST_EMPLOYEE_ID, areaId: TEST_AREA_ID },
      },
    });

    expect(record).not.toBeNull();
    expect(record?.employeeId).toBe(TEST_EMPLOYEE_ID);
    expect(record?.areaId).toBe(TEST_AREA_ID);
  });

  it("should delete EmployeeArea when enabled=false", async () => {
    // Ensure the record exists first
    await prisma.employeeArea.upsert({
      where: {
        employeeId_areaId: { employeeId: TEST_EMPLOYEE_ID, areaId: TEST_AREA_ID },
      },
      create: { employeeId: TEST_EMPLOYEE_ID, areaId: TEST_AREA_ID },
      update: {},
    });

    // Simulate the deleteMany logic from toggleEmployeeArea
    await prisma.employeeArea.deleteMany({
      where: { employeeId: TEST_EMPLOYEE_ID, areaId: TEST_AREA_ID },
    });

    const record = await prisma.employeeArea.findUnique({
      where: {
        employeeId_areaId: { employeeId: TEST_EMPLOYEE_ID, areaId: TEST_AREA_ID },
      },
    });

    expect(record).toBeNull();
  });

  it("should be idempotent on create (toggle true twice creates only one record)", async () => {
    // Ensure no record exists first
    await prisma.employeeArea.deleteMany({
      where: { employeeId: TEST_EMPLOYEE_ID, areaId: TEST_AREA_ID },
    });

    // Upsert twice
    for (let i = 0; i < 2; i++) {
      await prisma.employeeArea.upsert({
        where: {
          employeeId_areaId: { employeeId: TEST_EMPLOYEE_ID, areaId: TEST_AREA_ID },
        },
        create: { employeeId: TEST_EMPLOYEE_ID, areaId: TEST_AREA_ID },
        update: {},
      });
    }

    const count = await prisma.employeeArea.count({
      where: { employeeId: TEST_EMPLOYEE_ID, areaId: TEST_AREA_ID },
    });

    expect(count).toBe(1);
  });

  it("should be idempotent on delete (toggle false on non-existent record causes no error)", async () => {
    // Ensure the record does NOT exist
    await prisma.employeeArea.deleteMany({
      where: { employeeId: TEST_EMPLOYEE_ID, areaId: TEST_AREA_ID },
    });

    // deleteMany on non-existent record should not throw
    await expect(
      prisma.employeeArea.deleteMany({
        where: { employeeId: TEST_EMPLOYEE_ID, areaId: TEST_AREA_ID },
      })
    ).resolves.not.toThrow();

    const count = await prisma.employeeArea.count({
      where: { employeeId: TEST_EMPLOYEE_ID, areaId: TEST_AREA_ID },
    });

    expect(count).toBe(0);
  });
});
