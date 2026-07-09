import type { ModuleCode, Role } from "@/types";

export type PermissionAction =
  | "manageClients"
  | "manageAppointments"
  | "manageTasks"
  | "updateTaskProgress"
  | "manageEmployees"
  | "manageInventory"
  | "manageSales"
  | "manageFinance"
  | "manageResources"
  | "managePromotions"
  | "manageSettings";

const roleModuleAccess: Record<Role, Array<ModuleCode | "settings">> = {
  owner: [
    "dashboard",
    "calendar",
    "clients",
    "employees",
    "inventory",
    "sales",
    "finance",
    "resources",
    "promotions",
    "tasks",
    "reports",
    "analytics",
    "integrations",
    "settings"
  ],
  admin: [
    "dashboard",
    "calendar",
    "clients",
    "employees",
    "inventory",
    "sales",
    "finance",
    "resources",
    "promotions",
    "tasks",
    "reports",
    "analytics"
  ],
  employee: ["dashboard", "calendar", "clients", "tasks"]
};

const routeAccess: Array<{
  pattern: RegExp;
  roles: Role[];
}> = [
  { pattern: /^\/settings(?:\/|$)/, roles: ["owner"] },
  { pattern: /^\/analytics(?:\/|$)/, roles: ["owner", "admin"] },
  { pattern: /^\/reports(?:\/|$)/, roles: ["owner", "admin"] },
  { pattern: /^\/employees(?:\/|$)/, roles: ["owner", "admin"] },
  { pattern: /^\/inventory(?:\/|$)/, roles: ["owner", "admin"] },
  { pattern: /^\/sales(?:\/|$)/, roles: ["owner", "admin"] },
  { pattern: /^\/finance(?:\/|$)/, roles: ["owner", "admin"] },
  { pattern: /^\/resources(?:\/|$)/, roles: ["owner", "admin"] },
  { pattern: /^\/promotions(?:\/|$)/, roles: ["owner", "admin"] }
];

export function canAccessNavigationItem(role: Role, code: ModuleCode | "settings") {
  return roleModuleAccess[role].includes(code);
}

export function canAccessWorkspacePath(role: Role, pathname: string) {
  const restriction = routeAccess.find((item) => item.pattern.test(pathname));
  return restriction ? restriction.roles.includes(role) : true;
}

export function getDefaultPathForRole(role: Role) {
  return role === "employee" ? "/dashboard" : "/dashboard";
}

export function canPerformAction(role: Role, action: PermissionAction) {
  if (role === "owner") {
    return true;
  }

  if (role === "admin") {
    return action !== "manageSettings";
  }

  return action === "updateTaskProgress";
}
