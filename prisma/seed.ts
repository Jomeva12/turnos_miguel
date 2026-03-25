/**
 * Seed script for GestionTurnos v2.0
 *
 * Data sources:
 * - Employees: https://github.com/Jomeva12/yuli_turnos.git DatabaseSeeder.php
 * - Areas: same source — 7 fixed areas, names exactly as in the Laravel seeder
 * - ShiftTemplates: ShiftTemplateSeeder.php — exact schedules, with wildcards identified by comments
 * - Admin user: seeded with better-auth/crypto scrypt hash (NOT bcryptjs)
 *
 * Run: npx prisma db seed
 * Idempotent: uses upsert so it can be run multiple times safely
 */

import { PrismaClient } from "@prisma/client";
import { hashPassword } from "better-auth/crypto";

const prisma = new PrismaClient();

// ============================================================
// Areas — exact names from Laravel DatabaseSeeder
// Colors: Bootstrap class mappings to hex
// ============================================================
const AREAS = [
  { name: "General", color: "#6b7280" },         // secondary -> gray
  { name: "Valery Camacho", color: "#ef4444" },  // danger -> red
  { name: "Buffet", color: "#f59e0b" },           // warning -> amber
  { name: "Domicilio", color: "#3b82f6" },        // primary -> blue
  { name: "Electrodomestico", color: "#8b5cf6" }, // dark -> purple
  { name: "Cosmetico", color: "#ec4899" },        // info -> pink
  { name: "Marking", color: "#10b981" },          // success -> emerald
];

// ============================================================
// Employees — exact names from Laravel DatabaseSeeder
// 31 employees with their initial area skills
// ============================================================
const EMPLOYEES = [
  { name: "ANGIE ARROYO",        skills: ["General", "Valery Camacho", "Domicilio"] },
  { name: "ADRIANA BUELVAS",     skills: ["General", "Buffet"] },
  { name: "ANUAR QUINTERO",      skills: ["General"] },
  { name: "AYLEEN GONZALEZ",     skills: ["Electrodomestico"] },
  { name: "CRISTINA GUTIERREZ",  skills: ["General", "Buffet"] },
  { name: "DUBIS VALLE",         skills: ["Cosmetico", "Domicilio"] },
  { name: "DIANYS FANG",         skills: ["General"] },
  { name: "ESTEFANY ESCALANTE",  skills: ["Cosmetico"] },
  { name: "IVON RUIZ",           skills: ["General", "Buffet"] },
  { name: "JANEIBIS PUA",        skills: ["General"] },
  { name: "JUAN SEBASTIAN PIÑA", skills: ["General"] },
  { name: "JUAN CARLOS ARAGON",  skills: ["Electrodomestico", "General"] },
  { name: "KAREN VARGAS",        skills: ["General"] },
  { name: "KARINA HERNÁNDEZ",    skills: ["Electrodomestico"] },
  { name: "LOHANA TABORDA",      skills: ["General"] },
  { name: "LINA PEÑA",           skills: ["General", "Cosmetico"] },
  { name: "LAURA PACHECO",       skills: ["General"] },
  { name: "LILIANA AREVALO",     skills: ["Domicilio", "General"] },
  { name: "MICHELL ROMERO",      skills: ["General"] },
  { name: "MARIA PAULA GARCIA",  skills: ["General"] },
  { name: "MELISA MALDONADO",    skills: ["General"] },
  { name: "MARIA CASTRO",        skills: ["General", "Domicilio"] },
  { name: "MARIA DUQUE",         skills: ["General", "Domicilio"] },
  { name: "SHAIRA GUERRERO",     skills: ["Domicilio", "General"] },
  { name: "SANDRI PEREZ",        skills: ["Marking", "General"] },
  { name: "RUTH CORTES",         skills: ["General"] },
  { name: "VIVIANA PADILLA",     skills: ["General"] },
  { name: "YENIS MEJIA",         skills: ["General"] },
  { name: "YENIFER REBOLLO",     skills: ["General"] },
  { name: "STIVEN NIÑO",         skills: ["General"] },
  { name: "MARELIS CORREA",      skills: ["General"] },
];

// ============================================================
// Shift Templates — exact data from ShiftTemplateSeeder.php
// dayOfWeek: 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat, 7=Sun
// timeSlot format: "HH:MM-HH:MM|HH:MM-HH:MM" (pipe-separated two slots)
// isWildcard: true for entries marked as "Comodines" in the Laravel seeder
// ============================================================
type TemplateEntry = {
  schedule: string;
  isWildcard: boolean;
};

type DayConfig = Record<string, TemplateEntry[]>;
type WeekConfig = Record<number, DayConfig>;

const SHIFT_TEMPLATES: WeekConfig = {
  1: { // LUNES
    Electrodomestico: [
      { schedule: "7:00-11:00|11:30-14:30", isWildcard: false },
      { schedule: "14:00-16:30|17:00-21:30", isWildcard: false },
    ],
    Domicilio: [
      { schedule: "7:00-11:00|11:30-14:30", isWildcard: false },
      { schedule: "14:00-16:30|17:00-21:30", isWildcard: false },
    ],
    Cosmetico: [
      { schedule: "7:00-11:00|11:30-14:30", isWildcard: false },
      { schedule: "14:00-16:30|17:00-21:30", isWildcard: false },
    ],
    Buffet: [
      { schedule: "11:00-14:00|17:00-21:00", isWildcard: false },
    ],
    General: [
      { schedule: "7:00-11:00|11:30-14:30", isWildcard: false },
      { schedule: "7:00-11:30|12:00-14:30", isWildcard: false },
      { schedule: "8:00-12:00|12:30-15:30", isWildcard: false },
      { schedule: "8:30-11:30|16:00-20:00", isWildcard: false },
      { schedule: "9:00-13:00|13:30-16:30", isWildcard: false },
      { schedule: "10:00-13:00|16:30-21:00", isWildcard: false },
      { schedule: "10:30-13:30|14:00-17:30", isWildcard: false },
      { schedule: "11:00-13:00|13:30-18:30", isWildcard: false },
      { schedule: "11:30-14:00|14:30-19:00", isWildcard: false },
      { schedule: "12:00-14:00|14:30-19:30", isWildcard: false },
      { schedule: "13:00-14:30|15:00-20:30", isWildcard: false },
      { schedule: "14:00-15:30|16:00-21:30", isWildcard: false },
      { schedule: "14:00-16:00|16:30-21:30", isWildcard: false },
      { schedule: "14:00-16:30|17:00-21:30", isWildcard: false },
      // Comodines
      { schedule: "12:00-14:00|14:30-19:30", isWildcard: true },
      { schedule: "12:00-14:00|14:30-19:30", isWildcard: true },
      { schedule: "10:30-13:30|17:00-21:00", isWildcard: true },
    ],
  },
  2: { // MARTES
    Electrodomestico: [
      { schedule: "7:00-11:00|11:30-14:30", isWildcard: false },
      { schedule: "14:00-16:30|17:00-21:30", isWildcard: false },
    ],
    Domicilio: [
      { schedule: "7:00-11:00|11:30-14:30", isWildcard: false },
      { schedule: "14:00-16:30|17:00-21:30", isWildcard: false },
    ],
    Cosmetico: [
      { schedule: "7:00-11:00|11:30-14:30", isWildcard: false },
      { schedule: "14:00-16:30|17:00-21:30", isWildcard: false },
    ],
    Buffet: [
      { schedule: "11:00-14:00|17:00-21:00", isWildcard: false },
    ],
    Marking: [
      { schedule: "8:00-12:00|12:30-15:30", isWildcard: false },
    ],
    General: [
      { schedule: "7:00-11:00|11:30-14:30", isWildcard: false },
      { schedule: "7:00-11:30|12:00-14:30", isWildcard: false },
      { schedule: "8:00-12:00|12:30-15:30", isWildcard: false },
      { schedule: "8:30-11:30|16:00-20:00", isWildcard: false },
      { schedule: "9:00-13:00|13:30-16:30", isWildcard: false },
      { schedule: "10:00-13:00|16:30-21:00", isWildcard: false },
      { schedule: "10:30-13:30|14:00-17:30", isWildcard: false },
      { schedule: "11:00-13:00|13:30-18:30", isWildcard: false },
      { schedule: "11:30-14:00|14:30-19:00", isWildcard: false },
      { schedule: "12:00-14:00|14:30-19:30", isWildcard: false },
      { schedule: "13:00-14:30|15:00-20:30", isWildcard: false },
      { schedule: "14:00-15:30|16:00-21:30", isWildcard: false },
      { schedule: "14:00-16:00|16:30-21:30", isWildcard: false },
      { schedule: "14:00-16:30|17:00-21:30", isWildcard: false },
      // Comodines
      { schedule: "12:00-14:00|14:30-19:30", isWildcard: true },
      { schedule: "12:00-14:00|14:30-19:30", isWildcard: true },
      { schedule: "10:30-13:30|17:00-21:00", isWildcard: true },
    ],
  },
  3: { // MIERCOLES
    Electrodomestico: [
      { schedule: "7:00-13:00|13:30-15:00", isWildcard: false },
      { schedule: "9:30-13:30|14:00-17:30", isWildcard: false },
      { schedule: "13:30-16:00|16:30-21:30", isWildcard: false },
    ],
    "Valery Camacho": [
      { schedule: "7:00-11:00|15:00-19:00", isWildcard: false },
    ],
    Domicilio: [
      { schedule: "7:00-13:00|13:30-15:00", isWildcard: false },
      { schedule: "13:30-16:00|16:30-21:30", isWildcard: false },
    ],
    Cosmetico: [
      { schedule: "7:00-13:00|13:30-15:00", isWildcard: false },
      { schedule: "13:30-16:00|16:30-21:30", isWildcard: false },
    ],
    Buffet: [
      { schedule: "11:00-14:00|17:00-21:30", isWildcard: false },
    ],
    General: [
      { schedule: "7:00-12:00|12:30-15:00", isWildcard: false },
      { schedule: "7:00-12:30|13:00-15:00", isWildcard: false },
      { schedule: "7:30-13:00|13:30-15:30", isWildcard: false },
      { schedule: "8:00-11:30|16:00-20:00", isWildcard: false },
      { schedule: "8:30-13:30|14:00-16:30", isWildcard: false },
      { schedule: "9:00-13:30|14:00-17:00", isWildcard: false },
      { schedule: "9:30-13:30|14:00-17:30", isWildcard: false },
      { schedule: "10:00-14:00|14:30-18:00", isWildcard: false },
      { schedule: "10:00-13:30|17:00-21:00", isWildcard: false },
      { schedule: "10:30-14:00|14:30-18:30", isWildcard: false },
      { schedule: "11:00-14:00|14:30-19:00", isWildcard: false },
      { schedule: "11:30-14:00|14:30-19:30", isWildcard: false },
      { schedule: "12:30-14:00|14:30-20:00", isWildcard: false },
      { schedule: "13:00-15:30|16:00-21:00", isWildcard: false },
      { schedule: "13:30-15:30|16:00-21:30", isWildcard: false },
      { schedule: "13:30-16:00|16:30-21:10", isWildcard: false },
      { schedule: "13:30-16:00|16:30-21:10", isWildcard: false },
      // Comodines
      { schedule: "9:00-13:30|14:00-17:00", isWildcard: true },
      { schedule: "12:00-14:00|14:30-20:00", isWildcard: true },
    ],
  },
  4: { // JUEVES
    Electrodomestico: [
      { schedule: "7:00-11:00|11:30-14:30", isWildcard: false },
      { schedule: "14:00-16:30|17:00-21:30", isWildcard: false },
    ],
    Domicilio: [
      { schedule: "6:30-11:00|11:30-14:00", isWildcard: false },
      { schedule: "14:00-16:30|17:00-21:30", isWildcard: false },
    ],
    Cosmetico: [
      { schedule: "7:00-11:00|11:30-14:30", isWildcard: false },
      { schedule: "14:00-16:30|17:00-21:30", isWildcard: false },
    ],
    Buffet: [
      { schedule: "11:00-14:00|17:00-21:00", isWildcard: false },
    ],
    Marking: [
      { schedule: "8:00-12:00|12:30-15:30", isWildcard: false },
    ],
    General: [
      { schedule: "7:00-11:00|11:30-14:30", isWildcard: false },
      { schedule: "7:00-11:30|12:00-14:30", isWildcard: false },
      { schedule: "8:00-12:00|12:30-15:30", isWildcard: false },
      { schedule: "8:30-11:30|16:00-20:00", isWildcard: false },
      { schedule: "9:00-13:00|13:30-16:30", isWildcard: false },
      { schedule: "10:00-13:00|16:30-21:00", isWildcard: false },
      { schedule: "10:30-13:30|14:00-17:30", isWildcard: false },
      { schedule: "11:00-13:00|13:30-18:30", isWildcard: false },
      { schedule: "11:30-14:00|14:30-19:00", isWildcard: false },
      { schedule: "12:00-14:00|14:30-19:30", isWildcard: false },
      { schedule: "12:00-14:00|14:30-19:30", isWildcard: false },
      { schedule: "13:00-14:30|15:00-20:30", isWildcard: false },
      { schedule: "14:00-15:30|16:00-21:30", isWildcard: false },
      { schedule: "14:00-16:00|16:30-21:30", isWildcard: false },
      { schedule: "14:00-16:30|17:00-21:30", isWildcard: false },
      // Comodines
      { schedule: "12:00-14:00|14:30-19:30", isWildcard: true },
      { schedule: "10:30-13:30|17:00-21:00", isWildcard: true },
    ],
  },
  5: { // VIERNES
    Electrodomestico: [
      { schedule: "7:00-11:00|11:30-14:30", isWildcard: false },
      { schedule: "14:00-16:30|17:00-21:30", isWildcard: false },
    ],
    Domicilio: [
      { schedule: "7:00-11:00|11:30-14:30", isWildcard: false },
      { schedule: "14:00-16:30|17:00-21:30", isWildcard: false },
    ],
    Cosmetico: [
      { schedule: "7:00-11:00|11:30-14:30", isWildcard: false },
      { schedule: "14:00-16:30|17:00-21:30", isWildcard: false },
    ],
    Buffet: [
      { schedule: "11:00-14:00|17:00-21:00", isWildcard: false },
    ],
    General: [
      { schedule: "7:00-11:00|11:30-14:30", isWildcard: false },
      { schedule: "7:00-11:30|12:00-14:30", isWildcard: false },
      { schedule: "8:00-12:00|12:30-15:30", isWildcard: false },
      { schedule: "8:30-11:30|16:00-20:00", isWildcard: false },
      { schedule: "9:00-13:00|13:30-16:30", isWildcard: false },
      { schedule: "10:00-13:00|16:30-21:00", isWildcard: false },
      { schedule: "10:30-13:30|14:00-17:30", isWildcard: false },
      { schedule: "11:00-13:00|13:30-18:30", isWildcard: false },
      { schedule: "11:30-14:00|14:30-19:00", isWildcard: false },
      { schedule: "12:00-14:00|14:30-19:30", isWildcard: false },
      { schedule: "13:00-14:30|15:00-20:30", isWildcard: false },
      { schedule: "14:00-15:30|16:00-21:30", isWildcard: false },
      { schedule: "14:00-16:00|16:30-21:30", isWildcard: false },
      { schedule: "14:00-16:30|17:00-21:30", isWildcard: false },
      // Comodines
      { schedule: "12:00-14:00|14:30-19:30", isWildcard: true },
      { schedule: "12:00-14:00|14:30-19:30", isWildcard: true },
      { schedule: "10:30-13:30|17:00-21:00", isWildcard: true },
    ],
  },
  6: { // SABADO
    Electrodomestico: [
      { schedule: "7:00-13:00|13:30-15:30", isWildcard: false },
      { schedule: "9:30-13:30|14:00-18:00", isWildcard: false },
      { schedule: "13:00-16:00|16:30-21:30", isWildcard: false },
    ],
    Domicilio: [
      { schedule: "7:00-13:00|13:30-15:30", isWildcard: false },
      { schedule: "13:00-16:00|16:30-21:30", isWildcard: false },
    ],
    Cosmetico: [
      { schedule: "7:00-13:00|13:30-15:30", isWildcard: false },
      { schedule: "13:00-16:00|16:30-21:30", isWildcard: false },
    ],
    Buffet: [
      { schedule: "11:00-14:00|17:00-21:30", isWildcard: false },
    ],
    General: [
      { schedule: "7:00-12:00|12:30-15:30", isWildcard: false },
      { schedule: "7:00-12:30|13:00-15:30", isWildcard: false },
      { schedule: "7:30-13:00|13:30-16:00", isWildcard: false },
      { schedule: "8:00-12:00|16:00-20:00", isWildcard: false },
      { schedule: "8:30-13:30|14:00-17:00", isWildcard: false },
      { schedule: "9:00-13:30|14:00-18:00", isWildcard: false },
      { schedule: "9:30-13:30|14:00-18:30", isWildcard: false },
      { schedule: "9:30-13:30|17:00-21:00", isWildcard: false },
      { schedule: "10:00-14:00|14:30-18:30", isWildcard: false },
      { schedule: "10:00-13:30|17:00-21:00", isWildcard: false },
      { schedule: "10:30-14:00|14:30-19:00", isWildcard: false },
      { schedule: "11:00-14:00|14:30-19:30", isWildcard: false },
      { schedule: "11:30-14:00|14:30-20:00", isWildcard: false },
      { schedule: "12:30-14:00|14:30-21:00", isWildcard: false },
      { schedule: "13:00-15:30|16:00-21:30", isWildcard: false },
      { schedule: "13:15-15:30|16:00-21:45", isWildcard: false },
      { schedule: "13:15-15:30|16:00-21:45", isWildcard: false },
      { schedule: "13:15-15:30|16:00-21:45", isWildcard: false },
      // Comodines
      { schedule: "10:30-14:00|14:30-19:00", isWildcard: true },
      { schedule: "12:00-14:00|14:30-20:30", isWildcard: true },
    ],
  },
  7: { // DOMINGO
    Electrodomestico: [
      { schedule: "8:00-13:00|13:30-15:30", isWildcard: false },
      { schedule: "13:00-15:30|16:00-20:30", isWildcard: false },
    ],
    Domicilio: [
      { schedule: "8:00-13:00|13:30-15:30", isWildcard: false },
      { schedule: "13:00-15:30|16:00-20:30", isWildcard: false },
    ],
    Cosmetico: [
      { schedule: "8:00-13:00|13:30-15:30", isWildcard: false },
      { schedule: "13:00-15:30|16:00-20:30", isWildcard: false },
    ],
    General: [
      { schedule: "8:00-12:00|12:30-15:30", isWildcard: false },
      { schedule: "8:00-12:00|12:30-15:30", isWildcard: false },
      { schedule: "9:30-13:30|14:00-17:00", isWildcard: false },
      { schedule: "10:30-14:00|14:30-18:00", isWildcard: false },
      { schedule: "12:30-14:30|15:00-20:00", isWildcard: false },
      { schedule: "13:00-15:30|16:00-20:30", isWildcard: false },
      { schedule: "13:00-15:30|16:00-20:30", isWildcard: false },
      { schedule: "13:00-15:30|16:00-20:30", isWildcard: false },
      // Comodines
      { schedule: "11:30-14:00|14:30-19:00", isWildcard: true },
      { schedule: "12:30-14:30|15:00-20:00", isWildcard: true },
      { schedule: "10:00-14:00|14:30-17:30", isWildcard: true },
      { schedule: "11:00-14:30|15:00-18:30", isWildcard: true },
    ],
  },
};

async function main() {
  console.log("Starting seed...");

  // ============================================================
  // 1. Seed areas
  // ============================================================
  console.log("Seeding areas...");
  const areaMap: Record<string, number> = {};

  for (const area of AREAS) {
    const upserted = await prisma.area.upsert({
      where: { name: area.name },
      update: { color: area.color },
      create: { name: area.name, color: area.color },
    });
    areaMap[area.name] = upserted.id;
  }
  console.log(`  ${Object.keys(areaMap).length} areas seeded`);

  // ============================================================
  // 2. Seed employees (without area skills — seeded next)
  // ============================================================
  console.log("Seeding employees...");
  const employeeMap: Record<string, number> = {};

  for (const emp of EMPLOYEES) {
    // Find existing employee by name or create new one
    let existing = await prisma.employee.findFirst({ where: { name: emp.name } });
    if (!existing) {
      existing = await prisma.employee.create({ data: { name: emp.name } });
    }
    employeeMap[emp.name] = existing.id;
  }
  console.log(`  ${Object.keys(employeeMap).length} employees seeded`);

  // ============================================================
  // 3. Seed employee-area skills (initial assignments from Laravel)
  // ============================================================
  console.log("Seeding employee skills...");
  for (const emp of EMPLOYEES) {
    const employeeId = employeeMap[emp.name];
    if (!employeeId) continue;

    for (const skillName of emp.skills) {
      const areaId = areaMap[skillName];
      if (!areaId) {
        console.warn(`  Area not found for skill: ${skillName}`);
        continue;
      }
      await prisma.employeeArea.upsert({
        where: { employeeId_areaId: { employeeId, areaId } },
        update: {},
        create: { employeeId, areaId },
      });
    }
  }
  console.log("  Employee skills seeded");

  // ============================================================
  // 4. Seed shift templates
  // ============================================================
  console.log("Seeding shift templates...");

  // Clear existing templates for idempotency (upsert is hard without a unique key on schedule+day+area)
  await prisma.shiftTemplate.deleteMany();

  let templateCount = 0;
  for (const [dayOfWeekStr, areaTemplates] of Object.entries(SHIFT_TEMPLATES)) {
    const dayOfWeek = parseInt(dayOfWeekStr);

    for (const [areaName, templates] of Object.entries(areaTemplates)) {
      const areaId = areaMap[areaName];
      if (!areaId) {
        console.warn(`  Area not found for template: ${areaName}`);
        continue;
      }

      for (const template of templates) {
        await prisma.shiftTemplate.create({
          data: {
            areaId,
            dayOfWeek,
            timeSlot: template.schedule,
            isWildcard: template.isWildcard,
            requiredCount: 1,
          },
        });
        templateCount++;
      }
    }
  }
  console.log(`  ${templateCount} shift templates seeded`);

  // ============================================================
  // 5. Seed admin user (compatible with better-auth)
  // IMPORTANT: uses better-auth/crypto scrypt hash (NOT bcryptjs)
  // ============================================================
  console.log("Seeding admin user...");
  const adminEmail = "yuli@diferencialdx.com";
  const adminPassword = "3176890957a";

  const hashedPassword = await hashPassword(adminPassword);

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingUser) {
    const user = await prisma.user.create({
      data: {
        email: adminEmail,
        name: "Administradora",
        emailVerified: true,
      },
    });

    // Create account record with hashed password (better-auth credential format)
    await prisma.account.create({
      data: {
        accountId: user.id,
        providerId: "credential",
        userId: user.id,
        password: hashedPassword,
      },
    });
    console.log(`  Admin user created: ${adminEmail}`);
  } else {
    // Update password hash in case it changed
    await prisma.account.updateMany({
      where: {
        userId: existingUser.id,
        providerId: "credential",
      },
      data: { password: hashedPassword },
    });
    console.log(`  Admin user already exists, password updated: ${adminEmail}`);
  }

  // ============================================================
  // Verification summary
  // ============================================================
  const [empCount, areaCount, templateCount2, userCount] = await Promise.all([
    prisma.employee.count(),
    prisma.area.count(),
    prisma.shiftTemplate.count(),
    prisma.user.count(),
  ]);

  console.log("\nSeed complete:");
  console.log(`  Employees:       ${empCount}`);
  console.log(`  Areas:           ${areaCount}`);
  console.log(`  ShiftTemplates:  ${templateCount2}`);
  console.log(`  Users:           ${userCount}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
