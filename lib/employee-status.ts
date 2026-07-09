import type { Employee, EmployeeShift, EmployeeStatus } from "@/types";

export function getEmployeeStatusForDate(
  employee: Employee,
  shifts: EmployeeShift[],
  date: string
): EmployeeStatus {
  if (employee.status === "dismissed") {
    return "dismissed";
  }

  const shift = shifts.find((item) => item.employeeId === employee.id && item.date === date);
  if (!shift) {
    return employee.status;
  }

  if (shift.type === "work") {
    return "working";
  }

  return shift.type;
}

export function getEmployeeStatusLabel(status: EmployeeStatus) {
  const labels: Record<EmployeeStatus, string> = {
    working: "Работает",
    dayOff: "Выходной",
    vacation: "Отпуск",
    sick: "Больничный",
    dismissed: "Уволен"
  };
  return labels[status];
}

export function getShiftLabel(shift?: EmployeeShift) {
  if (!shift) {
    return "График не задан";
  }
  if (shift.type === "work") {
    return `${shift.startTime || "??:??"}-${shift.endTime || "??:??"}`;
  }
  return getEmployeeStatusLabel(shift.type);
}
