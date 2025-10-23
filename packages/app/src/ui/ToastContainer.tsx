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
  { icon: React.ReactNode }
> = {
  success: {
    icon: <CheckCircle size={20} />,
  },
  error: {
    icon: <AlertCircle size={20} />,
  },
  info: {
    icon: <Info size={20} />,
  },
  warning: {
    icon: <AlertCircle size={20} />,
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

  return (
    <div>
      {toasts.map((toast) => {
        const config = typeConfig[toast.type];
        return (
          <div key={toast.id}>
            {config.icon}
            <span>{toast.message}</span>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
