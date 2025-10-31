import { Select as BaseSelect } from "@base-ui-components/react/select";
import { ChevronDown } from "lucide-react";
import styles from "./Select.module.css";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectRootProps {
  children: React.ReactNode;
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}

export function SelectRoot({
  children,
  value,
  onValueChange,
  disabled = false,
}: SelectRootProps) {
  return (
    <BaseSelect.Root
      value={value}
      onValueChange={(newValue) => onValueChange(newValue as string)}
      disabled={disabled}
    >
      {children}
    </BaseSelect.Root>
  );
}

export interface SelectTriggerProps {
  children: React.ReactNode;
  className?: string;
}

export function SelectTrigger({ children, className }: SelectTriggerProps) {
  return (
    <BaseSelect.Trigger className={`${styles.trigger} ${className || ""}`}>
      {children}
      <BaseSelect.Icon className={styles.icon}>
        <ChevronDown size={16} />
      </BaseSelect.Icon>
    </BaseSelect.Trigger>
  );
}

export interface SelectValueProps {
  placeholder?: string;
}

export function SelectValue({ placeholder = "Select..." }: SelectValueProps) {
  return (
    <BaseSelect.Value className={styles.value}>
      {(value: string | null) => value || placeholder}
    </BaseSelect.Value>
  );
}

export interface SelectPopupProps {
  children: React.ReactNode;
}

export function SelectPopup({ children }: SelectPopupProps) {
  return (
    <BaseSelect.Portal>
      <BaseSelect.Positioner className={styles.positioner} sideOffset={4}>
        <BaseSelect.Popup className={styles.popup}>
          <BaseSelect.List>
            {children}
          </BaseSelect.List>
        </BaseSelect.Popup>
      </BaseSelect.Positioner>
    </BaseSelect.Portal>
  );
}

export interface SelectItemProps {
  value: string;
  children: React.ReactNode;
}

export function SelectItem({ value, children }: SelectItemProps) {
  return (
    <BaseSelect.Item value={value} className={styles.item}>
      <BaseSelect.ItemText>{children}</BaseSelect.ItemText>
      <BaseSelect.ItemIndicator className={styles.indicator}>
        <CheckIcon />
      </BaseSelect.ItemIndicator>
    </BaseSelect.Item>
  );
}

// Icon Components

function CheckIcon(props: React.ComponentProps<"svg">) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M3 7.5L5.5 10L11 4"
        stroke="currentcolor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
