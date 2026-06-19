import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import { cn } from "../../lib/utils";

interface CheckboxProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export function Checkbox({
  checked = false,
  onCheckedChange,
  label,
  disabled = false,
  className,
}: CheckboxProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <CheckboxPrimitive.Root
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className={cn(
          "h-5 w-5 rounded-sm border-2 transition-all duration-200",
          "data-[state=checked]:bg-primary-cyan data-[state=checked]:border-primary-cyan",
          "data-[state=unchecked]:bg-transparent data-[state=unchecked]:border-border",
          "hover:border-primary-cyan/70",
          "disabled:opacity-50 disabled:cursor-not-allowed"
        )}
      >
        <CheckboxPrimitive.Indicator className="flex items-center justify-center text-bg-very-dark-navy">
          <Check className="h-4 w-4" strokeWidth={3} />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
      {label && (
        <label className="text-sm text-foreground select-none cursor-pointer">
          {label}
        </label>
      )}
    </div>
  );
}
