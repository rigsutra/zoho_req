import { Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
}

export function Logo({ className, showText = true, size = "md" }: LogoProps) {
  const sizeClasses = {
    sm: { icon: "h-6 w-6", text: "text-base" },
    md: { icon: "h-8 w-8", text: "text-xl" },
    lg: { icon: "h-12 w-12", text: "text-3xl" },
  };

  const sizes = sizeClasses[size];

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg blur-sm opacity-75"></div>
        <div className="relative bg-gradient-to-br from-blue-600 to-purple-700 rounded-lg p-2">
          <Users className={cn("text-white", sizes.icon)} />
        </div>
      </div>
      {showText && (
        <div>
          <h1 className={cn("font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent", sizes.text)}>
            People of Podtech
          </h1>
        </div>
      )}
    </div>
  );
}
