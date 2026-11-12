import type {
  ButtonHTMLAttributes,
  ReactNode,
} from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";

type ButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  | "onAnimationStart"
  | "onAnimationEnd"
  | "onAnimationIteration"
  | "onDragStart"
  | "onDragEnd"
  | "onDragEnter"
  | "onDragLeave"
  | "onDragOver"
  | "onDrag"
> & {
  variant?: Variant;
};

type ButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  | "onAnimationStart"
  | "onAnimationEnd"
  | "onAnimationIteration"
  | "onDragStart"
  | "onDragEnd"
  | "onDragEnter"
  | "onDragLeave"
  | "onDragOver"
  | "onDrag"
> & {
  variant?: Variant;
  loading?: boolean;
};

export function Button({
  variant = "primary",
  className,
  children,
  loading = false,
  ...props
}: ButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
      disabled={loading || props.disabled}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md px-3.5 py-2 text-sm font-medium transition-colors select-none",
        variant === "primary" &&
          "bg-accent text-[#062b18] hover:bg-accent-hover",
        variant === "secondary" &&
          "bg-bg-3 text-text hover:bg-bg-hover",
        variant === "ghost" &&
          "bg-transparent text-text-dim hover:bg-bg-3 hover:text-text",
        variant === "danger" && "bg-danger text-white hover:bg-danger-hover",
        variant === "outline" &&
          "border border-line-strong bg-transparent text-text hover:border-accent/60 hover:text-accent",
        "disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin h-4 w-4 mr-2"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children as ReactNode}
    </motion.button>
  );
}