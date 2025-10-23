import { AlertCircle, Loader } from "lucide-react";
import type { ReactNode } from "react";

export interface TableColumn<T = Record<string, unknown>> {
  key: string;
  label: string;
  align?: "left" | "right" | "center";
  width?: string;
  render?: (value: unknown, row: T, index: number) => ReactNode;
}

export interface TableProps<T = Record<string, unknown>> {
  columns: TableColumn<T>[];
  data: T[];
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  loadingMessage?: string;
  onRowClick?: (row: T, index: number) => void;
  className?: string;
  headerActions?: ReactNode;
  footer?: ReactNode;
  selectedRows?: Set<string | number>;
}

export function Table<T extends Record<string, unknown> & { id?: string | number }>({
  columns,
  data,
  loading = false,
  error = null,
  emptyMessage = "No data found",
  loadingMessage = "Loading...",
  onRowClick,
  className = "",
  headerActions,
  footer,
  selectedRows = new Set(),
}: TableProps<T>) {
  const handleRowClick = (row: T, index: number) => {
    if (onRowClick) {
      onRowClick(row, index);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className={`flex flex-col h-full ${className}`}>
        {headerActions && (
          <div className="flex-shrink-0">
            {headerActions}
          </div>
        )}
        <div className="flex flex-col flex-1">
          <div className="flex items-center justify-center gap-3 py-12 bg-surface border border-subtle rounded-lg flex-1">
            <Loader size={20} className="animate-spin text-secondary" />
            <span className="text-body text-secondary">{loadingMessage}</span>
          </div>
        </div>
        {footer && (
          <div className="flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`flex flex-col h-full ${className}`}>
        {headerActions && (
          <div className="flex-shrink-0">
            {headerActions}
          </div>
        )}
        <div className="flex flex-col flex-1">
          <div className="flex items-center justify-center gap-3 py-12 bg-surface border border-subtle rounded-lg flex-1">
            <AlertCircle size={20} className="text-error" />
            <span className="text-body text-error">{error}</span>
          </div>
        </div>
        {footer && (
          <div className="flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    );
  }

  // Empty state
  if (data.length === 0) {
    return (
      <div className={`flex flex-col h-full ${className}`}>
        {headerActions && (
          <div className="flex-shrink-0">
            {headerActions}
          </div>
        )}
        <div className="flex flex-col flex-1">
          <div className="flex items-center justify-center py-12 bg-surface border border-subtle rounded-lg flex-1">
            <span className="text-body text-secondary">{emptyMessage}</span>
          </div>
        </div>
        {footer && (
          <div className="flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    );
  }

  // Table with data
  return (
    <div className={`flex flex-col h-full ${className}`}>
      {headerActions && (
        <div className="flex-shrink-0">
          {headerActions}
        </div>
      )}

      <div className="flex flex-col flex-1 bg-surface border border-subtle rounded-lg overflow-hidden">
        {/* Scrollable table with sticky header */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full">
            <thead className="sticky top-0 bg-surface z-10">
              <tr className="border-b border-subtle">
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={`px-4 py-3 text-left text-body-sm font-semibold text-primary ${
                      column.align === "right"
                        ? "text-right"
                        : column.align === "center"
                        ? "text-center"
                        : "text-left"
                    }`}
                    style={column.width ? { width: column.width } : undefined}
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, index) => {
                const isSelected = selectedRows.has(row.id || index);
                return (
                  <tr
                    key={row.id || index}
                    className={`border-b border-subtle last:border-b-0 text-body-sm transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-accent text-white"
                        : "hover:bg-neutral-bg"
                    }`}
                    onClick={() => handleRowClick(row, index)}
                  >
                    {columns.map((column) => {
                      const value = row[column.key];
                      const cellContent = column.render
                        ? column.render(value, row, index)
                        : String(value ?? "");

                      return (
                        <td
                          key={column.key}
                          className={`px-4 py-3 ${
                            column.align === "right"
                              ? "text-right"
                              : column.align === "center"
                              ? "text-center"
                              : "text-left"
                          } ${
                            isSelected
                              ? "[&_*]:!text-white [&_.text-secondary]:!text-white/80"
                              : ""
                          }`}
                        >
                          {cellContent}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {footer && (
        <div className="flex-shrink-0">
          {footer}
        </div>
      )}
    </div>
  );
}

// Export additional utility components for common table patterns
export function TableBadge({
  children,
  variant = "default",
}: {
  children: ReactNode;
  variant?: "success" | "warning" | "error" | "default";
}) {
  const variantClasses = {
    success: "bg-success text-success-text",
    warning: "bg-warning text-warning-text",
    error: "bg-error text-error-text",
    default: "bg-neutral-bg text-secondary",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-full text-body-sm font-medium ${
        variantClasses[variant]
      }`}
    >
      {children}
    </span>
  );
}
