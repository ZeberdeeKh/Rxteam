import type { ButtonHTMLAttributes, ReactNode } from "react";
import { btn, type ButtonKind } from "./buttons";

// Стандартна кнопка сайту. Для посилань-кнопок (<Link>/<a>) використовуй btn(...) напряму.
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  kind?: ButtonKind;
  children: ReactNode;
}

export function Button({ kind = "action", className, children, ...rest }: ButtonProps) {
  return (
    <button className={`${btn(kind)}${className ? ` ${className}` : ""}`} {...rest}>
      {children}
    </button>
  );
}
