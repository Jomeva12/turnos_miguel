"use client";

import { useTransition, useState } from "react";
import { createAbsence } from "@/lib/actions/ausencias";
import type { AbsenceType } from "@/lib/actions/ausencias";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EmployeeOption {
  id: number;
  name: string;
}

interface AusenciasFormProps {
  employees: EmployeeOption[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TIPO_OPTIONS: { value: AbsenceType; label: string }[] = [
  { value: "VAC", label: "Vacaciones" },
  { value: "INC", label: "Incapacidad" },
  { value: "PER", label: "Permiso" },
  { value: "CAL", label: "Calamidad" },
];

const INITIAL_STATE = {
  employeeId: "",
  tipo: "VAC" as AbsenceType,
  fechaInicio: "",
  fechaFin: "",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AusenciasForm({ employees }: AusenciasFormProps) {
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState(INITIAL_STATE);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) {
    const { name, value } = e.target;

    setForm((prev) => {
      const next = { ...prev, [name]: value };

      // Auto-fill end date with start date for non-VAC types (single-day absences)
      if (name === "fechaInicio" && next.tipo !== "VAC") {
        next.fechaFin = value;
      }

      // When switching to non-VAC, align end date to start date if set
      if (name === "tipo" && value !== "VAC" && prev.fechaInicio) {
        next.fechaFin = prev.fechaInicio;
      }

      return next;
    });

    setError(null);
    setSuccess(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.employeeId || !form.fechaInicio || !form.fechaFin) {
      setError("Todos los campos son requeridos.");
      return;
    }

    startTransition(async () => {
      try {
        await createAbsence({
          employeeId: parseInt(form.employeeId, 10),
          type: form.tipo,
          startDate: form.fechaInicio,
          endDate: form.fechaFin,
        });
        setForm(INITIAL_STATE);
        setSuccess(true);
        setError(null);
      } catch {
        setError("Error al registrar la novedad. Inténtalo de nuevo.");
      }
    });
  }

  const inputClass =
    "w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:border-white/40 focus:bg-white/15 transition-colors disabled:opacity-50";

  const labelClass = "block text-sm font-medium text-white/70 mb-1";

  return (
    <div
      className="rounded-xl p-6 space-y-5"
      style={{
        background: "var(--glass-bg)",
        backdropFilter: "blur(12px)",
        border: "1px solid var(--glass-border)",
      }}
    >
      <h2 className="text-lg font-semibold text-white">Registrar Novedad</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Empleado */}
        <div>
          <label htmlFor="employeeId" className={labelClass}>
            Empleado
          </label>
          <select
            id="employeeId"
            name="employeeId"
            value={form.employeeId}
            onChange={handleChange}
            required
            disabled={isPending}
            className={inputClass}
          >
            <option value="" disabled style={{ background: "#1e293b" }}>
              Seleccionar empleado…
            </option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id} style={{ background: "#1e293b" }}>
                {emp.name}
              </option>
            ))}
          </select>
        </div>

        {/* Tipo */}
        <div>
          <label htmlFor="tipo" className={labelClass}>
            Tipo de novedad
          </label>
          <select
            id="tipo"
            name="tipo"
            value={form.tipo}
            onChange={handleChange}
            disabled={isPending}
            className={inputClass}
          >
            {TIPO_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value} style={{ background: "#1e293b" }}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Fechas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="fechaInicio" className={labelClass}>
              Fecha inicio
            </label>
            <input
              id="fechaInicio"
              type="date"
              name="fechaInicio"
              value={form.fechaInicio}
              onChange={handleChange}
              required
              disabled={isPending}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="fechaFin" className={labelClass}>
              Fecha fin
            </label>
            <input
              id="fechaFin"
              type="date"
              name="fechaFin"
              value={form.fechaFin}
              onChange={handleChange}
              required
              disabled={isPending}
              className={inputClass}
            />
          </div>
        </div>

        {/* Error / Success */}
        {error && (
          <p className="text-sm text-red-400">{error}</p>
        )}
        {success && (
          <p className="text-sm text-green-400">Novedad registrada correctamente.</p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isPending}
          className="w-full sm:w-auto px-6 py-2 rounded-lg font-medium text-white transition-all disabled:opacity-50"
          style={{
            background: isPending ? "var(--glass-bg-hover)" : "var(--primary)",
          }}
        >
          {isPending ? "Registrando…" : "Registrar Novedad"}
        </button>
      </form>
    </div>
  );
}
