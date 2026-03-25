"use client";

import { useTransition } from "react";
import { toggleEmployeeArea } from "@/lib/actions/employees";
import { AREA_COLORS } from "@/lib/constants/areas";

// ---------------------------------------------------------------------------
// Types (mirrored from Prisma includes used in the page)
// ---------------------------------------------------------------------------

interface AreaRecord {
  id: number;
  name: string;
  color: string;
}

interface EmployeeAreaRecord {
  areaId: number;
  area: AreaRecord;
}

interface EmployeeRecord {
  id: number;
  name: string;
  areas: EmployeeAreaRecord[];
}

interface HabilidadesTableProps {
  employees: EmployeeRecord[];
  areas: AreaRecord[];
}

// ---------------------------------------------------------------------------
// Individual checkbox cell — isolates useTransition per cell for fine-grained
// pending state so toggling one checkbox doesn't freeze the entire table.
// ---------------------------------------------------------------------------

function AreaCheckbox({
  employeeId,
  areaId,
  checked,
}: {
  employeeId: number;
  areaId: number;
  checked: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newValue = e.target.checked;
    startTransition(async () => {
      await toggleEmployeeArea(employeeId, areaId, newValue);
    });
  }

  return (
    <input
      type="checkbox"
      defaultChecked={checked}
      onChange={handleChange}
      disabled={isPending}
      className="h-4 w-4 cursor-pointer accent-emerald-500"
      style={{ opacity: isPending ? 0.4 : 1, transition: "opacity 0.15s" }}
      aria-label={`Toggle area ${areaId} for employee ${employeeId}`}
    />
  );
}

// ---------------------------------------------------------------------------
// Main table component
// ---------------------------------------------------------------------------

export function HabilidadesTable({ employees, areas }: HabilidadesTableProps) {
  return (
    <div className="w-full overflow-x-auto rounded-xl" style={{ background: "var(--glass-bg)", backdropFilter: "blur(12px)", border: "1px solid var(--glass-border)" }}>
      <table className="min-w-full text-sm">
        {/* Header */}
        <thead>
          <tr style={{ borderBottom: "1px solid var(--glass-border)" }}>
            {/* Employee column */}
            <th
              className="px-4 py-3 text-left font-semibold text-white whitespace-nowrap"
              style={{ minWidth: "160px" }}
            >
              Asesor
            </th>

            {/* One column per area */}
            {areas.map((area) => {
              const color = AREA_COLORS[area.name] ?? area.color;
              return (
                <th
                  key={area.id}
                  className="px-3 py-3 text-center font-semibold whitespace-nowrap"
                  style={{ minWidth: "100px" }}
                >
                  <span
                    className="inline-block px-2 py-0.5 rounded-full text-xs font-medium text-white"
                    style={{ background: color }}
                  >
                    {area.name}
                  </span>
                </th>
              );
            })}
          </tr>
        </thead>

        {/* Body */}
        <tbody>
          {employees.map((employee) => {
            const assignedAreaIds = new Set(employee.areas.map((ea) => ea.areaId));
            const hasNoAreas = assignedAreaIds.size === 0;

            return (
              <tr
                key={employee.id}
                style={{
                  borderBottom: "1px solid var(--glass-border)",
                  // Yellow border warning for employees with zero assigned areas
                  outline: hasNoAreas ? "2px solid #facc15" : "none",
                  outlineOffset: "-2px",
                }}
                className="transition-colors hover:bg-white/5"
              >
                {/* Employee name */}
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">{employee.name}</span>
                    {hasNoAreas && (
                      <span
                        className="inline-block px-1.5 py-0.5 rounded text-xs font-semibold"
                        style={{ background: "#facc1533", color: "#facc15", border: "1px solid #facc15" }}
                        title="Sin áreas asignadas"
                      >
                        sin áreas
                      </span>
                    )}
                  </div>
                </td>

                {/* Checkbox per area */}
                {areas.map((area) => (
                  <td key={area.id} className="px-3 py-3 text-center">
                    <AreaCheckbox
                      employeeId={employee.id}
                      areaId={area.id}
                      checked={assignedAreaIds.has(area.id)}
                    />
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
