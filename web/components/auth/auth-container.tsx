import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

interface AuthContainerProps {
  icon: LucideIcon;
  title: string;
  description: string;
  children: ReactNode;
}

export function AuthContainer({
  icon: Icon,
  title,
  description,
  children,
}: AuthContainerProps) {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center p-4 bg-[#0a0a0a]" dir="rtl">
      <div className="w-full max-w-[440px] space-y-0 bg-[#0a0a0a] border border-white/10 shadow-2xl rounded-xl overflow-hidden">
        {/* Header Section */}
        <div className="flex flex-col items-center justify-center pt-8 pb-6 px-6 bg-gradient-to-b from-blue-500/10 to-transparent border-b border-white/5">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-600/20">
            <Icon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white text-center mb-2">{title}</h1>
          <p className="text-zinc-400 text-center text-sm">{description}</p>
        </div>

        {/* Content Section */}
        <div className="p-6 sm:p-8 space-y-6">
          {children}
        </div>
      </div>
    </div>
  );
}
