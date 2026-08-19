import clsx from "clsx";
import type { ComponentProps } from "react";

interface PrimaryInputProps extends ComponentProps<"input"> {}

export const PrimaryInput = ({ className, ...props }: PrimaryInputProps) => {
  return (
    <input
      {...props}
      className={clsx(
        "w-full outline-none border-2 border-gray-200 focus:border-primary rounded-md p-2",
        className,
      )}
    />
  );
};
