import clsx from "clsx";
import type { HTMLAttributes } from "react";

interface ErrorMessageProps extends HTMLAttributes<HTMLParagraphElement> {}

export function ErrorMessage({ className, ...props }: ErrorMessageProps) {
  return props.children ? (
    <p className={clsx("text-red-600 text-xs", className)} {...props} />
  ) : null;
}
