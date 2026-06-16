import type { ButtonHTMLAttributes, ReactNode } from "react";
import { btn, type ButtonKind, type ButtonSize } from "./buttons";

// Стандартна кнопка сайту. Для посилань-кнопок (<Link>/<a>) використовуй btn(...) напряму.
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  kind?: ButtonKind;
  size?: ButtonSize;
  children: ReactNode;
}

export function Button({ kind = "action", size = "md", className, children, ...rest }: ButtonProps) {
  return (
    <button className={`${btn(kind, size)}${className ? ` ${className}` : ""}`} {...rest}>
      {children}
    </button>
  );
}
