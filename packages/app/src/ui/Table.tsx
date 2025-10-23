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
}: TableProps<T>) {
  const handleRowClick = (row: T, index: number) => {
    if (onRowClick) {
      onRowClick(row, index);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className={className}>
        <div>
          <Loader size={24} />
          <span>{loadingMessage}</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={className}>
        <div>
          <AlertCircle size={24} />
          {error}
        </div>
      </div>
    );
  }

  // Empty state
  if (data.length === 0) {
    return (
      <div className={className}>
        <div>
          {emptyMessage}
        </div>
      </div>
    );
  }

  // Table with data
  return (
    <div className={className}>
      {headerActions && (
        <div>
          {headerActions}
        </div>
      )}

      <div>
        <table>
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  style={column.width ? { width: column.width } : undefined}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr
                key={row.id || index}
                onClick={() => handleRowClick(row, index)}
              >
                {columns.map((column) => {
                  const value = row[column.key];
                  const cellContent = column.render
                    ? column.render(value, row, index)
                    : String(value ?? "");

                  return (
                    <td key={column.key}>
                      {cellContent}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {footer && (
        <div>
          {footer}
        </div>
      )}
    </div>
  );
}

// Export additional utility components for common table patterns
export function TableBadge({
  children,
}: {
  children: ReactNode;
  variant?: "success" | "warning" | "error" | "default";
}) {
  return (
    <span>
      {children}
    </span>
  );
}
