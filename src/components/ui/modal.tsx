import { HTMLAttributes, ReactNode, useEffect } from "react";
import { cn } from "@/lib/utils";

export type ModalSize = "sm" | "md" | "lg";

export interface ModalProps extends HTMLAttributes<HTMLDivElement> {
  isOpen: boolean;
  onClose: () => void;
  size?: ModalSize;
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  closeButton?: boolean;
  scrollable?: boolean;
}

export function Modal({
  className,
  isOpen,
  onClose,
  size = "md",
  children,
  header,
  footer,
  closeButton = true,
  scrollable = true,
  ...props
}: ModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizes = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className={cn(
          "w-full rounded-modal bg-app-surface shadow-elevation-5 border border-app-border",
          sizes[size]
        )}
        onClick={(e) => e.stopPropagation()}
        {...props}
      >
        {/* Header */}
        {(header || closeButton) && (
          <div className="flex items-center justify-between border-b border-app-border p-6">
            <div>{header}</div>
            {closeButton && (
              <button
                onClick={onClose}
                className="text-app-muted hover:text-app-text transition-colors"
                aria-label="Close modal"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div
          className={cn(
            "p-6",
            scrollable && "max-h-[60vh] overflow-y-auto"
          )}
        >
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="border-t border-app-border bg-app-surface-soft px-6 py-4 flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
