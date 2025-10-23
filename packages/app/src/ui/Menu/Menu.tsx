import { Menu as BaseMenu } from "@base-ui-components/react/menu";
import styles from "./Menu.module.css";

export interface MenuRootProps {
  children: React.ReactNode;
}

export function MenuRoot({ children }: MenuRootProps) {
  return <BaseMenu.Root>{children}</BaseMenu.Root>;
}

export interface MenuTriggerProps {
  children: React.ReactNode;
  className?: string;
}

export function MenuTrigger({ children, className }: MenuTriggerProps) {
  return (
    <BaseMenu.Trigger className={`${styles.trigger} ${className || ""}`}>
      {children}
    </BaseMenu.Trigger>
  );
}

export interface MenuPopupProps {
  children: React.ReactNode;
  showArrow?: boolean;
}

export function MenuPopup({ children, showArrow = true }: MenuPopupProps) {
  return (
    <BaseMenu.Portal>
      <BaseMenu.Positioner className={styles.positioner}>
        <BaseMenu.Popup className={styles.popup}>
          {showArrow && (
            <BaseMenu.Arrow className={styles.arrow}>
              <ArrowSvg />
            </BaseMenu.Arrow>
          )}
          {children}
        </BaseMenu.Popup>
      </BaseMenu.Positioner>
    </BaseMenu.Portal>
  );
}

export interface MenuItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  selected?: boolean;
}

export function MenuItem({ children, onClick, selected }: MenuItemProps) {
  return (
    <BaseMenu.Item className={styles.item} onClick={onClick}>
      {selected
        ? <CheckIcon className={styles.checkmark} />
        : <span className={styles.checkmarkPlaceholder} />}
      {children}
    </BaseMenu.Item>
  );
}

export interface MenuSeparatorProps {
  className?: string;
}

export function MenuSeparator({ className }: MenuSeparatorProps) {
  return <BaseMenu.Separator className={`${styles.separator} ${className || ""}`} />;
}

// Icon Components

function ArrowSvg(props: React.ComponentProps<"svg">) {
  return (
    <svg
      width="20"
      height="10"
      viewBox="0 0 20 10"
      fill="none"
      aria-hidden="true"
      {...props}
    >
      <path
        d="M9.66437 2.60207L4.80758 6.97318C4.07308 7.63423 3.11989 8 2.13172 8H0V10H20V8H17.8683C16.8801 8 15.9269 7.63423 15.1924 6.97318L10.3356 2.60207C10.1481 2.43503 9.85193 2.43503 9.66437 2.60207Z"
        fill="currentcolor"
      />
    </svg>
  );
}

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
