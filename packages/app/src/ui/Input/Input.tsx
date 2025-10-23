import { Input as BaseInput } from "@base-ui-components/react/input";
import styles from "./Input.module.css";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  defaultValue?: string | number | readonly string[];
  onValueChange?: (
    value: string,
    eventDetails: { event: React.ChangeEvent<HTMLInputElement> },
  ) => void;
  className?: string;
}

export function Input({ className, ...props }: InputProps) {
  return <BaseInput className={`${styles.input} ${className || ""}`} {...props} />;
}
