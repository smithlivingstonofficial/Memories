import { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type CardVariant = "elevated" | "filled" | "outlined" | "flat" | "interactive";
export type CardPadding = "compact" | "regular" | "comfortable";
export type CardRounded = "standard" | "large";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: CardPadding;
  rounded?: CardRounded;
  children: ReactNode;
}

export function Card({
  className,
  variant = "elevated",
  padding = "regular",
  rounded = "standard",
  children,
  ...props
}: CardProps) {
  const variants = {
    elevated:
      "bg-app-surface border border-app-border shadow-elevation-4 backdrop-filter backdrop-blur-[24px]",
    filled:
      "bg-app-surface-strong border border-app-border shadow-elevation-2",
    outlined:
      "bg-transparent border-2 border-app-border",
    flat:
      "bg-app-surface-soft border border-app-border",
    interactive:
      "bg-app-surface border border-app-border shadow-elevation-2 backdrop-filter backdrop-blur-[24px] hover:shadow-elevation-3 hover:border-app-accent/30 transition-all duration-200 cursor-pointer",
  };

  const paddings = {
    compact: "p-3",
    regular: "p-4",
    comfortable: "p-5",
  };

  const roundeds = {
    standard: "rounded-card",
    large: "rounded-[20px]",
  };

  return (
    <div
      className={cn(
        "text-app-text",
        variants[variant],
        paddings[padding],
        roundeds[rounded],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
