import { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant = "default" | "privacy" | "vault" | "gold" | "safe" | "solid" | "soft" | "outline" | "ghost";
export type BadgeSize = "sm" | "md" | "lg";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: ReactNode;
  closeable?: boolean;
  onClose?: () => void;
}

export function Badge({
  className,
  variant = "default",
  size = "md",
  icon,
  closeable = false,
  onClose,
  children,
  ...props
}: BadgeProps) {
  const variants = {
    default: "bg-slate-100 text-slate-700",
    privacy: "bg-indigo-100 text-indigo-700",
    vault: "bg-slate-900 text-white",
    gold: "bg-amber-100 text-amber-700",
    safe: "bg-success/20 text-success",
    solid: "bg-indigo-600 text-white",
    soft: "bg-indigo-50 text-indigo-700",
    outline: "border-2 border-indigo-600 text-indigo-600",
    ghost: "bg-transparent text-indigo-600",
  };

  const sizes = {
    sm: "px-2.5 py-1 text-caption-sm",
    md: "px-3 py-1.5 text-caption-md",
    lg: "px-4 py-2 text-body-sm",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-semibold",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {icon && <span>{icon}</span>}
      <span>{children}</span>
      {closeable && (
        <button
          onClick={onClose}
          className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-black/10 transition-colors"
          type="button"
          aria-label="Remove badge"
        >
          <svg
            className="h-3 w-3"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}
    </span>
  );
}
