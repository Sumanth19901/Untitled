import { cn } from "../../lib/utils";

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function TextInput({ label, error, className, ...props }: TextInputProps) {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="text-xs text-muted-foreground tracking-wide">
          {label}
        </label>
      )}
      <input
        className={cn(
          "h-11 px-4 py-2.5 bg-input-background border-2 border-border rounded-sm",
          "text-foreground placeholder:text-muted-foreground",
          "transition-all duration-200",
          "focus:outline-none focus:border-primary-cyan focus:shadow-[0_0_12px_rgba(0,216,255,0.3)]",
          "hover:border-primary-cyan/50",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          error && "border-status-danger focus:border-status-danger focus:shadow-[0_0_12px_rgba(255,59,59,0.3)]",
          className
        )}
        {...props}
      />
      {error && (
        <span className="text-xs text-status-danger">{error}</span>
      )}
    </div>
  );
}
