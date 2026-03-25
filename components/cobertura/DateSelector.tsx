"use client";

import { useRouter } from "next/navigation";

interface DateSelectorProps {
  fechaActual: string; // "YYYY-MM-DD"
}

export default function DateSelector({ fechaActual }: DateSelectorProps) {
  const router = useRouter();

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newDate = e.target.value;
    if (newDate) {
      router.push(`/cobertura?fecha=${newDate}`);
    }
  }

  return (
    <input
      type="date"
      value={fechaActual}
      onChange={handleChange}
      className="rounded-md border px-3 py-1.5 text-sm"
      style={{
        background: "var(--glass-bg)",
        borderColor: "var(--glass-border)",
        color: "var(--foreground)",
      }}
    />
  );
}
