import type { LucideIcon } from "lucide-react";

export type AppUser = {
  id?: string;
  fullName: string;
  username: string;
  avatarUrl?: string | null;
};

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  match?: string[];
};

export type NavGroup = {
  title: string;
  items: NavItem[];
};
