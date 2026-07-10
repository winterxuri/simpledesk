"use client";

import { buildDefaultCompanyModules } from "@/config/navigation";
import { getBusinessTemplate } from "@/config/templates";
import { createInitialBusinessData } from "@/data/initial-data";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { getLocalDateKey } from "@/lib/utils";
import type {
  Appointment,
  AppointmentStatus,
  Client,
  ClientStatus,
  Company,
  CompanyModule,
  DemoData,
  Employee,
  EmployeeInvite,
  EmployeeShift,
  FinancialOperation,
  InventoryMovement,
  ModuleCode,
  ModuleStatus,
  Notification,
  Product,
  ProductStatus,
  Promotion,
  PromotionStatus,
  ReportSnapshot,
  Resource,
  ResourceStatus,
  Role,
  Sale,
  SaleStatus,
  Task,
  TaskStatus
} from "@/types";

export interface OwnerSignupResult {
  requiresEmailConfirmation: boolean;
  companyId?: string;
  ownerEmployeeId?: string;
}

export interface BackendWorkspace {
  user: {
    id: string;
    name: string;
    email: string;
    role: Role;
  };
  company: Partial<Company> & { id: string; name: string };
  ownerEmployeeId?: string;
  onboardingComplete: boolean;
  companyModules?: CompanyModule[];
  data?: DemoData;
}

export async function signUpOwner({
  companyName,
  email,
  name,
  password
}: {
  name: string;
  email: string;
  password: string;
  companyName: string;
}): Promise<OwnerSignupResult> {
  const supabase = createSupabaseBrowserClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        company_name: companyName
      }
    }
  });

  if (error) {
    throwSupabaseError("Auth signup", error);
  }

  if (!data.session || !data.user) {
    return { requiresEmailConfirmation: true };
  }

  const companyId = crypto.randomUUID();
  const ownerEmployeeId = crypto.randomUUID();

  const { error: companyError } = await supabase
    .from("companies")
    .insert({
      id: companyId,
      name: companyName,
      business_template_id: "universal",
      industry: "Универсальный бизнес",
      email,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Europe/Moscow",
      terminology: getBusinessTemplate("universal").terminology
    });

  if (companyError) {
    throwSupabaseError("Create company", companyError);
  }

  const { error: memberError } = await supabase.from("company_members").insert({
    company_id: companyId,
    user_id: data.user.id,
    role: "owner",
    display_name: name
  });

  if (memberError) {
    throwSupabaseError("Create company member", memberError);
  }

  const { error: employeeError } = await supabase
    .from("employees")
    .insert({
      id: ownerEmployeeId,
      company_id: companyId,
      user_id: data.user.id,
      name,
      email,
      position: "Владелец",
      status: "working",
      schedule: "09:00-18:00",
      role: "owner",
      rating: 5,
      compensation_type: "mixed",
      base_salary: 0,
      commission_percent: 0
    });

  if (employeeError) {
    throwSupabaseError("Create owner employee", employeeError);
  }

  const { error: modulesError } = await supabase.from("company_modules").insert(
    buildDefaultCompanyModules("universal").map((module) => ({
      company_id: companyId,
      code: module.code,
      status: module.status,
      visible: module.visible,
      sort_order: module.order,
      available_on_tariff: module.availableOnTariff
    }))
  );

  if (modulesError) {
    throwSupabaseError("Create company modules", modulesError);
  }

  return {
    requiresEmailConfirmation: false,
    companyId,
    ownerEmployeeId
  };
}

export async function signInUser(email: string, password: string) {
  const supabase = createSupabaseBrowserClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    throwSupabaseError("Auth signin", error);
  }

  return loadCurrentBackendWorkspace();
}

export async function signOutUser() {
  const { error } = await createSupabaseBrowserClient().auth.signOut();
  if (error) {
    throwSupabaseError("Auth signout", error);
  }
}

export async function createEmployeeInvite({
  companyId,
  employeeId,
  email,
  role
}: {
  companyId: string;
  employeeId: string;
  email: string;
  role: Role;
}): Promise<EmployeeInvite> {
  if (!isUuid(companyId) || !isUuid(employeeId)) {
    throw new Error("Приглашение можно создать только для сохранённой компании и сотрудника.");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const { data, error } = await createSupabaseBrowserClient()
    .from("employee_invites")
    .upsert(
      {
        company_id: companyId,
        employee_id: employeeId,
        email: normalizedEmail,
        role,
        token: crypto.randomUUID(),
        status: "pending",
        expires_at: expiresAt.toISOString()
      },
      { onConflict: "company_id,email" }
    )
    .select("id, company_id, employee_id, email, role, token, status, expires_at")
    .single();

  if (error) {
    throwSupabaseError("Create employee invite", error);
  }

  return mapEmployeeInvite(data as LooseRow);
}

export async function loadEmployeeInvites(companyId: string): Promise<EmployeeInvite[]> {
  if (!isUuid(companyId)) {
    return [];
  }

  const { data, error } = await createSupabaseBrowserClient()
    .from("employee_invites")
    .select("id, company_id, employee_id, email, role, token, status, expires_at")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false });

  if (error) {
    throwSupabaseError("Load employee invites", error);
  }

  return rows(data).map(mapEmployeeInvite);
}

export async function getEmployeeInvite(token: string): Promise<EmployeeInvite | null> {
  if (!isUuid(token)) {
    return null;
  }

  const { data, error } = await createSupabaseBrowserClient()
    .rpc("get_employee_invite", { invite_token: token })
    .maybeSingle();

  if (error) {
    throwSupabaseError("Load employee invite", error);
  }

  return data ? mapEmployeeInvite(data as LooseRow) : null;
}

export async function signUpInvitedEmployee({
  email,
  name,
  password
}: {
  email: string;
  name: string;
  password: string;
}) {
  const { data, error } = await createSupabaseBrowserClient().auth.signUp({
    email,
    password,
    options: {
      data: { name }
    }
  });

  if (error) {
    throwSupabaseError("Employee signup", error);
  }

  return Boolean(data.session);
}

export async function signInForInvite(email: string, password: string) {
  const { error } = await createSupabaseBrowserClient().auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    throwSupabaseError("Employee signin", error);
  }
}

export async function acceptEmployeeInvite(token: string): Promise<BackendWorkspace | null> {
  const { error } = await createSupabaseBrowserClient()
    .rpc("accept_employee_invite", { invite_token: token });

  if (error) {
    throwSupabaseError("Accept employee invite", error);
  }

  return loadCurrentBackendWorkspace();
}

export async function loadCurrentBackendWorkspace(): Promise<BackendWorkspace | null> {
  const supabase = createSupabaseBrowserClient();
  const { data: userData } = await supabase.auth.getUser();

  if (!userData.user) {
    return null;
  }

  const { data: membership, error } = await supabase
    .from("company_members")
    .select("role, display_name, companies(*)")
    .eq("user_id", userData.user.id)
    .limit(1)
    .maybeSingle();

  if (error || !membership?.companies) {
    return null;
  }

  const company = Array.isArray(membership.companies)
    ? membership.companies[0]
    : membership.companies;

  const { data: employee } = await supabase
    .from("employees")
    .select("id")
    .eq("company_id", company.id)
    .eq("user_id", userData.user.id)
    .maybeSingle();

  const backendUser = {
    id: userData.user.id,
    name:
      membership.display_name ??
      String(userData.user.user_metadata?.name ?? userData.user.email ?? "Пользователь"),
    email: userData.user.email ?? "",
    role: membership.role as Role
  };
  const [companyModules, companyData] = await Promise.all([
    loadCompanyModules(company.id),
    loadCompanyData(company.id, backendUser, employee?.id)
  ]);

  return {
    user: backendUser,
    company: {
      id: company.id,
      name: company.name,
      businessTemplateId: company.business_template_id,
      industry: company.industry,
      address: company.address ?? "",
      phone: company.phone ?? "",
      email: company.email ?? "",
      timezone: company.timezone,
      currency: company.currency,
      workDays: company.work_days,
      workHours: company.work_hours,
      terminology: company.terminology
    },
    ownerEmployeeId: employee?.id,
    onboardingComplete: Boolean(company.onboarding_complete),
    companyModules,
    data: companyData
  };
}

export async function completeBackendOnboarding(company: Company, selectedModules: ModuleCode[]) {
  if (!isUuid(company.id)) {
    return;
  }

  const supabase = createSupabaseBrowserClient();
  const template = getBusinessTemplate(company.businessTemplateId);

  const { error: companyError } = await supabase
    .from("companies")
    .update({
      business_template_id: template.id,
      industry: template.title,
      terminology: template.terminology,
      onboarding_complete: true
    })
    .eq("id", company.id);

  if (companyError) {
    throwSupabaseError("Complete onboarding company", companyError);
  }

  const { error: modulesError } = await supabase.from("company_modules").upsert(
    buildDefaultCompanyModules(template.id, selectedModules).map((module) => ({
      company_id: company.id,
      code: module.code,
      status: module.status,
      visible: module.visible,
      sort_order: module.order,
      available_on_tariff: module.availableOnTariff
    })),
    { onConflict: "company_id,code" }
  );

  if (modulesError) {
    throwSupabaseError("Complete onboarding modules", modulesError);
  }
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function throwSupabaseError(stage: string, error: unknown): never {
  const record = typeof error === "object" && error !== null ? error as Record<string, unknown> : {};
  const message = typeof record.message === "string" ? record.message : String(error);
  const details = typeof record.details === "string" ? record.details : "";
  const hint = typeof record.hint === "string" ? record.hint : "";
  const code = typeof record.code === "string" ? record.code : "";
  const parts = [
    `${stage}: ${message}`,
    code ? `code: ${code}` : "",
    details ? `details: ${details}` : "",
    hint ? `hint: ${hint}` : ""
  ].filter(Boolean);

  throw new Error(parts.join(" | "));
}

type LooseRow = Record<string, unknown>;

async function loadCompanyModules(companyId: string): Promise<CompanyModule[]> {
  const { data } = await createSupabaseBrowserClient()
    .from("company_modules")
    .select("code, status, visible, sort_order, available_on_tariff")
    .eq("company_id", companyId)
    .order("sort_order");

  const modules = (data as LooseRow[] | null)?.map((row) => ({
    code: text(row, "code") as ModuleCode,
    status: text(row, "status", "enabled") as ModuleStatus,
    visible: bool(row, "visible", true),
    order: num(row, "sort_order", 100),
    availableOnTariff: bool(row, "available_on_tariff", true)
  })) ?? [];

  return modules.length ? modules : buildDefaultCompanyModules("universal");
}

async function loadCompanyData(
  companyId: string,
  user: BackendWorkspace["user"],
  ownerEmployeeId?: string
): Promise<DemoData> {
  const base = createInitialBusinessData(user, ownerEmployeeId);
  const supabase = createSupabaseBrowserClient();
  const [
    clients,
    employees,
    employeeShifts,
    appointments,
    products,
    movements,
    resources,
    promotions,
    tasks,
    taskChecklistItems,
    sales,
    financialOperations,
    reportSnapshots,
    notifications
  ] = await Promise.all([
    supabase.from("clients").select("*").eq("company_id", companyId).order("created_at", { ascending: false }),
    supabase.from("employees").select("*").eq("company_id", companyId).order("created_at", { ascending: false }),
    supabase.from("employee_shifts").select("*").eq("company_id", companyId).order("date", { ascending: true }),
    supabase.from("appointments").select("*").eq("company_id", companyId).order("date", { ascending: false }),
    supabase.from("products").select("*").eq("company_id", companyId).order("created_at", { ascending: false }),
    supabase.from("inventory_movements").select("*").eq("company_id", companyId).order("created_at", { ascending: false }),
    supabase.from("resources").select("*").eq("company_id", companyId).order("created_at", { ascending: false }),
    supabase.from("promotions").select("*").eq("company_id", companyId).order("created_at", { ascending: false }),
    supabase.from("tasks").select("*").eq("company_id", companyId).order("created_at", { ascending: false }),
    supabase.from("task_checklist_items").select("*").eq("company_id", companyId).order("sort_order", { ascending: true }),
    supabase.from("sales").select("*").eq("company_id", companyId).order("date", { ascending: false }),
    supabase.from("financial_operations").select("*").eq("company_id", companyId).order("created_at", { ascending: false }),
    supabase.from("report_snapshots").select("*").eq("company_id", companyId).order("generated_at", { ascending: false }),
    supabase.from("notifications").select("*").eq("company_id", companyId).order("created_at", { ascending: false })
  ]);

  const checklistByTaskId = new Map<string, Task["checklist"]>();
  rows(taskChecklistItems.data).forEach((item) => {
    const taskId = text(item, "task_id");
    if (!taskId) {
      return;
    }
    checklistByTaskId.set(taskId, [
      ...(checklistByTaskId.get(taskId) ?? []),
      mapTaskChecklistItem(item)
    ]);
  });

  const mappedData: DemoData = {
    ...base,
    clients: rows(clients.data).map(mapClient),
    employees: rows(employees.data).map(mapEmployee).concat(
      rows(employees.data).length ? [] : base.employees
    ),
    employeeShifts: rows(employeeShifts.data).map(mapEmployeeShift),
    appointments: rows(appointments.data).map(mapAppointment),
    products: rows(products.data).map(mapProduct),
    inventoryMovements: rows(movements.data).map(mapInventoryMovement),
    resources: rows(resources.data).map(mapResource),
    promotions: rows(promotions.data).map(mapPromotion),
    tasks: rows(tasks.data).map((task) => mapTask(task, checklistByTaskId.get(text(task, "id")) ?? [])),
    sales: rows(sales.data).map(mapSale),
    financialOperations: rows(financialOperations.data).map(mapFinancialOperation),
    reportSnapshots: rows(reportSnapshots.data).map(mapReportSnapshot),
    notifications: rows(notifications.data).map(mapNotification).concat(
      rows(notifications.data).length ? [] : base.notifications
    )
  };

  if (user.role === "employee" && ownerEmployeeId) {
    const ownAppointments = mappedData.appointments.filter(
      (appointment) => appointment.employeeId === ownerEmployeeId
    );
    const ownTasks = mappedData.tasks.filter(
      (task) => task.responsibleId === ownerEmployeeId
    );
    const relatedClientIds = new Set([
      ...ownAppointments.map((appointment) => appointment.clientId),
      ...ownTasks.map((task) => task.clientId).filter(Boolean)
    ]);

    return {
      ...mappedData,
      clients: mappedData.clients.filter(
        (client) => client.responsibleId === ownerEmployeeId || relatedClientIds.has(client.id)
      ),
      employees: mappedData.employees.filter((employee) => employee.id === ownerEmployeeId),
      employeeShifts: mappedData.employeeShifts.filter((shift) => shift.employeeId === ownerEmployeeId),
      appointments: ownAppointments,
      tasks: ownTasks,
      products: [],
      inventoryMovements: [],
      sales: [],
      promotions: [],
      financialOperations: [],
      reportSnapshots: [],
      notifications: mappedData.notifications.filter((notification) =>
        notification.category === "resources" || notification.category === "tasks"
      )
    };
  }

  return mappedData;
}

function rows(data: unknown): LooseRow[] {
  return Array.isArray(data) ? data as LooseRow[] : [];
}

function text(row: LooseRow, key: string, fallback = "") {
  const value = row[key];
  return typeof value === "string" ? value : fallback;
}

function nullableText(row: LooseRow, key: string) {
  const value = row[key];
  return typeof value === "string" ? value : undefined;
}

function num(row: LooseRow, key: string, fallback = 0) {
  const value = row[key];
  return typeof value === "number" ? value : Number(value ?? fallback) || fallback;
}

function bool(row: LooseRow, key: string, fallback = false) {
  const value = row[key];
  return typeof value === "boolean" ? value : fallback;
}

function jsonObject<T>(row: LooseRow, key: string, fallback: T): T {
  const value = row[key];
  return typeof value === "object" && value !== null ? value as T : fallback;
}

function mapClient(row: LooseRow): Client {
  return {
    id: text(row, "id"),
    name: text(row, "name", "Клиент"),
    phone: text(row, "phone"),
    email: text(row, "email"),
    status: text(row, "status", "new") as ClientStatus,
    responsibleId: text(row, "responsible_employee_id"),
    totalSpent: num(row, "total_spent"),
    visits: num(row, "visits"),
    lastVisit: text(row, "last_visit", getLocalDateKey()),
    nextAppointment: nullableText(row, "next_appointment"),
    source: text(row, "source"),
    notes: text(row, "notes")
  };
}

function mapEmployee(row: LooseRow): Employee {
  return {
    id: text(row, "id"),
    name: text(row, "name", "Сотрудник"),
    phone: nullableText(row, "phone"),
    email: nullableText(row, "email"),
    position: text(row, "position", "Сотрудник"),
    status: text(row, "status", "working") as Employee["status"],
    schedule: text(row, "schedule", "09:00-18:00"),
    role: text(row, "role", "employee") as Role,
    loadPercent: num(row, "load_percent"),
    revenue: num(row, "revenue"),
    appointmentsCount: num(row, "appointments_count"),
    rating: num(row, "rating"),
    compensationType: text(row, "compensation_type", "fixed") as Employee["compensationType"],
    baseSalary: num(row, "base_salary"),
    commissionPercent: num(row, "commission_percent"),
    dismissedAt: nullableText(row, "dismissed_at")
  };
}

function mapEmployeeShift(row: LooseRow): EmployeeShift {
  return {
    id: text(row, "id"),
    employeeId: text(row, "employee_id"),
    date: text(row, "date"),
    type: text(row, "type", "work") as EmployeeShift["type"],
    startTime: text(row, "start_time").slice(0, 5),
    endTime: text(row, "end_time").slice(0, 5),
    comment: text(row, "comment")
  };
}

function mapAppointment(row: LooseRow): Appointment {
  return {
    id: text(row, "id"),
    clientId: text(row, "client_id"),
    employeeId: text(row, "employee_id"),
    resourceId: nullableText(row, "resource_id"),
    title: text(row, "title", "Запись"),
    date: text(row, "date"),
    time: text(row, "time").slice(0, 5),
    duration: num(row, "duration_minutes", 60),
    price: num(row, "price"),
    status: fromDbAppointmentStatus(text(row, "status", "planned")),
    paid: bool(row, "paid"),
    promotionId: nullableText(row, "promotion_id"),
    comment: nullableText(row, "comment")
  };
}

function mapProduct(row: LooseRow): Product {
  return {
    id: text(row, "id"),
    name: text(row, "name", "Товар"),
    type: text(row, "type", "product") as Product["type"],
    category: text(row, "category"),
    currentStock: num(row, "current_stock"),
    minStock: num(row, "min_stock"),
    purchasePrice: num(row, "purchase_price"),
    salePrice: num(row, "sale_price"),
    supplier: text(row, "supplier"),
    status: text(row, "status", "ok") as ProductStatus
  };
}

function mapInventoryMovement(row: LooseRow): InventoryMovement {
  return {
    id: text(row, "id"),
    productId: text(row, "product_id"),
    type: fromDbMovementType(text(row, "type", "adjustment")),
    quantity: num(row, "quantity"),
    date: text(row, "date"),
    comment: text(row, "comment")
  };
}

function mapResource(row: LooseRow): Resource {
  return {
    id: text(row, "id"),
    name: text(row, "name", "Ресурс"),
    type: text(row, "type", "ресурс"),
    status: text(row, "status", "free") as ResourceStatus,
    loadPercent: num(row, "load_percent"),
    futureBookings: num(row, "future_bookings"),
    condition: text(row, "resource_condition"),
    comment: text(row, "comment")
  };
}

function mapPromotion(row: LooseRow): Promotion {
  return {
    id: text(row, "id"),
    name: text(row, "name", "Акция"),
    period: text(row, "period"),
    startDate: nullableText(row, "starts_at"),
    endDate: nullableText(row, "ends_at"),
    status: text(row, "status", "draft") as PromotionStatus,
    conditions: text(row, "conditions"),
    usageCount: num(row, "usage_count"),
    revenue: num(row, "revenue"),
    newClients: num(row, "new_clients"),
    efficiency: num(row, "efficiency"),
    description: text(row, "description")
  };
}

function mapTask(row: LooseRow, checklist: Task["checklist"] = []): Task {
  return {
    id: text(row, "id"),
    title: text(row, "title", "Задача"),
    description: text(row, "description"),
    responsibleId: text(row, "responsible_employee_id"),
    dueDate: text(row, "due_date"),
    priority: text(row, "priority", "medium") as Task["priority"],
    status: fromDbTaskStatus(text(row, "status", "new")),
    clientId: nullableText(row, "client_id"),
    appointmentId: nullableText(row, "appointment_id"),
    productId: nullableText(row, "product_id"),
    checklist
  };
}

function mapTaskChecklistItem(row: LooseRow): Task["checklist"][number] {
  return {
    title: text(row, "title", "Пункт чек-листа"),
    done: bool(row, "done")
  };
}

function mapFinancialOperation(row: LooseRow): FinancialOperation {
  return {
    id: text(row, "id"),
    type: text(row, "type", "income") as FinancialOperation["type"],
    category: text(row, "category", "Операция"),
    amount: num(row, "amount"),
    date: text(row, "date"),
    comment: text(row, "comment"),
    paymentMethod: nullableText(row, "payment_method") as FinancialOperation["paymentMethod"],
    source: text(row, "source", "manual") as FinancialOperation["source"],
    clientId: nullableText(row, "client_id"),
    employeeId: nullableText(row, "employee_id"),
    appointmentId: nullableText(row, "appointment_id")
  };
}

function mapSale(row: LooseRow): Sale {
  return {
    id: text(row, "id"),
    date: text(row, "date"),
    productId: nullableText(row, "product_id"),
    productName: text(row, "product_name", "Продажа"),
    quantity: num(row, "quantity"),
    unitPrice: num(row, "unit_price"),
    amount: num(row, "amount"),
    category: text(row, "category", "Продажа"),
    paymentMethod: text(row, "payment_method", "cash") as Sale["paymentMethod"],
    paymentStatus: text(row, "payment_status", "paid") as Sale["paymentStatus"],
    discountPercent: num(row, "discount_percent"),
    discountAmount: num(row, "discount_amount"),
    promotionId: nullableText(row, "promotion_id"),
    clientId: nullableText(row, "client_id"),
    employeeId: nullableText(row, "employee_id"),
    financialOperationId: nullableText(row, "financial_operation_id"),
    inventoryMovementId: nullableText(row, "inventory_movement_id"),
    status: text(row, "status", "completed") as SaleStatus,
    comment: text(row, "comment"),
    refundedAmount: num(row, "refunded_amount"),
    refundedQuantity: num(row, "refunded_quantity"),
    cancelReason: nullableText(row, "cancel_reason"),
    cancelledAt: nullableText(row, "cancelled_at")
  };
}

function mapReportSnapshot(row: LooseRow): ReportSnapshot {
  return {
    id: text(row, "id"),
    title: text(row, "title", "Отчёт"),
    periodStart: text(row, "period_start"),
    periodEnd: text(row, "period_end"),
    generatedAt: text(row, "generated_at", new Date().toISOString()),
    summary: jsonObject(row, "summary", {
      income: 0,
      expenses: 0,
      profit: 0,
      averageCheck: 0,
      salesCount: 0,
      appointments: 0,
      completedAppointments: 0,
      paidAppointments: 0,
      clients: 0,
      newClients: 0,
      tasksOpen: 0,
      tasksDone: 0,
      lowStock: 0,
      inventoryWriteOff: 0
    }),
    sections: jsonObject(row, "sections", {
      financeByCategory: [],
      employees: [],
      appointments: [],
      inventory: []
    })
  };
}

function mapNotification(row: LooseRow): Notification {
  return {
    id: text(row, "id"),
    title: text(row, "title", "Уведомление"),
    description: text(row, "description"),
    category: text(row, "category", "system") as Notification["category"],
    important: bool(row, "important"),
    date: text(row, "date", getLocalDateKey()),
    read: bool(row, "read")
  };
}

function mapEmployeeInvite(row: LooseRow): EmployeeInvite {
  return {
    id: nullableText(row, "id"),
    token: text(row, "token"),
    companyId: nullableText(row, "company_id"),
    employeeId: nullableText(row, "employee_id"),
    email: text(row, "email"),
    role: text(row, "role", "employee") as Role,
    status: text(row, "status", "pending") as EmployeeInvite["status"],
    expiresAt: text(row, "expires_at"),
    companyName: nullableText(row, "company_name"),
    employeeName: nullableText(row, "employee_name")
  };
}

function fromDbAppointmentStatus(status: string): AppointmentStatus {
  if (status === "in_progress") return "inProgress";
  if (status === "no_show") return "noShow";
  return status as AppointmentStatus;
}

function fromDbMovementType(type: string): InventoryMovement["type"] {
  if (type === "write_off") return "writeOff";
  return type as InventoryMovement["type"];
}

function fromDbTaskStatus(status: string): TaskStatus {
  if (status === "in_progress") return "inProgress";
  return status as TaskStatus;
}
