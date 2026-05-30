import { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "dark";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function buttonStyles({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
}) {
  const variants = {
    primary:
      "bg-[#6366F1] text-white shadow-[0_18px_44px_rgba(99,102,241,0.28)] hover:bg-[#5558E8]",
    secondary:
      "border border-slate-200/80 bg-white/80 text-[#0F172A] shadow-[0_14px_36px_rgba(15,23,42,0.06)] hover:bg-white",
    ghost:
      "bg-transparent text-slate-600 hover:bg-white/70 hover:text-slate-950",
    dark:
      "bg-[#0F172A] text-white shadow-[0_18px_44px_rgba(15,23,42,0.24)] hover:bg-[#111827]",
  };

  const sizes = {
    sm: "h-9 px-4 text-sm",
    md: "h-11 px-5 text-sm",
    lg: "h-[52px] px-7 text-base",
  };

  return cn(
    "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-300 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
    variants[variant],
    sizes[size],
    className
  );
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonProps) {
  return (
    <button
      className={buttonStyles({ variant, size, className })}
      {...props}
    />
  );
}