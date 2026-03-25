"use server";

export type AbsenceType = "VAC" | "INC" | "PER" | "CAL";

export async function createAbsence(data: any) {
  return { success: true };
}

export async function getAbsences() {
  return [];
}

export async function deleteAbsence(id: number) {
  return { success: true };
}

export async function clearMonthAbsences(mes: number, anio: number) {
  return { success: true };
}
