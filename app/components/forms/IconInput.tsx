import clsx from "clsx";
import type { ComponentProps } from "react";

interface IconInputProps extends ComponentProps<"input"> {
  icon: React.ReactNode;
}

const IconInput = ({ icon, ...props }: IconInputProps) => {
  return (
    <div
      className={clsx(
        "flex items-stretch border-2 border-gray-300 rounded-md",
        "focus-within:border-primary",
        "pr-2",
      )}
    >
      <div className="px-2 flex flex-col justify-center">{icon}</div>
      <input className="w-full py-3 outline-none rounded-md" {...props} />
    </div>
  );
};
export default IconInput;
