import { Input as BaseInput } from "@base-ui-components/react/input";
import type { ComponentPropsWithoutRef } from "react";
import styles from "./Input.module.css";

type BaseInputProps = ComponentPropsWithoutRef<typeof BaseInput>;

export type InputProps = BaseInputProps & {
  className?: string;
};

export function Input({ className, ...props }: InputProps) {
  return <BaseInput className={`${styles.input} ${className || ""}`} {...props} />;
}
