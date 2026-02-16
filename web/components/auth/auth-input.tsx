import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

interface AuthInputProps {
  id: string;
  label: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  icon: LucideIcon;
  required?: boolean;
  minLength?: number;
  error?: string;
  helperText?: ReactNode;
  className?: string;
  inputDir?: "ltr" | "rtl";
  iconPosition?: "left" | "right";
  disabled?: boolean;
  autoComplete?: string;
  name?: string;
  labelAccessory?: ReactNode;
}

export function AuthInput({
  id,
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  icon: Icon,
  required = false,
  minLength,
  error,
  helperText,
  className = "",
  inputDir,
  iconPosition = "left",
  disabled = false,
  autoComplete,
  name,
  labelAccessory,
}: AuthInputProps) {
  const iconClass =
    iconPosition === "right"
      ? "right-3"
      : "left-3";
  const inputPadding =
    iconPosition === "right"
      ? "pr-10"
      : "pl-10";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className="text-zinc-300 pr-1 block text-right">
          {label}
        </Label>
        {labelAccessory}
      </div>
      <div className="relative group">
        <Icon
          className={`absolute ${iconClass} top-3.5 h-4 w-4 text-zinc-500 transition-colors group-hover:text-blue-500`}
        />
        <Input
          id={id}
          name={name}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          className={`${inputPadding} h-11 bg-zinc-900/50 border-zinc-800 text-right text-white placeholder:text-zinc-600 focus-visible:ring-blue-600 transition-colors ${error ? "border-red-500/50 focus-visible:ring-red-500" : ""} ${className}`}
          required={required}
          minLength={minLength}
          dir={inputDir}
          disabled={disabled}
          autoComplete={autoComplete}
        />
      </div>
      {helperText && (
        <div className="text-xs text-zinc-500 pr-1">
          {helperText}
        </div>
      )}
      {error && (
        <div className="text-xs text-red-400 pr-1">
          {error}
        </div>
      )}
    </div>
  );
}
