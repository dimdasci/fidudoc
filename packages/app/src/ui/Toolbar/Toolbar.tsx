import { Toolbar as BaseToolbar } from "@base-ui-components/react/toolbar";
import styles from "./Toolbar.module.css";

export interface ToolbarRootProps {
  children: React.ReactNode;
  cols?: number;
  orientation?: "horizontal" | "vertical";
  loop?: boolean;
  disabled?: boolean;
  className?: string;
}

export function ToolbarRoot({
  children,
  className,
  ...props
}: ToolbarRootProps) {
  return (
    <BaseToolbar.Root className={`${styles.root} ${className || ""}`} {...props}>
      {children}
    </BaseToolbar.Root>
  );
}

export interface ToolbarGroupProps {
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

export function ToolbarGroup({ children, className, ...props }: ToolbarGroupProps) {
  return (
    <BaseToolbar.Group className={`${styles.group} ${className || ""}`} {...props}>
      {children}
    </BaseToolbar.Group>
  );
}

export interface ToolbarSeparatorProps {
  orientation?: "horizontal" | "vertical";
  className?: string;
}

export function ToolbarSeparator({ className, ...props }: ToolbarSeparatorProps) {
  return (
    <BaseToolbar.Separator
      className={`${styles.separator} ${className || ""}`}
      {...props}
    />
  );
}

// Export Button and Input as passthrough for composition with other components
export const ToolbarButton = BaseToolbar.Button;
export const ToolbarInput = BaseToolbar.Input;
export const ToolbarLink = BaseToolbar.Link;
