"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Drawer } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Tabs } from "@/components/ui/tabs";
import { PageHeader } from "@/components/modules/page-header";
import { StatusBadge } from "@/components/modules/status-badge";
import { createEmployeeInvite, loadEmployeeInvites } from "@/lib/backend/auth";
import { syncEmployee } from "@/lib/backend/sync";
import { useAppStore } from "@/store/app-store";
import { formatCurrency, getLocalDateKey } from "@/lib/utils";
import type { Employee, EmployeeInvite } from "@/types";

const profileTabs = [
  { value: "info", label: "Информация" },
  { value: "schedule", label: "График" },
  { value: "appointments", label: "Записи" },
  { value: "tasks", label: "Задачи" },
  { value: "metrics", label: "Показатели" },
  { value: "payroll", label: "Оплата" },
  { value: "access", label: "Права доступа" }
];

function employeeToForm(employee?: Employee) {
  return {
    name: employee?.name ?? "",
    phone: employee?.phone ?? "",
    email: employee?.email ?? "",
    position: employee?.position ?? "",
    status: employee?.status ?? "working" as Employee["status"],
    schedule: employee?.schedule ?? "09:00-18:00",
    role: employee?.role ?? "employee" as Employee["role"],
    loadPercent: String(employee?.loadPercent ?? 0),
    revenue: String(employee?.revenue ?? 0),
    appointmentsCount: String(employee?.appointmentsCount ?? 0),
    rating: String(employee?.rating ?? 0),
    compensationType: employee?.compensationType ?? "fixed" as NonNullable<Employee["compensationType"]>,
    baseSalary: String(employee?.baseSalary ?? 0),
    commissionPercent: String(employee?.commissionPercent ?? 0)
  };
}

export default function EmployeesPage() {
  const data = useAppStore((state) => state.data);
  const company = useAppStore((state) => state.company);
  const sessionMode = useAppStore((state) => state.sessionMode);
  const addEmployee = useAppStore((state) => state.addEmployee);
  const updateEmployee = useAppStore((state) => state.updateEmployee);
  const dismissEmployee = useAppStore((state) => state.dismissEmployee);
  const deleteDismissedEmployee = useAppStore((state) => state.deleteDismissedEmployee);
  const addToast = useAppStore((state) => state.addToast);
  const [selected, setSelected] = useState<Employee | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [tab, setTab] = useState("info");
  const [form, setForm] = useState(() => employeeToForm());
  const [invites, setInvites] = useState<EmployeeInvite[]>([]);
  const [latestInvite, setLatestInvite] = useState<EmployeeInvite | null>(null);

  useEffect(() => {
    if (sessionMode !== "registered") {
      setInvites([]);
      return;
    }

    loadEmployeeInvites(company.id)
      .then(setInvites)
      .catch((error) => {
        addToast({
          title: "Не удалось загрузить приглашения",
          description: error instanceof Error ? error.message : "Проверьте Supabase.",
          variant: "error"
        });
      });
  }, [addToast, company.id, sessionMode]);

  const selectedInvite = useMemo(() => {
    if (!selected) {
      return null;
    }
    return invites.find((invite) =>
      invite.employeeId === selected.id ||
      (selected.email && invite.email.toLowerCase() === selected.email.toLowerCase())
    ) ?? null;
  }, [invites, selected]);

  function openEmployee(employee: Employee) {
    setSelected(employee);
    setCreateOpen(false);
    setForm(employeeToForm(employee));
  }

  function saveEmployee() {
    if (!selected) {
      return;
    }
    const name = form.name.trim();
    const position = form.position.trim();

    if (!name || !position) {
      addToast({
        title: "Заполните карточку сотрудника",
        description: "ФИО и должность обязательны.",
        variant: "warning"
      });
      return;
    }

    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      addToast({
        title: "Email сотрудника некорректен",
        description: "Проверьте адрес или оставьте поле пустым.",
        variant: "warning"
      });
      return;
    }

    if (selected.role === "owner" && form.role !== "owner") {
      addToast({
        title: "Роль владельца нельзя снять здесь",
        description: "Передача прав владельца должна быть отдельным подтверждаемым действием.",
        variant: "warning"
      });
      return;
    }

    if (selected.role !== "owner" && form.role === "owner") {
      addToast({
        title: "Нельзя назначить владельца из карточки",
        description: "Передача прав владельца требует отдельного безопасного сценария.",
        variant: "warning"
      });
      return;
    }

    const patch: Partial<Employee> = {
      name,
      phone: form.phone.trim(),
      email: form.email.trim().toLowerCase(),
      position,
      status: form.status,
      schedule: form.schedule,
      role: form.role,
      loadPercent: Number(form.loadPercent) || 0,
      revenue: Number(form.revenue) || 0,
      appointmentsCount: Number(form.appointmentsCount) || 0,
      rating: Number(form.rating) || 0,
      compensationType: form.compensationType,
      baseSalary: Number(form.baseSalary) || 0,
      commissionPercent: Number(form.commissionPercent) || 0
    };
    updateEmployee(selected.id, patch);
    setSelected({ ...selected, ...patch });
  }

  function openCreate() {
    setSelected(null);
    setTab("info");
    setForm(employeeToForm());
    setLatestInvite(null);
    setCreateOpen(true);
  }

  async function createEmployee() {
    const name = form.name.trim();
    const position = form.position.trim();
    const email = form.email.trim().toLowerCase();
    const phone = form.phone.trim();

    if (!name || !position) {
      addToast({
        title: "Заполните карточку сотрудника",
        description: "Для создания сотрудника нужны ФИО и должность.",
        variant: "warning"
      });
      return;
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      addToast({
        title: "Email сотрудника некорректен",
        description: "Проверьте адрес или оставьте поле пустым.",
        variant: "warning"
      });
      return;
    }

    const payload: Omit<Employee, "id"> = {
      name,
      phone,
      email,
      position,
      status: form.status,
      schedule: form.schedule || "09:00-18:00",
      role: form.role,
      loadPercent: Number(form.loadPercent) || 0,
      revenue: Number(form.revenue) || 0,
      appointmentsCount: Number(form.appointmentsCount) || 0,
      rating: Number(form.rating) || 0,
      compensationType: form.compensationType,
      baseSalary: Number(form.baseSalary) || 0,
      commissionPercent: Number(form.commissionPercent) || 0
    };
    const employeeId = addEmployee(payload);

    addToast({
      title: "Сотрудник добавлен",
      description: email
        ? "Карточка создана. Сейчас создаём приглашение для входа."
        : "Карточка создана без приглашения, потому что email не указан.",
      variant: "success"
    });

    if (email && sessionMode === "registered") {
      try {
        await syncEmployee(company.id, { ...payload, id: employeeId });
        await createInvite(employeeId, email, form.role);
      } catch (error) {
        addToast({
          title: "Сотрудник создан, но invite не создан",
          description: error instanceof Error ? error.message : "Проверьте Supabase.",
          variant: "error"
        });
      }
    }

    setCreateOpen(false);
    setForm(employeeToForm());
  }

  async function createInvite(employeeId: string, email: string, role: Employee["role"]) {
    if (role === "owner") {
      addToast({
        title: "Owner не приглашается через карточку",
        description: "Передача владельца должна быть отдельным подтверждаемым действием.",
        variant: "warning"
      });
      return;
    }

    if (!email) {
      addToast({
        title: "Укажите email сотрудника",
        description: "Invite создаётся на конкретный email.",
        variant: "warning"
      });
      return;
    }

    if (sessionMode !== "registered") {
      addToast({
        title: "Invite доступен только в зарегистрированной компании",
        description: "В демо можно проверить интерфейс, но ссылка сотрудника не создаётся.",
        variant: "warning"
      });
      return;
    }

    const invite = await createEmployeeInvite({
      companyId: company.id,
      employeeId,
      email,
      role
    });

    setInvites((current) => [invite, ...current.filter((item) => item.id !== invite.id)]);
    setLatestInvite(invite);
    addToast({
      title: "Приглашение создано",
      description: "Скопируйте ссылку и отправьте сотруднику.",
      variant: "success"
    });
  }

  function getInviteLink(invite: EmployeeInvite) {
    if (typeof window === "undefined") {
      return `/join?token=${invite.token}`;
    }
    return `${window.location.origin}/join?token=${invite.token}`;
  }

  async function copyInvite(invite: EmployeeInvite) {
    const link = getInviteLink(invite);
    await navigator.clipboard.writeText(link);
    addToast({
      title: "Ссылка скопирована",
      description: "Отправьте её сотруднику на указанный email.",
      variant: "success"
    });
  }

  function openMailInvite(invite: EmployeeInvite) {
    const link = getInviteLink(invite);
    const subject = encodeURIComponent(`Приглашение в ${company.name}`);
    const body = encodeURIComponent(`Здравствуйте!\n\nВас пригласили в ${company.name}.\nОткройте ссылку и задайте пароль:\n${link}`);
    window.location.href = `mailto:${invite.email}?subject=${subject}&body=${body}`;
  }

  function fireEmployee() {
    if (!selected) {
      return;
    }
    if (selected.role === "owner") {
      addToast({
        title: "Владельца нельзя уволить",
        description: "Сначала назначьте другого владельца компании.",
        variant: "warning"
      });
      return;
    }
    dismissEmployee(selected.id);
    setSelected({
      ...selected,
      status: "dismissed",
      dismissedAt: getLocalDateKey()
    });
    addToast({
      title: "Сотрудник уволен",
      description: "Карточка осталась в истории, новые записи лучше назначать другим сотрудникам.",
      variant: "success"
    });
  }

  function deleteEmployeeCard() {
    if (!selected) {
      return;
    }
    if (selected.status !== "dismissed") {
      addToast({
        title: "Сначала увольте сотрудника",
        description: "Удаление доступно только после перевода сотрудника в статус «уволен».",
        variant: "warning"
      });
      return;
    }
    if (selected.role === "owner") {
      addToast({
        title: "Владельца нельзя удалить",
        description: "Сначала передайте роль владельца другому пользователю.",
        variant: "warning"
      });
      return;
    }

    const confirmed = window.confirm(
      `Удалить карточку сотрудника "${selected.name}"? История записей и продаж останется, но сотрудник исчезнет из списка.`
    );
    if (!confirmed) {
      return;
    }

    deleteDismissedEmployee(selected.id);
    addToast({
      title: "Сотрудник удалён",
      description: "Карточка удалена из команды. Связанные исторические данные сохранены.",
      variant: "success"
    });
    setSelected(null);
  }

  return (
    <div>
      <PageHeader
        title="Сотрудники"
        description="Карточки команды, расписание, выручка, права доступа и базовые условия оплаты."
        actions={
          <Button type="button" onClick={openCreate}>
            Добавить сотрудника
          </Button>
        }
      />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data.employees.map((employee) => (
          <button
            key={employee.id}
            type="button"
            onClick={() => openEmployee(employee)}
            className="text-left"
          >
            <Card className="h-full p-5 transition-colors hover:bg-muted/35">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{employee.name}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{employee.position}</p>
                </div>
                <StatusBadge status={employee.status === "working" ? "active" : employee.status} />
              </div>
              <div className="mt-5 space-y-3 text-sm">
                <Row label="Расписание" value={employee.schedule} />
                <Row label="Контакт" value={employee.phone || employee.email || "не указан"} />
                <Row label="Выручка" value={formatCurrency(employee.revenue)} />
                <Row label="Записей" value={String(employee.appointmentsCount)} />
                <Row label="Рейтинг" value={employee.rating.toFixed(1)} />
                <Row label="Оплата" value={getCompensationLabel(employee)} />
              </div>
            </Card>
          </button>
        ))}
      </div>

      <Drawer
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) {
            setForm(employeeToForm());
          }
        }}
        title="Добавить сотрудника"
        description="Владелец может завести карточку сотрудника без отдельной регистрации."
      >
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>ФИО</Label>
              <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Должность</Label>
              <Input value={form.position} onChange={(event) => setForm({ ...form, position: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Телефон</Label>
              <Input type="tel" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Email для входа</Label>
              <Input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Роль</Label>
              <Select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as Employee["role"] })}>
                <option value="admin">Администратор</option>
                <option value="employee">Сотрудник</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>График</Label>
              <Input value={form.schedule} onChange={(event) => setForm({ ...form, schedule: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Схема оплаты</Label>
              <Select value={form.compensationType} onChange={(event) => setForm({ ...form, compensationType: event.target.value as NonNullable<Employee["compensationType"]> })}>
                <option value="fixed">Фикс</option>
                <option value="commission">Процент</option>
                <option value="mixed">Фикс + процент</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Фикс, ₽</Label>
              <Input type="number" value={form.baseSalary} onChange={(event) => setForm({ ...form, baseSalary: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Процент, %</Label>
              <Input type="number" value={form.commissionPercent} onChange={(event) => setForm({ ...form, commissionPercent: event.target.value })} />
            </div>
          </div>
          <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
            Если указать email, после создания карточки будет создана ссылка приглашения. Сотрудник сам задаст пароль.
          </div>
          {latestInvite ? <InviteBox invite={latestInvite} link={getInviteLink(latestInvite)} onCopy={() => copyInvite(latestInvite)} onMail={() => openMailInvite(latestInvite)} /> : null}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
              Отмена
            </Button>
            <Button type="button" onClick={createEmployee}>
              Добавить
            </Button>
          </div>
        </div>
      </Drawer>

      <Drawer
        open={Boolean(selected)}
        onOpenChange={(open) => !open && setSelected(null)}
        title={selected?.name ?? "Профиль сотрудника"}
        description={selected?.position}
      >
        {selected ? (
          <div>
            <Tabs items={profileTabs} value={tab} onValueChange={setTab} />
            <div className="mt-5 space-y-3">
              {tab === "info" ? (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>ФИО</Label>
                      <Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Должность</Label>
                      <Input value={form.position} onChange={(event) => setForm({ ...form, position: event.target.value })} />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Телефон</Label>
                      <Input type="tel" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Email для входа</Label>
                      <Input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Статус</Label>
                      <Select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as Employee["status"] })}>
                        <option value="working">Работает</option>
                        <option value="dayOff">Выходной</option>
                        <option value="vacation">Отпуск</option>
                        <option value="dismissed">Уволен</option>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Роль</Label>
                      <Select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as Employee["role"] })}>
                        {selected.role === "owner" ? <option value="owner">Владелец</option> : null}
                        <option value="admin">Администратор</option>
                        <option value="employee">Сотрудник</option>
                      </Select>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" onClick={saveEmployee}>
                      Сохранить профиль
                    </Button>
                    {selected.status !== "dismissed" ? (
                      <Button type="button" variant="outline" onClick={fireEmployee}>
                        Уволить
                      </Button>
                    ) : (
                      <Button type="button" variant="destructive" onClick={deleteEmployeeCard}>
                        Удалить карточку
                      </Button>
                    )}
                  </div>
                </>
              ) : null}
              {tab === "schedule" ? (
                <>
                  <div className="space-y-2">
                    <Label>График</Label>
                    <Input value={form.schedule} onChange={(event) => setForm({ ...form, schedule: event.target.value })} />
                  </div>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <Button type="button" variant="outline" onClick={() => setForm({ ...form, schedule: "09:00-18:00", status: "working" })}>Дневная смена</Button>
                    <Button type="button" variant="outline" onClick={() => setForm({ ...form, schedule: "11:00-20:00", status: "working" })}>Вечерняя смена</Button>
                    <Button type="button" variant="outline" onClick={() => setForm({ ...form, status: "dayOff" })}>Выходной</Button>
                  </div>
                  <Button type="button" onClick={saveEmployee}>Сохранить график</Button>
                </>
              ) : null}
              {tab === "appointments" ? (
                <>
                  <Row label="Записи" value={`${selected.appointmentsCount} за месяц`} />
                  <Row label="Ближайшая запись" value={data.appointments.find((appointment) => appointment.employeeId === selected.id)?.time ?? "не назначена"} />
                </>
              ) : null}
              {tab === "tasks" ? <Row label="Активные задачи" value="5 задач, 1 просрочена" /> : null}
              {tab === "metrics" ? (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Выручка</Label>
                      <Input value={form.revenue} onChange={(event) => setForm({ ...form, revenue: event.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Записей</Label>
                      <Input value={form.appointmentsCount} onChange={(event) => setForm({ ...form, appointmentsCount: event.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Рейтинг</Label>
                      <Input value={form.rating} onChange={(event) => setForm({ ...form, rating: event.target.value })} />
                    </div>
                  </div>
                  <Button type="button" onClick={saveEmployee}>Сохранить показатели</Button>
                </>
              ) : null}
              {tab === "payroll" ? (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Схема оплаты</Label>
                      <Select value={form.compensationType} onChange={(event) => setForm({ ...form, compensationType: event.target.value as NonNullable<Employee["compensationType"]> })}>
                        <option value="fixed">Фикс</option>
                        <option value="commission">Процент</option>
                        <option value="mixed">Фикс + процент</option>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Фикс, ₽</Label>
                      <Input type="number" value={form.baseSalary} onChange={(event) => setForm({ ...form, baseSalary: event.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Процент, %</Label>
                      <Input type="number" value={form.commissionPercent} onChange={(event) => setForm({ ...form, commissionPercent: event.target.value })} />
                    </div>
                    <div className="rounded-lg border border-border bg-background p-3 text-sm">
                      <p className="text-muted-foreground">Расчёт за месяц по текущей выручке</p>
                      <p className="mt-1 text-lg font-semibold">
                        {formatCurrency(
                          (Number(form.baseSalary) || 0) +
                            (Number(form.revenue) || 0) * ((Number(form.commissionPercent) || 0) / 100)
                        )}
                      </p>
                    </div>
                  </div>
                  <Button type="button" onClick={saveEmployee}>Сохранить условия</Button>
                </>
              ) : null}
              {tab === "access" ? (
                <>
                  <Row label="Финансы" value={selected.role === "employee" ? "ограничено" : "доступно"} />
                  <Row label="Настройки" value={selected.role === "owner" ? "полный доступ" : "ограничено"} />
                  <Row label="Email входа" value={selected.email || "не указан"} />
                  {selected.role === "owner" ? (
                    <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
                      Владелец входит через основной аккаунт. Передача роли owner будет отдельным безопасным сценарием.
                    </div>
                  ) : (
                    <div className="space-y-3 rounded-lg border border-border bg-background p-3">
                      <div>
                        <p className="text-sm font-medium">Приглашение сотрудника</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          Сотрудник открывает ссылку, задаёт пароль и получает доступ только к своей роли.
                        </p>
                      </div>
                      {selectedInvite ? (
                        <InviteBox
                          invite={selectedInvite}
                          link={getInviteLink(selectedInvite)}
                          onCopy={() => copyInvite(selectedInvite)}
                          onMail={() => openMailInvite(selectedInvite)}
                        />
                      ) : null}
                      <Button
                        type="button"
                        variant={selectedInvite ? "outline" : "default"}
                        onClick={() => createInvite(selected.id, form.email.trim().toLowerCase() || selected.email || "", form.role)}
                      >
                        {selectedInvite ? "Пересоздать приглашение" : "Создать приглашение"}
                      </Button>
                    </div>
                  )}
                </>
              ) : null}
            </div>
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-background p-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function InviteBox({
  invite,
  link,
  onCopy,
  onMail
}: {
  invite: EmployeeInvite;
  link: string;
  onCopy: () => void;
  onMail: () => void;
}) {
  return (
    <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium">Invite: {invite.email}</p>
          <p className="text-xs text-muted-foreground">
            Статус: {invite.status} · действует до {invite.expiresAt ? new Date(invite.expiresAt).toLocaleDateString("ru-RU") : "не указано"}
          </p>
        </div>
        <StatusBadge status={invite.status === "accepted" ? "active" : invite.status === "expired" ? "inactive" : "new"} />
      </div>
      <Input readOnly value={link} />
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" onClick={onCopy}>
          Скопировать ссылку
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={onMail}>
          Отправить email
        </Button>
      </div>
    </div>
  );
}

function getCompensationLabel(employee: Employee) {
  if (employee.compensationType === "commission") {
    return `${employee.commissionPercent ?? 0}%`;
  }
  if (employee.compensationType === "mixed") {
    return `${formatCurrency(employee.baseSalary ?? 0)} + ${employee.commissionPercent ?? 0}%`;
  }
  return formatCurrency(employee.baseSalary ?? 0);
}
