import clsx from "clsx";

type InputProps = React.ComponentProps<"input"> & {
  error?: boolean;
};

export default function Input({ error, className, ...props }: InputProps) {
  return (
    <input
      className={clsx(
        "w-full outline-none",
        "border-b-2 focus:border-b-primary border-b-background",
        error ? "border-b-red-600" : "",
        className,
      )}
      {...props}
    />
  );
}
