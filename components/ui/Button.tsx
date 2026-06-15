import type { ButtonHTMLAttributes, ReactNode } from "react";
import { buttonClass, type ButtonVariant, type ButtonSize } from "./styles";

// Стандартна кнопка сайту. Для посилань-кнопок (<Link>/<a>) використовуй buttonClass(...) напряму.
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
}

export function Button({ variant = "primary", size = "md", className, children, ...rest }: ButtonProps) {
  return (
    <button className={`${buttonClass(variant, size)}${className ? ` ${className}` : ""}`} {...rest}>
      {children}
    </button>
  );
}
