/**
 * Toast notification utility
 * Simple global toast management without component wrapper
 */

type ToastType = "success" | "error" | "info" | "warning";

interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

// Global state
let toasts: ToastMessage[] = [];
let listeners: Array<() => void> = [];

function notifyListeners() {
  listeners.forEach((listener) => {
    listener();
  });
}

export function showToast(message: string, type: ToastType = "info"): void {
  const id = Math.random().toString(36).slice(2);
  const toast: ToastMessage = { id, message, type };

  toasts.push(toast);
  notifyListeners();

  // Auto-remove after 3 seconds
  setTimeout(() => {
    toasts = toasts.filter(t => t.id !== id);
    notifyListeners();
  }, 3000);
}

export function getToasts(): ToastMessage[] {
  return [...toasts];
}

export function subscribe(listener: () => void): () => void {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter(l => l !== listener);
  };
}

export function removeToast(id: string): void {
  toasts = toasts.filter(t => t.id !== id);
  notifyListeners();
}
