"use client";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type {
  Appointment,
  Client,
  Company,
  CompanyModule,
  Employee,
  FinancialOperation,
  InventoryMovement,
  Product,
  Promotion,
  ReportSnapshot,
  Resource,
  Sale,
  Task
} from "@/types";

export class SupabaseSyncError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SupabaseSyncError";
  }
}

export function canSync(companyId: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(companyId);
}

export async function syncCompany(company: Company) {
  if (!canSync(company.id)) return;
  await safeSync(() =>
    createSupabaseBrowserClient()
      .from("companies")
      .update({
        name: company.name,
        business_template_id: company.businessTemplateId,
        industry: company.industry,
        address: company.address,
        phone: company.phone,
        email: company.email,
        timezone: company.timezone,
        currency: company.currency,
        work_days: company.workDays,
        work_hours: company.workHours,
        terminology: company.terminology
      })
      .eq("id", company.id)
  );
}

export async function syncCompanyModules(companyId: string, modules: CompanyModule[]) {
  if (!canSync(companyId)) return;
  await safeSync(() =>
    createSupabaseBrowserClient().from("company_modules").upsert(
      modules.map((module) => ({
        company_id: companyId,
        code: module.code,
        status: module.status,
        visible: module.visible,
        sort_order: module.order,
        available_on_tariff: module.availableOnTariff
      })),
      { onConflict: "company_id,code" }
    )
  );
}

export async function syncClient(companyId: string, client: Client) {
  if (!canSync(companyId) || !canSync(client.id)) return;
  await safeSync(() =>
    createSupabaseBrowserClient().from("clients").upsert({
      id: client.id,
      company_id: companyId,
      name: client.name,
      phone: client.phone,
      email: client.email,
      status: client.status,
      responsible_employee_id: canSync(client.responsibleId) ? client.responsibleId : null,
      total_spent: client.totalSpent,
      visits: client.visits,
      last_visit: client.lastVisit,
      next_appointment: client.nextAppointment ?? null,
      source: client.source,
      notes: client.notes
    })
  );
}

export async function syncAppointment(companyId: string, appointment: Appointment) {
  if (!canSync(companyId) || !canSync(appointment.id)) return;
  await safeSync(() =>
    createSupabaseBrowserClient().from("appointments").upsert({
      id: appointment.id,
      company_id: companyId,
      client_id: canSync(appointment.clientId) ? appointment.clientId : null,
      employee_id: canSync(appointment.employeeId) ? appointment.employeeId : null,
      resource_id: appointment.resourceId && canSync(appointment.resourceId) ? appointment.resourceId : null,
      title: appointment.title,
      date: appointment.date,
      time: appointment.time,
      duration_minutes: appointment.duration,
      price: appointment.price,
      status: toDbAppointmentStatus(appointment.status),
      paid: appointment.paid,
      comment: appointment.comment ?? null
    })
  );
}

export async function syncEmployee(companyId: string, employee: Employee) {
  if (!canSync(companyId) || !canSync(employee.id)) return;
  await safeSync(() =>
    createSupabaseBrowserClient().from("employees").upsert({
      id: employee.id,
      company_id: companyId,
      phone: employee.phone ?? null,
      email: employee.email ?? null,
      name: employee.name,
      position: employee.position,
      status: employee.status,
      schedule: employee.schedule,
      role: employee.role,
      load_percent: employee.loadPercent,
      revenue: employee.revenue,
      appointments_count: employee.appointmentsCount,
      rating: employee.rating,
      compensation_type: employee.compensationType ?? "fixed",
      base_salary: employee.baseSalary ?? 0,
      commission_percent: employee.commissionPercent ?? 0,
      dismissed_at: employee.dismissedAt ?? null
    })
  );
}

export async function deleteEmployee(companyId: string, employeeId: string) {
  if (!canSync(companyId) || !canSync(employeeId)) return;
  await safeSync(() =>
    createSupabaseBrowserClient()
      .from("employees")
      .delete()
      .eq("company_id", companyId)
      .eq("id", employeeId)
  );
}

export async function syncProduct(companyId: string, product: Product) {
  if (!canSync(companyId) || !canSync(product.id)) return;
  await safeSync(() =>
    createSupabaseBrowserClient().from("products").upsert({
      id: product.id,
      company_id: companyId,
      name: product.name,
      type: product.type,
      category: product.category,
      current_stock: product.currentStock,
      min_stock: product.minStock,
      purchase_price: product.purchasePrice,
      sale_price: product.salePrice,
      supplier: product.supplier,
      status: product.status
    })
  );
}

export async function syncInventoryMovement(companyId: string, movement: InventoryMovement) {
  if (!canSync(companyId) || !canSync(movement.id) || !canSync(movement.productId)) return;
  await safeSync(() =>
    createSupabaseBrowserClient().from("inventory_movements").upsert({
      id: movement.id,
      company_id: companyId,
      product_id: movement.productId,
      type: toDbMovementType(movement.type),
      quantity: movement.quantity,
      date: movement.date,
      comment: movement.comment
    })
  );
}

export async function syncResource(companyId: string, resource: Resource) {
  if (!canSync(companyId) || !canSync(resource.id)) return;
  await safeSync(() =>
    createSupabaseBrowserClient().from("resources").upsert({
      id: resource.id,
      company_id: companyId,
      name: resource.name,
      type: resource.type,
      status: resource.status,
      load_percent: resource.loadPercent,
      future_bookings: resource.futureBookings,
      resource_condition: resource.condition,
      comment: resource.comment
    })
  );
}

export async function syncFinancialOperation(companyId: string, operation: FinancialOperation) {
  if (!canSync(companyId) || !canSync(operation.id)) return;
  await safeSync(() =>
    createSupabaseBrowserClient().from("financial_operations").upsert({
      id: operation.id,
      company_id: companyId,
      type: operation.type,
      category: operation.category,
      amount: operation.amount,
      date: operation.date,
      comment: operation.comment,
      client_id: operation.clientId && canSync(operation.clientId) ? operation.clientId : null,
      employee_id: operation.employeeId && canSync(operation.employeeId) ? operation.employeeId : null,
      appointment_id: operation.appointmentId && canSync(operation.appointmentId) ? operation.appointmentId : null
    })
  );
}

export async function syncSale(companyId: string, sale: Sale) {
  if (!canSync(companyId) || !canSync(sale.id)) return;
  await safeSync(() =>
    createSupabaseBrowserClient().from("sales").upsert({
      id: sale.id,
      company_id: companyId,
      date: sale.date,
      product_id: sale.productId && canSync(sale.productId) ? sale.productId : null,
      product_name: sale.productName,
      quantity: sale.quantity,
      unit_price: sale.unitPrice,
      amount: sale.amount,
      category: sale.category,
      payment_method: sale.paymentMethod,
      payment_status: sale.paymentStatus,
      discount_percent: sale.discountPercent,
      discount_amount: sale.discountAmount,
      promotion_id: sale.promotionId && canSync(sale.promotionId) ? sale.promotionId : null,
      client_id: sale.clientId && canSync(sale.clientId) ? sale.clientId : null,
      employee_id: sale.employeeId && canSync(sale.employeeId) ? sale.employeeId : null,
      financial_operation_id:
        sale.financialOperationId && canSync(sale.financialOperationId)
          ? sale.financialOperationId
          : null,
      inventory_movement_id:
        sale.inventoryMovementId && canSync(sale.inventoryMovementId)
          ? sale.inventoryMovementId
          : null,
      status: sale.status,
      comment: sale.comment,
      refunded_amount: sale.refundedAmount,
      refunded_quantity: sale.refundedQuantity,
      cancel_reason: sale.cancelReason ?? null,
      cancelled_at: sale.cancelledAt ?? null
    })
  );
}

export async function syncPromotion(companyId: string, promotion: Promotion) {
  if (!canSync(companyId) || !canSync(promotion.id)) return;
  await safeSync(() =>
    createSupabaseBrowserClient().from("promotions").upsert({
      id: promotion.id,
      company_id: companyId,
      name: promotion.name,
      period: promotion.period,
      starts_at: promotion.startDate ?? null,
      ends_at: promotion.endDate ?? null,
      status: promotion.status,
      conditions: promotion.conditions,
      usage_count: promotion.usageCount,
      revenue: promotion.revenue,
      new_clients: promotion.newClients,
      efficiency: promotion.efficiency,
      description: promotion.description
    })
  );
}

export async function syncReportSnapshot(companyId: string, report: ReportSnapshot) {
  if (!canSync(companyId) || !canSync(report.id)) return;
  await safeSync(() =>
    createSupabaseBrowserClient().from("report_snapshots").upsert({
      id: report.id,
      company_id: companyId,
      title: report.title,
      period_start: report.periodStart,
      period_end: report.periodEnd,
      generated_at: report.generatedAt,
      summary: report.summary,
      sections: report.sections
    })
  );
}

export async function deleteReportSnapshot(companyId: string, reportId: string) {
  if (!canSync(companyId) || !canSync(reportId)) return;
  await safeSync(() =>
    createSupabaseBrowserClient()
      .from("report_snapshots")
      .delete()
      .eq("company_id", companyId)
      .eq("id", reportId)
  );
}

export async function syncTask(companyId: string, task: Task) {
  if (!canSync(companyId) || !canSync(task.id)) return;
  const supabase = createSupabaseBrowserClient();

  await safeSync(() =>
    supabase.from("tasks").upsert({
      id: task.id,
      company_id: companyId,
      title: task.title,
      description: task.description,
      responsible_employee_id: canSync(task.responsibleId) ? task.responsibleId : null,
      due_date: task.dueDate,
      priority: task.priority,
      status: toDbTaskStatus(task.status),
      client_id: task.clientId && canSync(task.clientId) ? task.clientId : null,
      appointment_id: task.appointmentId && canSync(task.appointmentId) ? task.appointmentId : null,
      product_id: task.productId && canSync(task.productId) ? task.productId : null
    })
  );

  await safeSync(() =>
    supabase
      .from("task_checklist_items")
      .delete()
      .eq("company_id", companyId)
      .eq("task_id", task.id)
  );

  if (!task.checklist.length) {
    return;
  }

  await safeSync(() =>
    supabase.from("task_checklist_items").insert(
      task.checklist.map((item, index) => ({
        company_id: companyId,
        task_id: task.id,
        title: item.title,
        done: item.done,
        sort_order: index + 1
      }))
    )
  );
}

async function safeSync(action: () => PromiseLike<{ error: unknown }>) {
  try {
    const result = await action();
    if (result.error) {
      throw new SupabaseSyncError(formatSupabaseError(result.error));
    }
  } catch (error) {
    if (error instanceof SupabaseSyncError) {
      throw error;
    }
    throw new SupabaseSyncError(formatSupabaseError(error));
  }
}

function formatSupabaseError(error: unknown) {
  const record = typeof error === "object" && error !== null ? error as Record<string, unknown> : {};
  const message = typeof record.message === "string" ? record.message : String(error);
  const details = typeof record.details === "string" ? record.details : "";
  const hint = typeof record.hint === "string" ? record.hint : "";
  const code = typeof record.code === "string" ? record.code : "";
  return [message, code ? `code: ${code}` : "", details, hint].filter(Boolean).join(" | ");
}

function toDbAppointmentStatus(status: Appointment["status"]) {
  if (status === "inProgress") return "in_progress";
  if (status === "noShow") return "no_show";
  return status;
}

function toDbMovementType(type: InventoryMovement["type"]) {
  if (type === "writeOff") return "write_off";
  return type;
}

function toDbTaskStatus(status: Task["status"]) {
  if (status === "inProgress") return "in_progress";
  return status;
}
