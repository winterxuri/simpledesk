"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { buildNavigationItems } from "@/config/navigation";
import { getScopedWorkspaceData } from "@/lib/employee-scope";
import { canAccessNavigationItem } from "@/lib/permissions";
import { getPromotionDisplayStatus } from "@/lib/promotion-status";
import { formatDate, getLocalDateKey } from "@/lib/utils";
import { useAppStore } from "@/store/app-store";
import type { ModuleCode } from "@/types";

type SearchResult = {
  id: string;
  title: string;
  description: string;
  section: string;
  route: string;
  searchText: string;
};

function normalize(value: string) {
  return value.toLowerCase().trim();
}

function joinSearchFields(fields: Array<string | number | undefined>) {
  return normalize(fields.filter((field) => field !== undefined && field !== "").join(" "));
}

export function GlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const data = useAppStore((state) => state.data);
  const user = useAppStore((state) => state.user);
  const role = useAppStore((state) => state.role);
  const company = useAppStore((state) => state.company);
  const modules = useAppStore((state) => state.companyModules);
  const normalizedQuery = normalize(query);
  const today = getLocalDateKey();
  const scopedData = useMemo(() => getScopedWorkspaceData(data, user, role), [data, role, user]);

  const accessibleModules = useMemo(() => {
    const items = buildNavigationItems(modules, company.businessTemplateId).filter(
      (item) => item.visible && item.code !== "settings" && canAccessNavigationItem(role, item.code)
    );
    return new Set(items.map((item) => item.code as ModuleCode));
  }, [company.businessTemplateId, modules, role]);

  const allResults = useMemo(() => {
    const results: SearchResult[] = [];
    const canSearch = (module: ModuleCode) => accessibleModules.has(module);

    if (canSearch("clients")) {
      scopedData.clients.forEach((client) => {
        results.push({
          id: `client-${client.id}`,
          title: client.name,
          description: [client.phone, client.email].filter(Boolean).join(" · ") || "Клиент",
          section: "Клиенты",
          route: `/clients/${client.id}`,
          searchText: joinSearchFields([client.name, client.phone, client.email, client.status])
        });
      });
    }

    if (canSearch("calendar")) {
      scopedData.appointments.forEach((appointment) => {
        const clientName = scopedData.clients.find((client) => client.id === appointment.clientId)?.name;
        results.push({
          id: `appointment-${appointment.id}`,
          title: appointment.title,
          description: `${formatDate(appointment.date)} · ${appointment.time}${clientName ? ` · ${clientName}` : ""}`,
          section: "Записи",
          route: "/calendar",
          searchText: joinSearchFields([
            appointment.title,
            appointment.date,
            appointment.time,
            appointment.status,
            clientName
          ])
        });
      });
    }

    if (canSearch("tasks")) {
      scopedData.tasks.forEach((task) => {
        const employeeName = scopedData.employees.find((employee) => employee.id === task.responsibleId)?.name;
        results.push({
          id: `task-${task.id}`,
          title: task.title,
          description: `${formatDate(task.dueDate)} · ${employeeName ?? "ответственный не назначен"}`,
          section: "Задачи",
          route: "/tasks",
          searchText: joinSearchFields([task.title, task.description, task.status, task.priority, employeeName])
        });
      });
    }

    if (role !== "employee" && canSearch("employees")) {
      data.employees.forEach((employee) => {
        results.push({
          id: `employee-${employee.id}`,
          title: employee.name,
          description: `${employee.position} · ${employee.schedule}`,
          section: "Сотрудники",
          route: "/employees",
          searchText: joinSearchFields([employee.name, employee.position, employee.phone, employee.email, employee.role])
        });
      });
    }

    if (role !== "employee" && canSearch("inventory")) {
      data.products.forEach((product) => {
        results.push({
          id: `product-${product.id}`,
          title: product.name,
          description: `${product.category} · остаток ${product.currentStock}`,
          section: "Товары и расходники",
          route: "/inventory",
          searchText: joinSearchFields([product.name, product.category, product.supplier, product.status])
        });
      });
    }

    if (role !== "employee" && canSearch("promotions")) {
      data.promotions.forEach((promotion) => {
        const status = getPromotionDisplayStatus(promotion, today);
        results.push({
          id: `promotion-${promotion.id}`,
          title: promotion.name,
          description: `${promotion.period} · ${status}`,
          section: "Акции",
          route: "/promotions",
          searchText: joinSearchFields([promotion.name, promotion.description, promotion.conditions, status])
        });
      });
    }

    if (role !== "employee" && canSearch("resources")) {
      data.resources.forEach((resource) => {
        results.push({
          id: `resource-${resource.id}`,
          title: resource.name,
          description: `${resource.type} · ${resource.status}`,
          section: "Ресурсы",
          route: "/resources",
          searchText: joinSearchFields([resource.name, resource.type, resource.status, resource.condition, resource.comment])
        });
      });
    }

    return results;
  }, [accessibleModules, data.employees, data.products, data.promotions, data.resources, role, scopedData, today]);

  const results = useMemo(() => {
    if (normalizedQuery.length < 2) {
      return [];
    }
    return allResults
      .filter((result) => result.searchText.includes(normalizedQuery))
      .slice(0, 8);
  }, [allResults, normalizedQuery]);

  const showPanel = open && query.trim().length > 0;
  const placeholder =
    role === "employee"
      ? "Поиск по вашим клиентам, задачам, записям"
      : "Поиск клиентов, задач, записей, сотрудников";

  function openResult(result: SearchResult) {
    setQuery("");
    setOpen(false);
    router.push(result.route);
  }

  return (
    <div
      className="hidden min-w-60 max-w-sm flex-1 md:block"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setOpen(false);
        }
      }}
    >
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setQuery("");
              setOpen(false);
            }
            if (event.key === "Enter" && results[0]) {
              event.preventDefault();
              openResult(results[0]);
            }
          }}
          placeholder={placeholder}
          className="pl-9"
          aria-label="Глобальный поиск"
          autoComplete="off"
        />
        {showPanel ? (
          <div className="absolute left-0 right-0 top-12 z-50 overflow-hidden rounded-lg border border-border bg-card shadow-soft">
            {normalizedQuery.length < 2 ? (
              <div className="p-4 text-sm text-muted-foreground">Введите минимум 2 символа.</div>
            ) : results.length ? (
              <div className="max-h-96 overflow-y-auto p-2">
                {results.map((result) => (
                  <button
                    key={result.id}
                    type="button"
                    className="w-full rounded-md px-3 py-2 text-left transition-colors hover:bg-muted focus:bg-muted focus:outline-none"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => openResult(result)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{result.title}</p>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {result.description}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-md bg-muted px-2 py-1 text-[11px] text-muted-foreground">
                        {result.section}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4 text-sm text-muted-foreground">Ничего не найдено.</div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
