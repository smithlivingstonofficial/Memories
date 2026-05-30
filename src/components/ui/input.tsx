import { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
}

export function Input({ className, label, hint, ...props }: InputProps) {
  return (
    <label className="block space-y-2">
      {label && (
        <span className="text-sm font-medium text-slate-800">{label}</span>
      )}

      <input
        className={cn(
          "h-12 w-full rounded-2xl border border-slate-200/80 bg-white/80 px-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-[#6366F1]/40 focus:ring-4 focus:ring-[#6366F1]/10",
          className
        )}
        {...props}
      />

      {hint && <p className="text-xs leading-6 text-slate-500">{hint}</p>}
    </label>
  );
}