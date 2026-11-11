import type { ButtonHTMLAttributes, ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";

export function Button({
  variant = "primary",
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
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
      {children as ReactNode}
    </motion.button>
  );
}