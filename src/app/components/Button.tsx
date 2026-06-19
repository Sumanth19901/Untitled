import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 border-2",
  {
    variants: {
      variant: {
        primary: "bg-primary-cyan text-bg-very-dark-navy border-primary-cyan hover:bg-primary-cyan/90 hover:shadow-[0_0_20px_rgba(0,216,255,0.4)]",
        secondary: "bg-transparent text-foreground border-border hover:bg-secondary hover:border-primary-cyan/50",
        danger: "bg-status-danger text-white border-status-danger hover:bg-status-danger/90 hover:shadow-[0_0_20px_rgba(255,59,59,0.4)]",
        caution: "bg-status-caution text-bg-very-dark-navy border-status-caution hover:bg-status-caution/90",
      },
      size: {
        default: "h-11 px-6 py-2.5",
        sm: "h-9 px-4 py-2",
        lg: "h-14 px-8 py-3.5",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}
