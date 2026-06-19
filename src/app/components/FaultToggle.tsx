import * as Switch from "@radix-ui/react-switch";
import { cn } from "../../lib/utils";

interface FaultToggleProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export function FaultToggle({
  checked = false,
  onCheckedChange,
  label,
  disabled = false,
  className,
}: FaultToggleProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Switch.Root
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        className={cn(
          "relative h-7 w-14 rounded-sm border-2 transition-all duration-200",
          "data-[state=checked]:bg-status-danger data-[state=checked]:border-status-danger data-[state=checked]:shadow-[0_0_16px_rgba(255,59,59,0.5)]",
          "data-[state=unchecked]:bg-muted data-[state=unchecked]:border-border",
          "disabled:opacity-50 disabled:cursor-not-allowed"
        )}
      >
        <Switch.Thumb
          className={cn(
            "block h-5 w-5 rounded-sm bg-white transition-transform duration-200",
            "data-[state=checked]:translate-x-[30px]",
            "data-[state=unchecked]:translate-x-[2px]",
            "translate-y-[2px]"
          )}
        />
      </Switch.Root>
      {label && (
        <label className="text-sm text-foreground select-none">
          {label}
        </label>
      )}
    </div>
  );
}
