/**
 * Toast Container Component
 * Renders all active toasts and handles their display
 */

import { AlertCircle, CheckCircle, Info, X } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { getToasts, removeToast, subscribe } from "./toast";

type ToastType = "success" | "error" | "info" | "warning";

interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

const typeConfig: Record<
  ToastType,
  { icon: React.ReactNode; colorClass: string; bgClass: string }
> = {
  success: {
    icon: <CheckCircle size={20} />,
    colorClass: "text-success",
    bgClass: "bg-success",
  },
  error: {
    icon: <AlertCircle size={20} />,
    colorClass: "text-error",
    bgClass: "bg-error",
  },
  info: {
    icon: <Info size={20} />,
    colorClass: "text-primary",
    bgClass: "bg-accent",
  },
  warning: {
    icon: <AlertCircle size={20} />,
    colorClass: "text-warning",
    bgClass: "bg-warning",
  },
};

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>(getToasts());

  useEffect(() => {
    const unsubscribe = subscribe(() => {
      setToasts(getToasts());
    });

    return unsubscribe;
  }, []);

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {toasts.map((toast) => {
        const config = typeConfig[toast.type];
        return (
          <div
            key={toast.id}
            className="flex items-start gap-3 p-4 bg-surface border border-subtle rounded-lg shadow-lg animate-in slide-in-from-right-full duration-300"
          >
            {/* Icon with colored background */}
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full ${config.bgClass}/10 flex-shrink-0`}
            >
              <div className={config.colorClass}>
                {config.icon}
              </div>
            </div>

            {/* Message */}
            <div className="flex-1 min-w-0">
              <p className="text-body-sm text-primary leading-relaxed">
                {toast.message}
              </p>
            </div>

            {/* Close button */}
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              aria-label="Close notification"
              className="flex items-center justify-center w-6 h-6 text-secondary hover:text-primary transition-colors rounded-sm hover:bg-neutral-bg flex-shrink-0"
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
