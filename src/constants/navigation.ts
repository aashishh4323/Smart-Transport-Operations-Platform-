import {
  BarChart3,
  Fuel,
  Gauge,
  Settings,
  ShieldCheck,
  Truck,
  Users,
  Wrench,
} from "lucide-react";

export const navigationItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: Gauge,
  },
  {
    label: "Fleet",
    href: "/fleet",
    icon: Truck,
  },
  {
    label: "Drivers",
    href: "/drivers",
    icon: Users,
  },
  {
    label: "Trips",
    href: "/trips",
    icon: ShieldCheck,
  },
  {
    label: "Maintenance",
    href: "/maintenance",
    icon: Wrench,
  },
  {
    label: "Fuel & Expenses",
    href: "/expenses",
    icon: Fuel,
  },
  {
    label: "Analytics",
    href: "/analytics",
    icon: BarChart3,
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings,
  },
];