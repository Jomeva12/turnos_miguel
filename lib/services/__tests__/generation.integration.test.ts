/**
 * lib/services/__tests__/generation.integration.test.ts
 *
 * Integration test for the full generation pipeline against the seeded database.
 * Skipped automatically when DATABASE_URL is not set (CI without DB).
 *
 * Requirements validated: GEN-01..GEN-14, LOG-01..LOG-03
 */

import { describe, it, expect, beforeAll } from 'vitest'
import { getEmployeesWithAreas } from '@/lib/db/employees'
import { getShiftTemplates } from '@/lib/db/templates'
import { getAbsencesForMonth } from '@/lib/db/absences'
import { generateMonthShifts } from '@/lib/services/generation'
import type { GenerationResult, ShiftTemplateFlat, EmployeeWithAreas } from '@/types/generation'
import type { EmployeeRow } from '@/types/planilla'

const skipIfNoDB = process.env.DATABASE_URL ? describe : describe.skip

skipIfNoDB('Generation integration — March 2026', () => {
  let result: GenerationResult
  let templates: ShiftTemplateFlat[]

  beforeAll(async () => {
    const [employeeRows, tmpl, absences] = await Promise.all([
      getEmployeesWithAreas(),
      getShiftTemplates(),
      getAbsencesForMonth(3, 2026),
    ])
    templates = tmpl
    // Map EmployeeRow (planilla UI type) to EmployeeWithAreas (algorithm type)
    const employees: EmployeeWithAreas[] = employeeRows.map((e: EmployeeRow) => ({
      id: e.id,
      name: e.name,
      areas: e.areaIds.map((areaId, i) => ({ areaId, areaName: e.areaNames[i] })),
    }))
    result = generateMonthShifts({ month: 3, year: 2026, employees, templates: tmpl, absences })
  }, 30000)

  // -------------------------------------------------------------------------
  // DB layer
  // -------------------------------------------------------------------------

  it('loads at least 25 employees from seed', async () => {
    const employees = await getEmployeesWithAreas()
    expect(employees.length).toBeGreaterThanOrEqual(25)
  })

  // -------------------------------------------------------------------------
  // Rest day rules (GEN-09, GEN-10, GEN-11)
  // -------------------------------------------------------------------------

  it('produces exactly 4 rest days per employee', () => {
    const employeeIds = [...new Set(result.shifts.map(s => s.employeeId))]
    for (const empId of employeeIds) {
      const rests = result.shifts.filter(s => s.employeeId === empId && s.isRest)
      expect(rests.length).toBe(4)
    }
  })

  it('has no rest on Saturday (UTC day 6)', () => {
    const satRests = result.shifts.filter(s => s.isRest && new Date(s.date).getUTCDay() === 6)
    expect(satRests).toHaveLength(0)
  })

  it('has no rest on day >= 28 (zona crítica)', () => {
    const lateRests = result.shifts.filter(s => s.isRest && new Date(s.date).getUTCDate() >= 28)
    expect(lateRests).toHaveLength(0)
  })

  // -------------------------------------------------------------------------
  // Special area rules (GEN-03, GEN-04, GEN-05)
  // -------------------------------------------------------------------------

  it('Marking area shifts only on Tue (UTC 2) or Thu (UTC 4)', () => {
    const markingAreaId = templates.find(t => t.areaName === 'Marking')?.areaId
    if (!markingAreaId) return
    const markingShifts = result.shifts.filter(s => s.areaId === markingAreaId && !s.isRest)
    for (const s of markingShifts) {
      // UTC day: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
      const dow = new Date(s.date).getUTCDay()
      expect([2, 4]).toContain(dow)
    }
  })

  it('Valery Camacho area shifts only on Wed (UTC 3)', () => {
    const valeryAreaId = templates.find(t => t.areaName === 'Valery Camacho')?.areaId
    if (!valeryAreaId) return
    const valeryShifts = result.shifts.filter(s => s.areaId === valeryAreaId && !s.isRest)
    for (const s of valeryShifts) {
      const dow = new Date(s.date).getUTCDay()
      expect(dow).toBe(3) // Wed
    }
  })

  it('Buffet area has no shifts on Sunday (UTC 0)', () => {
    const buffetAreaId = templates.find(t => t.areaName === 'Buffet')?.areaId
    if (!buffetAreaId) return
    const buffetSundayShifts = result.shifts.filter(
      s => s.areaId === buffetAreaId && !s.isRest && new Date(s.date).getUTCDay() === 0
    )
    expect(buffetSundayShifts).toHaveLength(0)
  })

  // -------------------------------------------------------------------------
  // Assignment integrity — no out-of-area assignments (GEN-06)
  // -------------------------------------------------------------------------

  it('no employee is assigned to an area outside their EmployeeArea records', async () => {
    const employees = await getEmployeesWithAreas()
    const employeeAreaMap = new Map<number, Set<number>>()
    for (const emp of employees) {
      employeeAreaMap.set(emp.id, new Set(emp.areaIds))
    }

    const violations = result.shifts.filter(s => {
      if (s.isRest || s.areaId === null) return false
      const allowed = employeeAreaMap.get(s.employeeId)
      return !allowed?.has(s.areaId)
    })
    expect(violations).toHaveLength(0)
  })

  // -------------------------------------------------------------------------
  // Log output (LOG-01)
  // -------------------------------------------------------------------------

  it('result.log is an array', () => {
    expect(Array.isArray(result.log)).toBe(true)
  })
})
