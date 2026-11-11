import type {
  InputHTMLAttributes,
  LabelHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-md border border-line-strong bg-bg-deep px-3 py-2 text-sm text-text placeholder:text-text-faint transition-colors focus:border-accent/70 focus:outline-none",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full resize-none rounded-md border border-line-strong bg-bg-deep px-3 py-2 text-sm text-text placeholder:text-text-faint transition-colors focus:border-accent/70 focus:outline-none",
        className,
      )}
      {...props}
    />
  );
}

export function Label({
  className,
  ...props
}: LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "mb-1.5 block text-[11px] font-semibold tracking-wide text-text-dim uppercase",
        className,
      )}
      {...props}
    />
  );
}