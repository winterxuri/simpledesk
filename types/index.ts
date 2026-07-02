export type Role = "owner" | "admin" | "employee";
export type ThemeMode = "light" | "dark";

export type ModuleCode =
  | "dashboard"
  | "calendar"
  | "clients"
  | "employees"
  | "inventory"
  | "resources"
  | "promotions"
  | "tasks"
  | "analytics"
  | "ai-assistant"
  | "integrations";

export type ModuleStatus = "enabled" | "hidden" | "disabled" | "unavailable";

export type ClientStatus =
  | "active"
  | "new"
  | "loyal"
  | "inactive"
  | "attention";

export type AppointmentStatus =
  | "planned"
  | "confirmed"
  | "inProgress"
  | "completed"
  | "cancelled"
  | "noShow";

export type ProductStatus = "ok" | "low" | "critical" | "out";
export type ResourceStatus = "free" | "busy" | "maintenance" | "unavailable";
export type PromotionStatus =
  | "draft"
  | "scheduled"
  | "active"
  | "ending"
  | "finished"
  | "paused";
export type TaskStatus = "new" | "inProgress" | "waiting" | "done" | "overdue";
export type Priority = "low" | "medium" | "high";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
}

export interface Company {
  id: string;
  name: string;
  logoUrl?: string;
  businessTemplateId: string;
  industry: string;
  address: string;
  phone: string;
  email: string;
  timezone: string;
  currency: string;
  workDays: string[];
  workHours: {
    start: string;
    end: string;
  };
  terminology: Record<string, string>;
}

export interface BusinessTemplate {
  id: string;
  title: string;
  description: string;
  icon: string;
  activeModules: ModuleCode[];
  hiddenModules: ModuleCode[];
  menuOrder: ModuleCode[];
  terminology: Record<string, string>;
  dashboardWidgets: string[];
  sampleFocus: string;
}

export interface ModuleDefinition {
  code: ModuleCode;
  title: string;
  description: string;
  icon: string;
  route: string;
  dependencies: ModuleCode[];
  defaultOrder: number;
  plan: "basic" | "pro";
}

export interface CompanyModule {
  code: ModuleCode;
  status: ModuleStatus;
  visible: boolean;
  order: number;
  availableOnTariff: boolean;
}

export interface NavigationItem {
  code: ModuleCode | "settings";
  title: string;
  route: string;
  icon: string;
  visible: boolean;
  order: number;
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email: string;
  status: ClientStatus;
  responsibleId: string;
  totalSpent: number;
  visits: number;
  lastVisit: string;
  nextAppointment?: string;
  source: string;
  notes: string;
}

export interface Employee {
  id: string;
  name: string;
  position: string;
  status: "working" | "dayOff" | "vacation";
  schedule: string;
  loadPercent: number;
  revenue: number;
  appointmentsCount: number;
  rating: number;
  role: Role;
}

export interface Appointment {
  id: string;
  clientId: string;
  employeeId: string;
  resourceId?: string;
  title: string;
  date: string;
  time: string;
  duration: number;
  price: number;
  status: AppointmentStatus;
  paid: boolean;
  comment?: string;
}

export interface Product {
  id: string;
  name: string;
  type: "product" | "material" | "part";
  category: string;
  currentStock: number;
  minStock: number;
  purchasePrice: number;
  salePrice: number;
  supplier: string;
  status: ProductStatus;
}

export interface InventoryMovement {
  id: string;
  productId: string;
  type: "income" | "writeOff" | "adjustment" | "transfer";
  quantity: number;
  date: string;
  comment: string;
}

export interface Resource {
  id: string;
  name: string;
  type: string;
  status: ResourceStatus;
  loadPercent: number;
  futureBookings: number;
  condition: string;
  comment: string;
}

export interface Promotion {
  id: string;
  name: string;
  period: string;
  status: PromotionStatus;
  conditions: string;
  usageCount: number;
  revenue: number;
  newClients: number;
  efficiency: number;
  description: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  responsibleId: string;
  dueDate: string;
  priority: Priority;
  status: TaskStatus;
  clientId?: string;
  appointmentId?: string;
  productId?: string;
  checklist: {
    title: string;
    done: boolean;
  }[];
}

export interface FinancialOperation {
  id: string;
  type: "income" | "expense";
  category: string;
  amount: number;
  date: string;
  comment: string;
}

export interface Notification {
  id: string;
  title: string;
  description: string;
  category: "clients" | "inventory" | "tasks" | "system" | "finance";
  important: boolean;
  date: string;
  read: boolean;
}

export interface AIMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  metrics?: string[];
  recommendations?: string[];
  actions?: string[];
  createdAt: string;
}

export interface DashboardWidget {
  id: string;
  title: string;
  type: "metric" | "schedule" | "attention" | "chart" | "ai";
  visible: boolean;
  order: number;
}

export interface DemoData {
  clients: Client[];
  employees: Employee[];
  appointments: Appointment[];
  products: Product[];
  inventoryMovements: InventoryMovement[];
  resources: Resource[];
  promotions: Promotion[];
  tasks: Task[];
  financialOperations: FinancialOperation[];
  notifications: Notification[];
  dashboardWidgets: DashboardWidget[];
}

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  variant?: "success" | "info" | "warning" | "error";
}
