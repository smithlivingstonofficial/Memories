import type { NavItem } from "@/components/layout/layout-types";

export function isActiveRoute(pathname: string, item: NavItem) {
  const routes = item.match ?? [item.href];

  return routes.some((route) => {
    if (route === "/home") return pathname === "/home";
    return pathname === route || pathname.startsWith(`${route}/`);
  });
}