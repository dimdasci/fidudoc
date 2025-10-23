import type { ReactNode } from "react";
import styles from "./Button.module.css";

export interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  className?: string;
  icon?: ReactNode;
}

export function Button({
  children,
  onClick,
  variant = "secondary",
  size = "md",
  disabled = false,
  type = "button",
  className = "",
  icon,
}: ButtonProps) {
  const classes = [
    styles.button,
    styles[variant],
    styles[size],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={classes}
    >
      {icon && <span className={styles.icon}>{icon}</span>}
      {children}
    </button>
  );
}
