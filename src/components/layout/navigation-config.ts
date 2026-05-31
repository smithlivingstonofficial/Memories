import {
  Bookmark,
  CalendarDays,
  Clock3,
  Compass,
  Home,
  LayoutDashboard,
  LockKeyhole,
  MessageCircle,
  PenLine,
  Settings,
  Sparkles,
  User,
  UserCheck,
  Users,
} from "lucide-react";
import type { NavGroup, NavItem } from "@/components/layout/layout-types";

export const desktopNavGroups: NavGroup[] = [
  {
    title: "Main",
    items: [
      { label: "Home", href: "/home", icon: Home },
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Create", href: "/create", icon: PenLine },
    ],
  },
  {
    title: "Diary",
    items: [
      {
        label: "Calendar",
        href: "/calendar",
        icon: CalendarDays,
        match: ["/calendar", "/diary/day"],
      },
      { label: "Timeline", href: "/timeline", icon: Clock3 },
      { label: "Vault", href: "/vault", icon: LockKeyhole },
      { label: "On This Day", href: "/on-this-day", icon: Sparkles },
      { label: "Keepsakes", href: "/keepsakes", icon: Bookmark },
    ],
  },
  {
    title: "Social",
    items: [
      { label: "Discover", href: "/discover", icon: Compass },
      { label: "Messages", href: "/messages", icon: MessageCircle },
      { label: "Inner Circle", href: "/inner-circle", icon: Users },
      { label: "Requests", href: "/requests", icon: UserCheck },
    ],
  },
  {
    title: "Account",
    items: [
      { label: "Profile", href: "/profile", icon: User },
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

export const mobilePrimaryNavItems: NavItem[] = [
  { label: "Home", href: "/home", icon: Home },
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Create", href: "/create", icon: PenLine },
  {
    label: "Calendar",
    href: "/calendar",
    icon: CalendarDays,
    match: ["/calendar", "/diary/day"],
  },
];

export const mobileMenuGroups: NavGroup[] = [
  {
    title: "Diary",
    items: [
      { label: "Timeline", href: "/timeline", icon: Clock3 },
      { label: "Vault", href: "/vault", icon: LockKeyhole },
      { label: "On This Day", href: "/on-this-day", icon: Sparkles },
      { label: "Keepsakes", href: "/keepsakes", icon: Bookmark },
    ],
  },
  {
    title: "Social",
    items: [
      { label: "Discover", href: "/discover", icon: Compass },
      { label: "Messages", href: "/messages", icon: MessageCircle },
      { label: "Inner Circle", href: "/inner-circle", icon: Users },
      { label: "Requests", href: "/requests", icon: UserCheck },
    ],
  },
  {
    title: "Account",
    items: [
      { label: "Profile", href: "/profile", icon: User },
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
];