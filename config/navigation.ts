import { MODULES, getModuleDefinition } from "@/config/modules";
import { getBusinessTemplate } from "@/config/templates";
import type { CompanyModule, ModuleCode, NavigationItem } from "@/types";

export const REQUIRED_MODULES: ModuleCode[] = ["dashboard"];

const titleByTemplate: Partial<Record<string, Partial<Record<ModuleCode, string>>>> = {
  auto: {
    calendar: "Записи",
    inventory: "Запчасти",
    sales: "Продажи",
    finance: "Финансы",
    resources: "Посты"
  },
  cafe: {
    inventory: "Товары и ингредиенты",
    sales: "Продажи",
    finance: "Финансы",
    clients: "Гости"
  },
  shop: {
    inventory: "Товары и остатки",
    sales: "Продажи",
    finance: "Финансы",
    clients: "Покупатели"
  },
  beauty: {
    inventory: "Расходники",
    sales: "Продажи",
    finance: "Финансы"
  }
};

export function getModuleTitle(code: ModuleCode, templateId: string) {
  const definition = getModuleDefinition(code);
  return titleByTemplate[templateId]?.[code] ?? definition?.title ?? code;
}

export function isRequiredModule(code: ModuleCode) {
  return REQUIRED_MODULES.includes(code);
}

export function withRequiredModules(modules: ModuleCode[] = []) {
  return Array.from(new Set([...REQUIRED_MODULES, ...modules]));
}

function applyRequiredModuleRules(modules: CompanyModule[]) {
  return modules.map((module) =>
    isRequiredModule(module.code)
      ? {
          ...module,
          status: "enabled" as const,
          visible: true,
          availableOnTariff: true
        }
      : module
  );
}

export function buildNavigationItems(
  modules: CompanyModule[],
  templateId: string
): NavigationItem[] {
  const template = getBusinessTemplate(templateId);
  const order = new Map(template.menuOrder.map((code, index) => [code, index + 1]));

  const items = normalizeCompanyModules(modules, templateId)
    .filter((module) => module.status !== "disabled" && module.status !== "unavailable")
    .map((module) => {
      const definition = getModuleDefinition(module.code);
      return {
        code: module.code,
        title: getModuleTitle(module.code, templateId),
        route: definition?.route ?? "/dashboard",
        icon: definition?.icon ?? "Circle",
        visible: module.visible && module.status === "enabled",
        order: module.order || order.get(module.code) || definition?.defaultOrder || 99
      } satisfies NavigationItem;
    })
    .sort((a, b) => a.order - b.order);

  return [
    ...items,
    {
      code: "settings",
      title: "Настройки",
      route: "/settings",
      icon: "Settings",
      visible: true,
      order: 100
    }
  ];
}

export function normalizeCompanyModules(
  modules: CompanyModule[],
  templateId: string
): CompanyModule[] {
  const existing = new Set(modules.map((module) => module.code));
  const missing = buildDefaultCompanyModules(templateId).filter((module) => !existing.has(module.code));
  return applyRequiredModuleRules([...modules, ...missing]);
}

export function buildDefaultCompanyModules(
  templateId: string,
  selectedModules?: ModuleCode[]
): CompanyModule[] {
  const template = getBusinessTemplate(templateId);
  const selected = new Set(withRequiredModules(selectedModules ?? template.activeModules));
  const menuOrder = new Map(template.menuOrder.map((code, index) => [code, index + 1]));

  return applyRequiredModuleRules(MODULES.map((definition) => {
    const availableOnTariff = definition.plan === "basic";
    const active = selected.has(definition.code);
    const hidden = template.hiddenModules.includes(definition.code);
    const status = !availableOnTariff
      ? "unavailable"
      : active
        ? hidden
          ? "hidden"
          : "enabled"
        : "disabled";

    return {
      code: definition.code,
      status,
      visible: status === "enabled",
      order: menuOrder.get(definition.code) ?? definition.defaultOrder,
      availableOnTariff
    };
  }));
}
