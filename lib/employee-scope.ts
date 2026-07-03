import type { Appointment, Client, DemoData, Employee, Role, Task, User } from "@/types";

type ScopedWorkspaceData = {
  currentEmployee?: Employee;
  clients: Client[];
  appointments: Appointment[];
  tasks: Task[];
  employees: Employee[];
};

function normalizeEmail(email?: string) {
  return email?.trim().toLowerCase() ?? "";
}

export function getCurrentEmployee(data: DemoData, user: User | null, role: Role) {
  if (role !== "employee") {
    return undefined;
  }

  const userEmail = normalizeEmail(user?.email);
  const emailMatch = userEmail
    ? data.employees.find((employee) => normalizeEmail(employee.email) === userEmail)
    : undefined;

  return (
    emailMatch ??
    (data.employees.length === 1 ? data.employees[0] : undefined) ??
    data.employees.find((employee) => employee.role === "employee") ??
    data.employees[0]
  );
}

export function getScopedWorkspaceData(data: DemoData, user: User | null, role: Role): ScopedWorkspaceData {
  const currentEmployee = getCurrentEmployee(data, user, role);

  if (role !== "employee" || !currentEmployee) {
    return {
      currentEmployee,
      clients: data.clients,
      appointments: data.appointments,
      tasks: data.tasks,
      employees: data.employees
    };
  }

  const appointments = data.appointments.filter(
    (appointment) => appointment.employeeId === currentEmployee.id
  );
  const tasks = data.tasks.filter((task) => task.responsibleId === currentEmployee.id);
  const relatedClientIds = new Set(
    [
      ...appointments.map((appointment) => appointment.clientId),
      ...tasks.map((task) => task.clientId).filter(Boolean)
    ]
  );
  const clients = data.clients.filter(
    (client) => client.responsibleId === currentEmployee.id || relatedClientIds.has(client.id)
  );

  return {
    currentEmployee,
    clients,
    appointments,
    tasks,
    employees: [currentEmployee]
  };
}
