import { forwardRef, type ButtonHTMLAttributes } from "react";

type ButtonVariant = "default" | "secondary" | "danger" | "ghost";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

const variantClasses: Record<ButtonVariant, string> = {
  default: "ui-button-default",
  secondary: "ui-button-secondary",
  danger: "ui-button-danger",
  ghost: "ui-button-ghost",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "default", type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={`ui-button ${variantClasses[variant]} ${className}`.trim()}
      {...props}
    />
  ),
);

Button.displayName = "Button";
