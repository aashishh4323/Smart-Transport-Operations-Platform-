import type { ModuleKey, UserRole } from "@/types";

export const roleModuleAccess: Record<UserRole, ModuleKey[]> = {
  Admin: [
    "dashboard",
    "fleet",
    "drivers",
    "trips",
    "maintenance",
    "expenses",
    "analytics",
    "settings",
  ],
  FleetManager: ["dashboard", "fleet", "maintenance", "analytics"],
  Dispatcher: ["dashboard", "drivers", "trips"],
  SafetyOfficer: ["dashboard", "drivers", "maintenance"],
  FinancialAnalyst: ["dashboard", "expenses", "analytics"],
};

export function canAccessModule(role: UserRole | null, module: ModuleKey) {
  if (!role) {
    return false;
  }

  return roleModuleAccess[role].includes(module);
}
