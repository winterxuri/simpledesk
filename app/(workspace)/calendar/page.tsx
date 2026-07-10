"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs } from "@/components/ui/tabs";
import { PageHeader } from "@/components/modules/page-header";
import { StatusBadge } from "@/components/modules/status-badge";
import { useAppStore } from "@/store/app-store";
import { getScopedWorkspaceData } from "@/lib/employee-scope";
import { canPerformAction } from "@/lib/permissions";
import { getSelectablePromotions } from "@/lib/promotion-status";
import { getResourceSlotAvailability, hasResourceSlotConflict } from "@/lib/resource-availability";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Appointment, Client, Sale, SalePaymentMethod } from "@/types";

const viewTabs = [
  { value: "day", label: "День" },
  { value: "week", label: "Неделя" },
  { value: "month", label: "Месяц" }
];

const slots = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"];

const statusOptions: { value: Appointment["status"]; label: string }[] = [
  { value: "planned", label: "Запланирована" },
  { value: "confirmed", label: "Подтверждена" },
  { value: "inProgress", label: "В работе" },
  { value: "completed", label: "Завершена" },
  { value: "cancelled", label: "Отменена" },
  { value: "noShow", label: "Неявка" }
];

const paymentMethodOptions: { value: SalePaymentMethod; label: string }[] = [
  { value: "cash", label: "Наличные" },
  { value: "card", label: "Карта" },
  { value: "transfer", label: "Перевод" },
  { value: "online", label: "Онлайн" },
  { value: "mixed", label: "Смешанная оплата" }
];

const cancellationModes = [
  { value: "fullRefund", label: "Полный возврат" },
  { value: "partialRefund", label: "Частичный возврат" },
  { value: "keepPayment", label: "Оставить оплату" },
  { value: "cancelOnly", label: "Отмена без оплаты" }
] as const;

type AppointmentForm = {
  id?: string;
  clientId: string;
  employeeId: string;
  date: string;
  time: string;
  resourceId: string;
  promotionId: string;
  title: string;
  duration: string;
  price: string;
  status: Appointment["status"];
  paid: boolean;
  cancellationReason: string;
  cancelledAt: string;
  comment: string;
};

type AppointmentSaleForm = {
  appointmentId: string;
  amount: string;
  discountPercent: string;
  discountAmount: string;
  paymentMethod: SalePaymentMethod;
  category: string;
  promotionId: string;
  comment: string;
};

type CancellationMode = (typeof cancellationModes)[number]["value"];

type AppointmentCancellationForm = {
  appointmentId: string;
  reason: string;
  mode: CancellationMode;
  refundAmount: string;
};

function isoDate(offset = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return toDateInput(date);
}

function toDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function pluralRecords(count: number) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) {
    return `${count} запись`;
  }
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return `${count} записи`;
  }
  return `${count} записей`;
}

export default function CalendarPage() {
  const data = useAppStore((state) => state.data);
  const company = useAppStore((state) => state.company);
  const user = useAppStore((state) => state.user);
  const role = useAppStore((state) => state.role);
  const addAppointment = useAppStore((state) => state.addAppointment);
  const updateAppointment = useAppStore((state) => state.updateAppointment);
  const addSale = useAppStore((state) => state.addSale);
  const refundSale = useAppStore((state) => state.refundSale);
  const addToast = useAppStore((state) => state.addToast);
  const [view, setView] = useState("day");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saleDialogOpen, setSaleDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const today = isoDate();
  const scopedData = useMemo(() => getScopedWorkspaceData(data, user, role), [data, role, user]);
  const employees = scopedData.employees.slice(0, 5);
  const appointments = scopedData.appointments;
  const calendarAppointments = useMemo(
    () => appointments.filter(isVisibleInCalendar),
    [appointments]
  );
  const clients = scopedData.clients;
  const currentEmployee = scopedData.currentEmployee;
  const [form, setForm] = useState<AppointmentForm>(() => createEmptyForm(clients, today, employees[0]?.id));
  const [saleForm, setSaleForm] = useState<AppointmentSaleForm>(() => createEmptySaleForm());
  const [cancellationForm, setCancellationForm] = useState<AppointmentCancellationForm>(() => createEmptyCancellationForm());
  const canManageAppointments = canPerformAction(role, "manageAppointments");
  const canCreateAppointments = canPerformAction(role, "createAppointments");
  const canManageSales = canPerformAction(role, "manageSales");
  const scheduleGridClass = employees.length <= 1
    ? "grid min-w-[320px] grid-cols-[96px_minmax(180px,1fr)]"
    : "grid min-w-[900px] grid-cols-[96px_repeat(5,minmax(150px,1fr))]";

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, index) => isoDate(index)),
    []
  );

  const monthDays = useMemo(() => {
    const base = new Date();
    const year = base.getFullYear();
    const month = base.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: days }, (_, index) =>
      toDateInput(new Date(year, month, index + 1))
    );
  }, []);

  const byEmployeeAndTime = useMemo(() => {
    const map = new Map<string, Appointment>();
    calendarAppointments
      .filter((appointment) => appointment.date === today)
      .forEach((appointment) => {
        map.set(`${appointment.employeeId}-${appointment.time.slice(0, 5)}`, appointment);
      });
    return map;
  }, [calendarAppointments, today]);
  const resourceById = useMemo(
    () => new Map(data.resources.map((resource) => [resource.id, resource])),
    [data.resources]
  );
  const promotionById = useMemo(
    () => new Map(data.promotions.map((promotion) => [promotion.id, promotion])),
    [data.promotions]
  );
  const saleByAppointmentId = useMemo(() => {
    const map = new Map<string, Sale>();
    (data.sales ?? [])
      .filter((sale) => sale.appointmentId && sale.status !== "cancelled")
      .forEach((sale) => {
        map.set(sale.appointmentId ?? "", sale);
      });
    return map;
  }, [data.sales]);
  const selectablePromotions = useMemo(
    () => getSelectablePromotions(data.promotions, today),
    [data.promotions, today]
  );
  const currentAppointmentSale = form.id ? saleByAppointmentId.get(form.id) : undefined;
  const selectedResource = form.resourceId ? resourceById.get(form.resourceId) : undefined;
  const selectedResourceAvailability = selectedResource
    ? getResourceSlotAvailability({
        resource: selectedResource,
        appointments: data.appointments,
        date: form.date,
        time: form.time,
        duration: Number(form.duration) || 60,
        ignoreAppointmentId: form.id
      })
    : null;
  const resourceOptions = data.resources.map((resource) => {
    const availability = getResourceSlotAvailability({
      resource,
      appointments: data.appointments,
      date: form.date,
      time: form.time,
      duration: Number(form.duration) || 60,
      ignoreAppointmentId: form.id
    });
    return {
      resource,
      availability,
      label: `${resource.name} · ${resource.type} · ${availability.label}`
    };
  });
  const promotionOptions = useMemo(() => {
    const selectedPromotion = form.promotionId ? promotionById.get(form.promotionId) : undefined;
    const list =
      selectedPromotion && !selectablePromotions.some((promotion) => promotion.id === selectedPromotion.id)
        ? [...selectablePromotions, selectedPromotion]
        : selectablePromotions;

    return list.map((promotion) => ({
      value: promotion.id,
      label: promotion.name
    }));
  }, [form.promotionId, promotionById, selectablePromotions]);
  const saleSubtotal = Number(saleForm.amount);
  const saleDiscountPercent = Number(saleForm.discountPercent);
  const saleManualDiscountAmount = Number(saleForm.discountAmount);
  const saleDiscountAmount = getSaleDiscountAmount(
    saleSubtotal,
    saleDiscountPercent,
    saleManualDiscountAmount
  );
  const saleTotal = Number.isFinite(saleSubtotal) ? Math.max(0, saleSubtotal - saleDiscountAmount) : 0;
  const remainingSaleAmount = currentAppointmentSale ? getRemainingSaleAmount(currentAppointmentSale) : 0;

  function openCreate(slot?: { time: string; employeeId: string; date?: string }) {
    if (!canCreateAppointments) {
      addToast({
        title: "Недостаточно прав",
        description: "Создание записей недоступно для текущей роли.",
        variant: "warning"
      });
      return;
    }

    const employeeId = role === "employee"
      ? currentEmployee?.id
      : slot?.employeeId ?? employees[0]?.id;

    if (!employeeId) {
      addToast({
        title: "Не найден сотрудник",
        description: "Создание записи доступно только сотруднику, привязанному к карточке команды.",
        variant: "warning"
      });
      return;
    }

    setForm(createEmptyForm(clients, slot?.date ?? today, employeeId, slot?.time, canManageAppointments));
    setDialogOpen(true);
  }

  function openEdit(appointment: Appointment) {
    if (!canManageAppointments) {
      return;
    }

    setForm({
      id: appointment.id,
      clientId: appointment.clientId,
      employeeId: appointment.employeeId,
      date: appointment.date,
      time: appointment.time.slice(0, 5),
      resourceId: appointment.resourceId ?? "",
      promotionId: appointment.promotionId ?? "",
      title: appointment.title,
      duration: String(appointment.duration),
      price: String(appointment.price),
      status: appointment.status,
      paid: appointment.paid,
      cancellationReason: appointment.cancellationReason ?? "",
      cancelledAt: appointment.cancelledAt ?? "",
      comment: appointment.comment ?? ""
    });
    setDialogOpen(true);
  }

  function saveAppointment() {
    const title = form.title.trim();
    const duration = Number(form.duration);
    const price = canManageAppointments ? Number(form.price) : 0;
    const employeeId = canManageAppointments ? form.employeeId : currentEmployee?.id ?? "";

    if (form.id && !canManageAppointments) {
      addToast({
        title: "Редактирование недоступно",
        description: "Сотрудник может создавать записи на себя, но редактирование существующих записей пока доступно администратору.",
        variant: "warning"
      });
      return;
    }

    if (!form.id && !canCreateAppointments) {
      addToast({
        title: "Недостаточно прав",
        description: "Создание записей недоступно для текущей роли.",
        variant: "warning"
      });
      return;
    }

    if (!form.clientId) {
      addToast({
        title: "Выберите клиента",
        description: "Сначала добавьте клиента или выберите существующего из списка.",
        variant: "warning"
      });
      return;
    }

    if (!clients.some((client) => client.id === form.clientId)) {
      addToast({
        title: "Клиент недоступен",
        description: "Сотрудник может создать запись только для клиента из своей рабочей зоны.",
        variant: "warning"
      });
      return;
    }

    if (!employeeId) {
      addToast({
        title: "Выберите сотрудника",
        description: "Запись должна быть назначена на конкретного сотрудника.",
        variant: "warning"
      });
      return;
    }

    if (!title) {
      addToast({
        title: "Укажите услугу или работу",
        description: "Название нужно для календаря, карточки клиента и отчётов.",
        variant: "warning"
      });
      return;
    }

    if (!form.date || !form.time) {
      addToast({
        title: "Укажите дату и время",
        description: "Без даты и времени запись нельзя поставить в расписание.",
        variant: "warning"
      });
      return;
    }

    if (!Number.isFinite(duration) || duration <= 0) {
      addToast({
        title: "Длительность некорректна",
        description: "Введите длительность в минутах больше нуля.",
        variant: "warning"
      });
      return;
    }

    if (!Number.isFinite(price) || price < 0) {
      addToast({
        title: "Стоимость некорректна",
        description: "Стоимость не может быть отрицательной.",
        variant: "warning"
      });
      return;
    }

    if (form.status === "cancelled" && !form.cancellationReason.trim()) {
      addToast({
        title: "Отмените запись отдельным действием",
        description: "Для отмены нужна причина и решение по оплате, если продажа уже создана.",
        variant: "warning"
      });
      return;
    }

    if (
      !form.id &&
      form.promotionId &&
      !selectablePromotions.some((promotion) => promotion.id === form.promotionId)
    ) {
      addToast({
        title: "Акция недоступна",
        description: "Для новой записи можно выбрать только активную текущую акцию.",
        variant: "warning"
      });
      return;
    }

    if (selectedResourceAvailability && hasResourceSlotConflict(selectedResourceAvailability)) {
      addToast({
        title: "Ресурс недоступен",
        description: selectedResourceAvailability.detail,
        variant: "warning"
      });
      return;
    }

    const payload = {
      clientId: form.clientId,
      employeeId,
      resourceId: form.resourceId || undefined,
      title,
      date: form.date,
      time: form.time,
      duration,
      price,
      status: canManageAppointments ? form.status : "planned",
      paid: canManageAppointments ? form.paid : false,
      promotionId: form.promotionId || undefined,
      cancellationReason: form.status === "cancelled" ? form.cancellationReason.trim() : undefined,
      cancelledAt: form.status === "cancelled" ? form.cancelledAt || today : undefined,
      comment: form.comment
    };

    if (form.id) {
      updateAppointment(form.id, payload);
    } else {
      addAppointment(payload);
    }
    setDialogOpen(false);
  }

  function openSaleDialog() {
    if (!form.id) {
      return;
    }

    if (!canManageSales) {
      addToast({
        title: "Недостаточно прав",
        description: "Создание продажи доступно владельцу или администратору.",
        variant: "warning"
      });
      return;
    }

    if (currentAppointmentSale) {
      addToast({
        title: "Продажа уже создана",
        description: "Эта запись уже связана с продажей, повторно закрывать её нельзя.",
        variant: "warning"
      });
      return;
    }

    const promotion = form.promotionId ? promotionById.get(form.promotionId) : undefined;
    const amount = Number(form.price);
    const discountPercent = promotion ? extractPromotionDiscountPercent(promotion.conditions) : 0;
    const discountAmount =
      Number.isFinite(amount) && amount > 0 && discountPercent > 0
        ? Math.round((amount * discountPercent) / 100)
        : 0;

    setSaleForm({
      appointmentId: form.id,
      amount: Number.isFinite(amount) && amount > 0 ? String(amount) : "",
      discountPercent: discountPercent ? String(discountPercent) : "0",
      discountAmount: discountAmount ? String(discountAmount) : "0",
      paymentMethod: "cash",
      category: "Записи",
      promotionId: form.promotionId,
      comment: `Оплата записи: ${form.title.trim() || company.terminology.appointment}`
    });
    setDialogOpen(false);
    setSaleDialogOpen(true);
  }

  function saveSaleFromAppointment() {
    const appointmentId = saleForm.appointmentId || form.id;
    const title = form.title.trim();
    const duration = Number(form.duration);
    const subtotal = Number(saleForm.amount);
    const discountPercent = Number(saleForm.discountPercent);
    const manualDiscountAmount = Number(saleForm.discountAmount);
    const discountAmount = getSaleDiscountAmount(subtotal, discountPercent, manualDiscountAmount);
    const total = Math.max(0, subtotal - discountAmount);
    const category = saleForm.category.trim() || "Записи";
    const promotionId = saleForm.promotionId || form.promotionId || undefined;

    if (!appointmentId) {
      addToast({
        title: "Запись не найдена",
        description: "Сначала сохраните запись, затем создайте продажу.",
        variant: "warning"
      });
      return;
    }

    if (saleByAppointmentId.has(appointmentId)) {
      addToast({
        title: "Продажа уже создана",
        description: "У этой записи уже есть связанная продажа.",
        variant: "warning"
      });
      setSaleDialogOpen(false);
      return;
    }

    if (!form.clientId || !form.employeeId || !title) {
      addToast({
        title: "Заполните запись",
        description: "Для продажи нужны клиент, сотрудник и услуга.",
        variant: "warning"
      });
      return;
    }

    if (!Number.isFinite(duration) || duration <= 0) {
      addToast({
        title: "Длительность некорректна",
        description: "Проверьте длительность записи перед созданием продажи.",
        variant: "warning"
      });
      return;
    }

    if (!Number.isFinite(subtotal) || subtotal <= 0) {
      addToast({
        title: "Укажите сумму",
        description: "Сумма до скидки должна быть больше нуля.",
        variant: "warning"
      });
      return;
    }

    if (
      !Number.isFinite(discountPercent) ||
      !Number.isFinite(manualDiscountAmount) ||
      discountPercent < 0 ||
      discountPercent > 100 ||
      manualDiscountAmount < 0 ||
      discountAmount >= subtotal
    ) {
      addToast({
        title: "Проверьте скидку",
        description: "Скидка должна быть от 0 до 100% и меньше суммы записи.",
        variant: "warning"
      });
      return;
    }

    if (!Number.isFinite(total) || total <= 0) {
      addToast({
        title: "Итоговая сумма некорректна",
        description: "К оплате должна остаться сумма больше нуля.",
        variant: "warning"
      });
      return;
    }

    updateAppointment(appointmentId, {
      clientId: form.clientId,
      employeeId: form.employeeId,
      resourceId: form.resourceId || undefined,
      title,
      date: form.date,
      time: form.time,
      duration,
      price: total,
      status: "completed",
      paid: true,
      promotionId,
      comment: form.comment
    });

    addSale({
      date: form.date,
      productName: title,
      quantity: 0,
      unitPrice: subtotal,
      amount: total,
      category,
      paymentMethod: saleForm.paymentMethod,
      paymentStatus: "paid",
      discountPercent: Number.isFinite(discountPercent) ? discountPercent : 0,
      discountAmount,
      promotionId,
      clientId: form.clientId,
      employeeId: form.employeeId,
      appointmentId,
      comment: saleForm.comment.trim() || `Оплата записи: ${title}`
    });

    addToast({
      title: "Продажа создана",
      description: "Запись завершена, оплата попала в продажи и финансы.",
      variant: "success"
    });
    setSaleDialogOpen(false);
    setSaleForm(createEmptySaleForm());
  }

  function openCancelDialog() {
    if (!form.id) {
      return;
    }

    if (!canManageAppointments) {
      addToast({
        title: "Недостаточно прав",
        description: "Отмена записи доступна владельцу или администратору.",
        variant: "warning"
      });
      return;
    }

    const remainingAmount = currentAppointmentSale ? getRemainingSaleAmount(currentAppointmentSale) : 0;
    setCancellationForm({
      appointmentId: form.id,
      reason: form.cancellationReason,
      mode: currentAppointmentSale && remainingAmount > 0 ? "fullRefund" : "cancelOnly",
      refundAmount: remainingAmount > 0 ? String(remainingAmount) : "0"
    });
    setDialogOpen(false);
    setCancelDialogOpen(true);
  }

  function saveAppointmentCancellation() {
    const appointmentId = cancellationForm.appointmentId || form.id;
    const reason = cancellationForm.reason.trim();
    const sale = appointmentId ? saleByAppointmentId.get(appointmentId) : undefined;
    const remainingAmount = sale ? getRemainingSaleAmount(sale) : 0;
    const requestedRefundAmount =
      cancellationForm.mode === "fullRefund"
        ? remainingAmount
        : cancellationForm.mode === "partialRefund"
          ? Number(cancellationForm.refundAmount)
          : 0;

    if (!appointmentId) {
      addToast({
        title: "Запись не найдена",
        description: "Откройте запись заново и повторите отмену.",
        variant: "warning"
      });
      return;
    }

    if (!reason) {
      addToast({
        title: "Укажите причину отмены",
        description: "Причина нужна для истории клиента, спорных ситуаций и отчётов.",
        variant: "warning"
      });
      return;
    }

    if (sale && cancellationForm.mode === "partialRefund") {
      if (
        !Number.isFinite(requestedRefundAmount) ||
        requestedRefundAmount <= 0 ||
        requestedRefundAmount >= remainingAmount
      ) {
        addToast({
          title: "Проверьте сумму возврата",
          description: `Для частичного возврата укажите сумму от 1 до ${Math.max(0, remainingAmount - 1)}.`,
          variant: "warning"
        });
        return;
      }
    }

    if (sale && cancellationForm.mode === "fullRefund" && remainingAmount <= 0) {
      addToast({
        title: "Возвращать нечего",
        description: "По продаже уже нет доступной суммы к возврату.",
        variant: "warning"
      });
      return;
    }

    if (sale && (cancellationForm.mode === "fullRefund" || cancellationForm.mode === "partialRefund")) {
      refundSale(sale.id, {
        amount: requestedRefundAmount,
        quantity: sale.productId ? Math.max(0, sale.quantity - (sale.refundedQuantity ?? 0)) : 0,
        reason
      });
    }

    const retainedAmount = sale ? Math.max(0, remainingAmount - requestedRefundAmount) : 0;
    const paidAfterCancellation =
      Boolean(sale) &&
      (cancellationForm.mode === "keepPayment"
        ? remainingAmount > 0
        : retainedAmount > 0);
    const nextComment = appendCancellationNote(form.comment, reason);

    updateAppointment(appointmentId, {
      status: "cancelled",
      paid: paidAfterCancellation,
      cancellationReason: reason,
      cancelledAt: today,
      comment: nextComment
    });
    setForm({
      ...form,
      status: "cancelled",
      paid: paidAfterCancellation,
      cancellationReason: reason,
      cancelledAt: today,
      comment: nextComment
    });
    setCancelDialogOpen(false);
    setCancellationForm(createEmptyCancellationForm());
    addToast({
      title: "Запись отменена",
      description: getCancellationResultText(cancellationForm.mode, requestedRefundAmount),
      variant: "success"
    });
  }

  return (
    <div>
      <PageHeader
        title="Календарь и записи"
        description={
          role === "employee"
            ? "Ваши записи по дням, неделям и месяцам без доступа к чужому расписанию."
            : "Создавайте записи, переносите их между временем и сотрудниками, редактируйте данные по клику."
        }
        actions={
          <div className="flex gap-2">
            <Tabs items={viewTabs} value={view} onValueChange={setView} />
            {canCreateAppointments ? (
            <Button type="button" onClick={() => openCreate({ time: "12:00", employeeId: employees[0]?.id ?? "employee-1" })}>
              <Plus className="h-4 w-4" />
              Создать запись
            </Button>
            ) : null}
          </div>
        }
      />

      {view === "month" ? (
        <div className="grid gap-3 md:grid-cols-7">
          {monthDays.map((date) => {
            const dayAppointments = calendarAppointments.filter((appointment) => appointment.date === date);
            return (
              <button
                key={date}
                type="button"
                disabled={!canCreateAppointments}
                onClick={() => openCreate({ date, time: "12:00", employeeId: employees[0]?.id ?? "employee-1" })}
                className="min-h-28 rounded-lg border border-border bg-card p-3 text-left transition-colors hover:bg-muted/35 disabled:cursor-default disabled:hover:bg-card"
              >
                <p className="text-sm font-medium">{formatDate(date, "d MMMM")}</p>
                <p className="mt-2 text-xs text-muted-foreground">{pluralRecords(dayAppointments.length)}</p>
                <div className="mt-3 space-y-1">
                  {dayAppointments.slice(0, 2).map((appointment) => (
                    <span key={appointment.id} className="block truncate rounded-md bg-accent px-2 py-1 text-xs text-accent-foreground">
                      {appointment.time} · {appointment.title}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      ) : null}

      {view === "week" ? (
        <div className="grid gap-3 lg:grid-cols-7">
          {weekDays.map((date) => {
            const dayAppointments = calendarAppointments.filter((appointment) => appointment.date === date);
            return (
              <div key={date} className="rounded-lg border border-border bg-card p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{formatDate(date, "EEEEEE")}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(date, "d MMMM")}</p>
                  </div>
                  {canCreateAppointments ? (
                  <Button type="button" size="sm" variant="outline" onClick={() => openCreate({ date, time: "12:00", employeeId: employees[0]?.id ?? "employee-1" })}>
                    <Plus className="h-4 w-4" />
                  </Button>
                  ) : null}
                </div>
                <p className="mt-3 text-xs text-muted-foreground">{pluralRecords(dayAppointments.length)}</p>
                <div className="mt-3 space-y-2">
                  {dayAppointments.slice(0, 5).map((appointment) => (
                    <button
                      key={appointment.id}
                      type="button"
                      disabled={!canManageAppointments}
                      onClick={() => openEdit(appointment)}
                      className="w-full rounded-lg border border-border bg-background p-2 text-left text-xs transition-colors hover:bg-muted/50 disabled:cursor-default disabled:hover:bg-background"
                    >
                      <p className="font-medium">{appointment.time} · {appointment.title}</p>
                      <p className="mt-1 truncate text-muted-foreground">
                        {clients.find((client) => client.id === appointment.clientId)?.name ?? "Клиент"}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {view === "day" ? (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <div className={`${scheduleGridClass} border-b border-border bg-muted/50`}>
            <div className="p-3 text-sm font-medium">Время</div>
            {employees.map((employee) => (
              <div key={employee.id} className="border-l border-border p-3">
                <p className="font-medium">{employee.name}</p>
                <p className="text-xs text-muted-foreground">{employee.position}</p>
              </div>
            ))}
          </div>
          <div className="overflow-x-auto">
            {slots.map((time) => (
              <div key={time} className={`${scheduleGridClass} border-b border-border last:border-b-0`}>
                <div className="bg-muted/30 p-3 text-sm text-muted-foreground">{time}</div>
                {employees.map((employee) => {
                  const appointment = byEmployeeAndTime.get(`${employee.id}-${time}`);
                  const canUseSlot = appointment ? canManageAppointments : canCreateAppointments;
                  return (
                    <button
                      key={`${employee.id}-${time}`}
                      type="button"
                      onClick={() => appointment ? openEdit(appointment) : openCreate({ time, employeeId: employee.id })}
                      disabled={!canUseSlot}
                      onDragOver={(event) => {
                        if (canManageAppointments) {
                          event.preventDefault();
                        }
                      }}
                      onDrop={(event) => {
                        if (!canManageAppointments) {
                          return;
                        }
                        const id = event.dataTransfer.getData("appointment-id");
                        if (id) {
                          updateAppointment(id, { time, employeeId: employee.id, date: today });
                        }
                      }}
                      className="min-h-24 border-l border-border p-2 text-left transition-colors hover:bg-muted/40 disabled:cursor-default disabled:hover:bg-transparent"
                    >
                      {appointment ? (
                        <div
                          draggable={canManageAppointments}
                          onDragStart={(event) => {
                            if (canManageAppointments) {
                              event.dataTransfer.setData("appointment-id", appointment.id);
                            }
                          }}
                          className="rounded-lg border border-primary/20 bg-accent p-3 text-accent-foreground"
                        >
                          <p className="font-medium">{appointment.title}</p>
                          <p className="mt-1 text-xs">
                            {clients.find((client) => client.id === appointment.clientId)?.name ?? "Клиент"}
                          </p>
                          {appointment.resourceId ? (
                            <p className="mt-1 text-xs">
                              {resourceById.get(appointment.resourceId)?.name ?? "Ресурс"}
                            </p>
                          ) : null}
                          {appointment.promotionId ? (
                            <p className="mt-1 text-xs">
                              {promotionById.get(appointment.promotionId)?.name ?? "Акция"}
                            </p>
                          ) : null}
                          <div className="mt-2 flex items-center justify-between gap-2">
                            <StatusBadge status={appointment.status} />
                            <span className="text-xs">{formatCurrency(appointment.price)}</span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {canCreateAppointments ? "Свободное окно" : "Нет записи"}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <Dialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={form.id ? `Редактировать ${company.terminology.appointment}` : `Создать ${company.terminology.appointment}`}
        description={`${formatDate(form.date)} · ${form.time}`}
        className="max-w-2xl"
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Отмена
            </Button>
            {form.id && canManageAppointments && form.status !== "cancelled" ? (
              <Button type="button" variant="destructive" onClick={openCancelDialog}>
                Отменить запись
              </Button>
            ) : null}
            {form.id && canManageSales ? (
              <Button
                type="button"
                variant="outline"
                disabled={Boolean(currentAppointmentSale) || form.status === "cancelled"}
                onClick={openSaleDialog}
              >
                {currentAppointmentSale ? "Продажа создана" : "Создать продажу"}
              </Button>
            ) : null}
            <Button type="button" onClick={saveAppointment}>
              Сохранить
            </Button>
          </>
        }
      >
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Клиент</Label>
              <Select value={form.clientId} onChange={(event) => setForm({ ...form, clientId: event.target.value })}>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Специалист</Label>
              {canManageAppointments ? (
                <Select value={form.employeeId} onChange={(event) => setForm({ ...form, employeeId: event.target.value })}>
                  {data.employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>{employee.name}</option>
                  ))}
                </Select>
              ) : (
                <Input value={currentEmployee?.name ?? "Текущий сотрудник"} disabled />
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label>{company.terminology.service}</Label>
            <Input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Акция</Label>
            <Select value={form.promotionId} onChange={(event) => setForm({ ...form, promotionId: event.target.value })}>
              <option value="">Без акции</option>
              {promotionOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </Select>
            <p className="text-sm text-muted-foreground">
              В списке только активные акции. Стоимость и фактическую скидку администратор сможет учесть в продаже.
            </p>
          </div>
          <div className="space-y-2">
            <Label>Помещение или оборудование</Label>
            <Select value={form.resourceId} onChange={(event) => setForm({ ...form, resourceId: event.target.value })}>
              <option value="">Не требуется</option>
              {resourceOptions.map((option) => (
                <option key={option.resource.id} value={option.resource.id}>
                  {option.label}
                </option>
              ))}
            </Select>
            {selectedResourceAvailability ? (
              <p className={selectedResourceAvailability.state === "available" ? "text-sm text-emerald-600" : "text-sm text-amber-600"}>
                {selectedResourceAvailability.detail}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Выберите ресурс только если для этой записи нужен кабинет, пост, зал или оборудование.
              </p>
            )}
          </div>
          <div className={`grid gap-4 ${canManageAppointments ? "sm:grid-cols-4" : "sm:grid-cols-3"}`}>
            <div className="space-y-2">
              <Label>Дата</Label>
              <Input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Время</Label>
              <Input type="time" value={form.time} onChange={(event) => setForm({ ...form, time: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Длительность, мин</Label>
              <Input type="number" min="1" value={form.duration} onChange={(event) => setForm({ ...form, duration: event.target.value })} />
            </div>
            {canManageAppointments ? (
              <div className="space-y-2">
                <Label>Стоимость</Label>
                <Input type="number" min="0" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} />
              </div>
            ) : null}
          </div>
          {canManageAppointments ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Статус</Label>
                <Select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as Appointment["status"] })}>
                  {getEditableStatusOptions(form.status).map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </Select>
              </div>
              <label className="flex items-end gap-2 rounded-lg border border-border p-3 text-sm">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-primary"
                  checked={form.paid}
                  onChange={(event) => setForm({ ...form, paid: event.target.checked })}
                />
                Оплачено
              </label>
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
              Запись будет создана в статусе «Запланирована». Стоимость, оплату и перенос сможет изменить администратор или владелец.
            </div>
          )}
          {form.id && currentAppointmentSale ? (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-700">
              По этой записи уже создана продажа на {formatCurrency(currentAppointmentSale.amount)}.
            </div>
          ) : null}
          {form.status === "cancelled" ? (
            <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
              Отменена{form.cancelledAt ? ` ${formatDate(form.cancelledAt, "dd.MM.yyyy")}` : ""}.
              {form.cancellationReason ? ` Причина: ${form.cancellationReason}` : ""}
            </div>
          ) : null}
          <div className="space-y-2">
            <Label>Комментарий</Label>
            <Textarea value={form.comment} onChange={(event) => setForm({ ...form, comment: event.target.value })} />
          </div>
        </div>
      </Dialog>

      <Dialog
        open={cancelDialogOpen}
        onOpenChange={(open) => {
          setCancelDialogOpen(open);
          if (!open) {
            setCancellationForm(createEmptyCancellationForm());
          }
        }}
        title="Отменить запись"
        description={`${formatDate(form.date)} · ${form.time} · ${form.title || company.terminology.appointment}`}
        className="max-w-2xl"
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setCancelDialogOpen(false)}>
              Назад
            </Button>
            <Button type="button" variant="destructive" onClick={saveAppointmentCancellation}>
              Подтвердить отмену
            </Button>
          </>
        }
      >
        <div className="grid gap-4">
          {currentAppointmentSale ? (
            <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
              По записи есть продажа на {formatCurrency(currentAppointmentSale.amount)}.
              Доступно к возврату: {formatCurrency(remainingSaleAmount)}.
            </div>
          ) : (
            <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
              Продажа по записи ещё не создана, поэтому отмена не изменит финансы.
            </div>
          )}
          <div className="space-y-2">
            <Label>Причина отмены</Label>
            <Textarea
              value={cancellationForm.reason}
              onChange={(event) => setCancellationForm({ ...cancellationForm, reason: event.target.value })}
              placeholder="Например: клиент перенёс визит, заболел, отменил заказ"
            />
          </div>
          {currentAppointmentSale && remainingSaleAmount > 0 ? (
            <div className="space-y-3">
              <Label>Что сделать с оплатой</Label>
              <div className="grid gap-2 sm:grid-cols-2">
                {cancellationModes
                  .filter((mode) => mode.value !== "cancelOnly")
                  .map((mode) => (
                    <button
                      key={mode.value}
                      type="button"
                      className={`rounded-lg border p-3 text-left text-sm transition-colors ${
                        cancellationForm.mode === mode.value
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border bg-background hover:bg-muted/40"
                      }`}
                      onClick={() =>
                        setCancellationForm({
                          ...cancellationForm,
                          mode: mode.value,
                          refundAmount:
                            mode.value === "fullRefund"
                              ? String(remainingSaleAmount)
                              : cancellationForm.refundAmount
                        })
                      }
                    >
                      {mode.label}
                    </button>
                  ))}
              </div>
              {cancellationForm.mode === "partialRefund" ? (
                <div className="space-y-2">
                  <Label>Сумма возврата</Label>
                  <Input
                    type="number"
                    min="1"
                    max={Math.max(0, remainingSaleAmount - 1)}
                    value={cancellationForm.refundAmount}
                    onChange={(event) => setCancellationForm({ ...cancellationForm, refundAmount: event.target.value })}
                  />
                </div>
              ) : null}
              {cancellationForm.mode === "keepPayment" ? (
                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-700">
                  Оплата останется в продажах и финансах, запись будет отменена с сохранением факта оплаты.
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </Dialog>

      <Dialog
        open={saleDialogOpen}
        onOpenChange={(open) => {
          setSaleDialogOpen(open);
          if (!open) {
            setSaleForm(createEmptySaleForm());
          }
        }}
        title="Создать продажу из записи"
        description={`${formatDate(form.date)} · ${form.time} · ${form.title || company.terminology.appointment}`}
        className="max-w-2xl"
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setSaleDialogOpen(false)}>
              Отмена
            </Button>
            <Button type="button" onClick={saveSaleFromAppointment}>
              Создать продажу
            </Button>
          </>
        }
      >
        <div className="grid gap-4">
          <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
            Клиент, сотрудник, услуга и акция подтянуты из записи. После сохранения запись станет завершённой и оплаченной.
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Клиент</Label>
              <Input value={clients.find((client) => client.id === form.clientId)?.name ?? "Клиент"} disabled />
            </div>
            <div className="space-y-2">
              <Label>Сотрудник</Label>
              <Input value={data.employees.find((employee) => employee.id === form.employeeId)?.name ?? "Сотрудник"} disabled />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Услуга</Label>
              <Input value={form.title} disabled />
            </div>
            <div className="space-y-2">
              <Label>Категория дохода</Label>
              <Input value={saleForm.category} onChange={(event) => setSaleForm({ ...saleForm, category: event.target.value })} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Акция</Label>
            <Select
              value={saleForm.promotionId}
              onChange={(event) => {
                const promotionId = event.target.value;
                const promotion = promotionId ? promotionById.get(promotionId) : undefined;
                const discountPercent = promotion ? extractPromotionDiscountPercent(promotion.conditions) : 0;
                const amount = Number(saleForm.amount);
                const discountAmount =
                  Number.isFinite(amount) && amount > 0 && discountPercent > 0
                    ? Math.round((amount * discountPercent) / 100)
                    : 0;
                setSaleForm({
                  ...saleForm,
                  promotionId,
                  discountPercent: discountPercent ? String(discountPercent) : "0",
                  discountAmount: discountAmount ? String(discountAmount) : "0"
                });
              }}
            >
              <option value="">Без акции</option>
              {promotionOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </Select>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Сумма до скидки</Label>
              <Input
                type="number"
                min="1"
                value={saleForm.amount}
                onChange={(event) => setSaleForm({ ...saleForm, amount: event.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Скидка, %</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={saleForm.discountPercent}
                onChange={(event) => setSaleForm({ ...saleForm, discountPercent: event.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Скидка суммой</Label>
              <Input
                type="number"
                min="0"
                value={saleForm.discountAmount}
                onChange={(event) => setSaleForm({ ...saleForm, discountAmount: event.target.value })}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Способ оплаты</Label>
              <Select
                value={saleForm.paymentMethod}
                onChange={(event) => setSaleForm({ ...saleForm, paymentMethod: event.target.value as SalePaymentMethod })}
              >
                {paymentMethodOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </Select>
            </div>
            <div className="rounded-lg border border-border bg-card p-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground">Скидка</span>
                <span className="font-medium">{Number.isFinite(saleDiscountAmount) ? formatCurrency(saleDiscountAmount) : "—"}</span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-3 border-t border-border pt-2">
                <span className="font-medium">К оплате</span>
                <span className="text-base font-semibold">{Number.isFinite(saleTotal) ? formatCurrency(saleTotal) : "—"}</span>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Комментарий</Label>
            <Textarea value={saleForm.comment} onChange={(event) => setSaleForm({ ...saleForm, comment: event.target.value })} />
          </div>
        </div>
      </Dialog>
    </div>
  );
}

function createEmptyForm(
  clients: Client[],
  date: string,
  employeeId = "employee-1",
  time = "12:00",
  canManageAppointments = true
): AppointmentForm {
  return {
    clientId: clients[0]?.id ?? "",
    employeeId,
    date,
    time,
    resourceId: "",
    promotionId: "",
    title: "",
    duration: "60",
    price: canManageAppointments ? "2500" : "0",
    status: "planned",
    paid: false,
    cancellationReason: "",
    cancelledAt: "",
    comment: ""
  };
}

function isVisibleInCalendar(appointment: Appointment) {
  return appointment.status !== "cancelled";
}

function createEmptySaleForm(): AppointmentSaleForm {
  return {
    appointmentId: "",
    amount: "",
    discountPercent: "0",
    discountAmount: "0",
    paymentMethod: "cash",
    category: "Записи",
    promotionId: "",
    comment: ""
  };
}

function createEmptyCancellationForm(): AppointmentCancellationForm {
  return {
    appointmentId: "",
    reason: "",
    mode: "cancelOnly",
    refundAmount: "0"
  };
}

function getEditableStatusOptions(currentStatus: Appointment["status"]) {
  if (currentStatus === "cancelled") {
    return statusOptions;
  }
  return statusOptions.filter((option) => option.value !== "cancelled");
}

function getRemainingSaleAmount(sale: Sale) {
  return Math.max(0, sale.amount - (sale.refundedAmount ?? 0));
}

function appendCancellationNote(comment: string, reason: string) {
  const note = `Отмена: ${reason}`;
  const trimmed = comment.trim();
  if (!trimmed) {
    return note;
  }
  if (trimmed.includes(note)) {
    return trimmed;
  }
  return `${trimmed}\n${note}`;
}

function getCancellationResultText(mode: CancellationMode, refundAmount: number) {
  if (mode === "fullRefund") {
    return `Создан полный возврат на ${formatCurrency(refundAmount)}.`;
  }
  if (mode === "partialRefund") {
    return `Создан частичный возврат на ${formatCurrency(refundAmount)}.`;
  }
  if (mode === "keepPayment") {
    return "Оплата оставлена в продажах и финансах.";
  }
  return "Финансы не изменились.";
}

function getSaleDiscountAmount(subtotal: number, discountPercent: number, manualDiscountAmount: number) {
  const percentAmount =
    Number.isFinite(discountPercent) && discountPercent > 0
      ? (subtotal * discountPercent) / 100
      : 0;
  return Math.max(
    0,
    Number.isFinite(manualDiscountAmount) ? manualDiscountAmount : 0,
    percentAmount
  );
}

function extractPromotionDiscountPercent(conditions: string) {
  const match = conditions.match(/(\d+(?:[.,]\d+)?)\s*%/);
  if (!match) {
    return 0;
  }
  const value = Number(match[1].replace(",", "."));
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(100, value));
}
