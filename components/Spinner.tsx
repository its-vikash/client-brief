import clsx from "clsx";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  light?: boolean;
}

const sizes = {
  sm: "w-4 h-4 border-2",
  md: "w-6 h-6 border-2",
  lg: "w-10 h-10 border-[3px]",
};

export default function Spinner({ size = "md", className, light = false }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={clsx(
        "rounded-full animate-spin",
        light
          ? "border-white/30 border-t-white"
          : "border-[#D8D2C8] border-t-[#E8652A]",
        sizes[size],
        className
      )}
    />
  );
}
