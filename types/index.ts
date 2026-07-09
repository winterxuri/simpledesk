export type Role = "owner" | "admin" | "employee";
export type ThemeMode = "light" | "dark";

export type QuickCreateType =
  | "client"
  | "appointment"
  | "task"
  | "sale"
  | "product"
  | "material"
  | "resource"
  | "promotion"
  | "employee";

export type ModuleCode =
  | "dashboard"
  | "calendar"
  | "clients"
  | "employees"
  | "inventory"
  | "sales"
  | "finance"
  | "resources"
  | "promotions"
  | "tasks"
  | "reports"
  | "analytics"
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
export type TaskStatus = "new" | "inProgress" | "waiting" | "done" | "overdue" | "cancelled";
export type SaleStatus = "completed" | "cancelled" | "refunded" | "partiallyRefunded";
export type SalePaymentMethod = "cash" | "card" | "transfer" | "online" | "mixed";
export type SalePaymentStatus = "paid" | "partial" | "unpaid" | "refunded";
export type FinancialOperationSource = "manual" | "sale" | "refund" | "appointment" | "inventory";
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
  phone?: string;
  email?: string;
  position: string;
  status: "working" | "dayOff" | "vacation" | "dismissed";
  schedule: string;
  loadPercent: number;
  revenue: number;
  appointmentsCount: number;
  rating: number;
  role: Role;
  compensationType?: "fixed" | "commission" | "mixed";
  baseSalary?: number;
  commissionPercent?: number;
  dismissedAt?: string;
}

export interface EmployeeInvite {
  id?: string;
  token: string;
  companyId?: string;
  employeeId?: string;
  email: string;
  role: Role;
  status: "pending" | "accepted" | "expired" | "cancelled";
  expiresAt: string;
  companyName?: string;
  employeeName?: string;
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
  startDate?: string;
  endDate?: string;
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
  paymentMethod?: SalePaymentMethod;
  source?: FinancialOperationSource;
  clientId?: string;
  employeeId?: string;
  appointmentId?: string;
}

export interface Sale {
  id: string;
  date: string;
  productId?: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  category: string;
  paymentMethod: SalePaymentMethod;
  paymentStatus: SalePaymentStatus;
  discountPercent: number;
  discountAmount: number;
  promotionId?: string;
  clientId?: string;
  employeeId?: string;
  financialOperationId?: string;
  inventoryMovementId?: string;
  status: SaleStatus;
  comment: string;
  refundedAmount: number;
  refundedQuantity: number;
  cancelReason?: string;
  cancelledAt?: string;
}

export interface ReportSummary {
  income: number;
  expenses: number;
  profit: number;
  averageCheck: number;
  salesCount: number;
  appointments: number;
  completedAppointments: number;
  paidAppointments: number;
  clients: number;
  newClients: number;
  tasksOpen: number;
  tasksDone: number;
  lowStock: number;
  inventoryWriteOff: number;
}

export interface ReportSnapshot {
  id: string;
  title: string;
  periodStart: string;
  periodEnd: string;
  generatedAt: string;
  summary: ReportSummary;
  sections: {
    financeByCategory: {
      id: string;
      category: string;
      type: "income" | "expense";
      amount: number;
      count: number;
    }[];
    employees: {
      id: string;
      name: string;
      revenue: number;
      appointments: number;
      load: number;
    }[];
    appointments: {
      id: string;
      date: string;
      time: string;
      title: string;
      client: string;
      employee: string;
      price: number;
      status: AppointmentStatus;
      paid: boolean;
    }[];
    inventory: {
      id: string;
      name: string;
      stock: number;
      minStock: number;
      status: ProductStatus;
      supplier: string;
    }[];
  };
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

export interface DashboardWidget {
  id: string;
  title: string;
  type: "metric" | "schedule" | "attention" | "chart";
  visible: boolean;
  order: number;
}

export interface DemoData {
  clients: Client[];
  employees: Employee[];
  appointments: Appointment[];
  products: Product[];
  inventoryMovements: InventoryMovement[];
  sales: Sale[];
  resources: Resource[];
  promotions: Promotion[];
  tasks: Task[];
  financialOperations: FinancialOperation[];
  reportSnapshots: ReportSnapshot[];
  notifications: Notification[];
  dashboardWidgets: DashboardWidget[];
}

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  variant?: "success" | "info" | "warning" | "error";
}
