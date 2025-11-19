import clsx from "clsx";

type BadgeVariant = "default" | "success" | "warning" | "danger" | "info";

type BadgeProps = {
  children: string;
  variant?: BadgeVariant;
};

const variants: Record<BadgeVariant, string> = {
  default: "bg-primary-100 text-primary-800",
  success: "bg-primary-200 text-primary-800",
  warning: "bg-amber-100 text-amber-700",
  danger: "bg-rose-100 text-rose-700",
  info: "bg-primary-100 text-primary-800"
};

const Badge = ({ children, variant = "default" }: BadgeProps) => {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        variants[variant]
      )}
    >
      {children}
    </span>
  );
};

export default Badge;

