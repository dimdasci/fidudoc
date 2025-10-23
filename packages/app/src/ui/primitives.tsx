import { AlertCircle, Check, ChevronDown, ChevronUp, X } from "lucide-react";
import React, { type ReactNode, useState } from "react";

// Color system
const colors = {
  light: {
    bg: "#f9fafb",
    bgSecondary: "#ffffff",
    text: "#111827",
    textSecondary: "#6b7280",
    border: "#e5e7eb",
    green: "#15803d",
    greenDark: "#14532d",
    amber: "#f59e0b",
    red: "#ef4444",
    blueLight: "#eff6ff",
  },
  dark: {
    bg: "#111827",
    bgSecondary: "#1f2937",
    text: "#f3f4f6",
    textSecondary: "#9ca3af",
    border: "#374151",
    green: "#22c55e",
    greenDark: "#bbf7d0",
    amber: "#fbbf24",
    red: "#f87171",
    blueLight: "#0f172a",
  },
};

const isDark = () => {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
};

const getColors = () => (isDark() ? colors.dark : colors.light);

// ============================================================================
// Button
// ============================================================================
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
  size?: "sm" | "md";
  children: ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className, ...props }, ref) => {
    const c = getColors();
    const padding = size === "sm" ? "6px 12px" : "8px 16px";
    const fontSize = size === "sm" ? "14px" : "14px";

    const baseStyle: React.CSSProperties = {
      padding,
      fontSize,
      fontWeight: 500,
      border: "1px solid transparent",
      borderRadius: "6px",
      cursor: "pointer",
      transition: "all 0.2s",
      fontFamily: "Inter, sans-serif",
      whiteSpace: "nowrap" as const,
    };

    const variants = {
      primary: {
        background: c.green,
        color: "#ffffff",
        border: `1px solid ${c.green}`,
      },
      secondary: {
        background: c.bgSecondary,
        color: c.text,
        border: `1px solid ${c.border}`,
      },
      danger: {
        background: c.red,
        color: "#ffffff",
        border: `1px solid ${c.red}`,
      },
    };

    return (
      <button
        ref={ref}
        style={{ ...baseStyle, ...variants[variant] }}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";

// ============================================================================
// Input
// ============================================================================
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, ...props }, ref) => {
    const c = getColors();
    return (
      <div style={{ width: "100%" }}>
        {label && (
          <label
            style={{
              display: "block",
              marginBottom: "4px",
              fontSize: "14px",
              fontWeight: 500,
              color: c.text,
              fontFamily: "Inter, sans-serif",
            }}
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          style={{
            width: "100%",
            padding: "8px 12px",
            fontSize: "14px",
            border: `1px solid ${c.border}`,
            borderRadius: "6px",
            background: c.bgSecondary,
            color: c.text,
            fontFamily: "Inter, sans-serif",
            boxSizing: "border-box",
            transition: "border-color 0.2s",
          }}
          onFocus={(e) => {
            (e.target as HTMLInputElement).style.borderColor = c.green;
          }}
          onBlur={(e) => {
            (e.target as HTMLInputElement).style.borderColor = c.border;
          }}
          {...props}
        />
        {error && (
          <p
            style={{
              marginTop: "4px",
              fontSize: "12px",
              color: c.red,
              fontFamily: "Inter, sans-serif",
            }}
          >
            {error}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";

// ============================================================================
// Select
// ============================================================================
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: Array<{ value: string; label: string }>;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, ...props }, ref) => {
    const c = getColors();
    return (
      <div style={{ width: "100%" }}>
        {label && (
          <label
            style={{
              display: "block",
              marginBottom: "4px",
              fontSize: "14px",
              fontWeight: 500,
              color: c.text,
              fontFamily: "Inter, sans-serif",
            }}
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          style={{
            width: "100%",
            padding: "8px 12px",
            fontSize: "14px",
            border: `1px solid ${c.border}`,
            borderRadius: "6px",
            background: c.bgSecondary,
            color: c.text,
            fontFamily: "Inter, sans-serif",
            boxSizing: "border-box",
            cursor: "pointer",
          }}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    );
  },
);

Select.displayName = "Select";

// ============================================================================
// Textarea
// ============================================================================
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  TextareaProps
>(({ label, ...props }, ref) => {
  const c = getColors();
  return (
    <div style={{ width: "100%" }}>
      {label && (
        <label
          style={{
            display: "block",
            marginBottom: "4px",
            fontSize: "14px",
            fontWeight: 500,
            color: c.text,
            fontFamily: "Inter, sans-serif",
          }}
        >
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        style={{
          width: "100%",
          padding: "8px 12px",
          fontSize: "14px",
          border: `1px solid ${c.border}`,
          borderRadius: "6px",
          background: c.bgSecondary,
          color: c.text,
          fontFamily: "Inter, sans-serif",
          boxSizing: "border-box",
          minHeight: "100px",
        }}
        {...props}
      />
    </div>
  );
});

Textarea.displayName = "Textarea";

// ============================================================================
// Table
// ============================================================================
interface TableProps {
  children: ReactNode;
  striped?: boolean;
}

export const Table: React.FC<TableProps> = ({ children, striped }) => {
  const c = getColors();
  return (
    <table
      style={{
        width: "100%",
        borderCollapse: "collapse",
        fontSize: "14px",
        fontFamily: "Inter, sans-serif",
      }}
    >
      {children}
    </table>
  );
};

export const TableHead: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const c = getColors();
  return (
    <thead
      style={{
        background: c.bgSecondary,
        borderBottom: `2px solid ${c.border}`,
      }}
    >
      {children}
    </thead>
  );
};

export const TableBody: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  return <tbody>{children}</tbody>;
};

interface TableRowProps {
  children: ReactNode;
  onClick?: () => void;
  selected?: boolean;
  disabled?: boolean;
}

export const TableRow: React.FC<TableRowProps> = ({
  children,
  onClick,
  selected,
  disabled,
}) => {
  const c = getColors();
  return (
    <tr
      onClick={onClick}
      style={{
        background: selected
          ? c.blueLight
          : undefined,
        borderBottom: `1px solid ${c.border}`,
        cursor: onClick ? "pointer" : undefined,
        opacity: disabled ? 0.6 : 1,
        transition: "background 0.15s",
      }}
      onMouseEnter={(e) => {
        if (onClick && !selected) {
          (e.currentTarget as HTMLTableRowElement).style.background = c.bgSecondary;
        }
      }}
      onMouseLeave={(e) => {
        if (onClick && !selected) {
          (e.currentTarget as HTMLTableRowElement).style.background = undefined;
        }
      }}
    >
      {children}
    </tr>
  );
};

interface TableCellProps {
  children: ReactNode;
  header?: boolean;
  numeric?: boolean;
  width?: string;
}

export const TableCell: React.FC<TableCellProps> = ({
  children,
  header,
  numeric,
  width,
}) => {
  const c = getColors();
  const padding = header ? "12px 16px" : "10px 16px";
  const fontWeight = header ? 600 : 400;
  const textAlign = numeric ? ("right" as const) : ("left" as const);
  const Tag = header ? "th" : "td";

  return (
    <Tag
      style={{
        padding,
        fontWeight,
        textAlign,
        width,
        color: c.text,
      }}
    >
      {children}
    </Tag>
  );
};

// ============================================================================
// Modal
// ============================================================================
interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  open,
  title,
  onClose,
  children,
  footer,
}) => {
  const c = getColors();

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: c.bgSecondary,
          borderRadius: "8px",
          width: "90%",
          maxWidth: "600px",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 25px rgba(0, 0, 0, 0.15)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px 20px",
            borderBottom: `1px solid ${c.border}`,
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: "18px",
              fontWeight: 600,
              color: c.text,
              fontFamily: "Inter, sans-serif",
            }}
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: c.textSecondary,
              padding: "4px",
            }}
          >
            <X size={20} />
          </button>
        </div>
        <div
          style={{
            flex: 1,
            overflow: "auto",
            padding: "20px",
          }}
        >
          {children}
        </div>
        {footer && (
          <div
            style={{
              display: "flex",
              gap: "12px",
              justifyContent: "flex-end",
              padding: "16px 20px",
              borderTop: `1px solid ${c.border}`,
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// Tabs
// ============================================================================
interface Tab {
  id: string;
  label: string;
  content: ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  defaultTab: string;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, defaultTab }) => {
  const [active, setActive] = useState(defaultTab);
  const c = getColors();

  const activeTab = tabs.find((t) => t.id === active);

  return (
    <div style={{ width: "100%" }}>
      <div
        style={{
          display: "flex",
          borderBottom: `2px solid ${c.border}`,
          gap: "0",
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActive(tab.id)}
            style={{
              padding: "12px 16px",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: active === tab.id ? 600 : 400,
              color: active === tab.id ? c.green : c.textSecondary,
              borderBottom: active === tab.id ? `2px solid ${c.green}` : "none",
              fontFamily: "Inter, sans-serif",
              marginBottom: "-2px",
              transition: "color 0.2s",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div style={{ paddingTop: "12px" }}>
        {activeTab?.content}
      </div>
    </div>
  );
};

// ============================================================================
// Toast Container & Toasts
// ============================================================================
interface ToastMessage {
  id: string;
  message: string;
  type: "success" | "error" | "info";
  duration?: number;
}

const toastStore: {
  listeners: Set<(msg: ToastMessage[]) => void>;
  messages: ToastMessage[];
} = {
  listeners: new Set(),
  messages: [],
};

export const showToast = (
  message: string,
  type: "success" | "error" | "info" = "info",
  duration = 3000,
) => {
  const id = Math.random().toString(36);
  const toast: ToastMessage = { id, message, type, duration };
  toastStore.messages = [...toastStore.messages, toast];
  toastStore.listeners.forEach((listener) => listener(toastStore.messages));

  if (duration > 0) {
    setTimeout(() => {
      toastStore.messages = toastStore.messages.filter(
        (t) => t.id !== id,
      );
      toastStore.listeners.forEach((listener) => listener(toastStore.messages));
    }, duration);
  }
};

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const c = getColors();

  React.useEffect(() => {
    toastStore.listeners.add(setToasts);
    return () => {
      toastStore.listeners.delete(setToasts);
    };
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        top: "16px",
        right: "16px",
        zIndex: 999,
        maxWidth: "400px",
      }}
    >
      {toasts.map((toast) => {
        const bgColor = toast.type === "success"
          ? c.green
          : toast.type === "error"
          ? c.red
          : c.blueLight;
        const textColor = toast.type !== "info" ? "#ffffff" : c.text;
        const icon = toast.type === "success"
          ? <Check size={16} />
          : toast.type === "error"
          ? <AlertCircle size={16} />
          : null;

        return (
          <div
            key={toast.id}
            style={{
              background: bgColor,
              color: textColor,
              padding: "12px 16px",
              borderRadius: "6px",
              marginBottom: "8px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "14px",
              fontFamily: "Inter, sans-serif",
              boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
              animation: "slideIn 0.3s ease-out forwards",
            }}
          >
            {icon}
            {toast.message}
          </div>
        );
      })}
      <style>
        {`
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}
      </style>
    </div>
  );
};

// ============================================================================
// Badge/Chip
// ============================================================================
interface BadgeProps {
  children: ReactNode;
  variant?: "success" | "warning" | "error" | "default";
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "default",
}) => {
  const c = getColors();

  const variants = {
    success: {
      bg: c.green,
      text: "#ffffff",
    },
    warning: {
      bg: c.amber,
      text: "#ffffff",
    },
    error: {
      bg: c.red,
      text: "#ffffff",
    },
    default: {
      bg: c.border,
      text: c.text,
    },
  };

  const style = variants[variant];

  return (
    <span
      style={{
        display: "inline-block",
        padding: "4px 12px",
        borderRadius: "16px",
        fontSize: "12px",
        fontWeight: 500,
        background: style.bg,
        color: style.text,
        fontFamily: "Inter, sans-serif",
      }}
    >
      {children}
    </span>
  );
};

// ============================================================================
// Checkbox
// ============================================================================
interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, ...props }, ref) => {
    const c = getColors();
    return (
      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          cursor: "pointer",
          fontSize: "14px",
          fontFamily: "Inter, sans-serif",
          color: c.text,
        }}
      >
        <input
          ref={ref}
          type="checkbox"
          style={{
            width: "18px",
            height: "18px",
            cursor: "pointer",
            accentColor: c.green,
          }}
          {...props}
        />
        {label}
      </label>
    );
  },
);

Checkbox.displayName = "Checkbox";

// ============================================================================
// Divider
// ============================================================================
export const Divider: React.FC = () => {
  const c = getColors();
  return (
    <div
      style={{
        height: "1px",
        background: c.border,
        margin: "12px 0",
      }}
    />
  );
};

// ============================================================================
// Card
// ============================================================================
interface CardProps {
  children: ReactNode;
  padding?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  padding = "16px",
  onClick,
}) => {
  const c = getColors();
  return (
    <div
      onClick={onClick}
      style={{
        background: c.bgSecondary,
        border: `1px solid ${c.border}`,
        borderRadius: "8px",
        padding,
        cursor: onClick ? "pointer" : undefined,
        transition: "all 0.2s",
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          (e.currentTarget as HTMLDivElement).style.borderColor = c.green;
          (e.currentTarget as HTMLDivElement).style.boxShadow =
            `0 0 0 2px ${c.blueLight}`;
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          (e.currentTarget as HTMLDivElement).style.borderColor = c.border;
          (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
        }
      }}
    >
      {children}
    </div>
  );
};
