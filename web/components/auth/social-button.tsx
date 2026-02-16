import { Button } from "@/components/ui/button";
import { Loader2, LucideIcon } from "lucide-react";

interface SocialButtonProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  iconColor?: string;
  isLoading?: boolean;
  disabled?: boolean;
}

export function SocialButton({
  icon: Icon,
  label,
  onClick,
  iconColor,
  isLoading = false,
  disabled = false,
}: SocialButtonProps) {
  return (
    <Button
      type="button"
      variant="outline"
      className="w-full h-11 bg-white text-black border-0 flex items-center justify-center gap-2 font-medium transition-opacity hover:opacity-80 active:scale-[0.98]"
      onClick={onClick}
      disabled={disabled || isLoading}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Icon className={`h-4 w-4 ${iconColor || ""}`} />
      )}
      <span>{label}</span>
    </Button>
  );
}
