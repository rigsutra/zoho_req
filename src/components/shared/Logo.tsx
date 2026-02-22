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
      <div className="bg-primary rounded-md p-1.5 flex items-center justify-center">
        <Users className={cn("text-white", sizes.icon)} />
      </div>
      {showText && (
        <div>
          <h1 className={cn("font-bold text-foreground", sizes.text)}>
            People of Podtech
          </h1>
        </div>
      )}
    </div>
  );
}
