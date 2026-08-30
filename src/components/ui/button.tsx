import { forwardRef } from "react";
import { motion, type HTMLMotionProps } from "motion/react";

type ButtonTone = "primary" | "soft" | "quiet" | "danger";

export type ButtonProps = HTMLMotionProps<"button"> & {
  tone?: ButtonTone;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", tone = "primary", type = "button", ...props }, ref) => (
    <motion.button
      ref={ref}
      type={type}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 420, damping: 18 }}
      className={`softButton softButton--${tone} ${className}`.trim()}
      {...props}
    />
  ),
);

Button.displayName = "Button";
