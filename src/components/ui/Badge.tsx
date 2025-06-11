// src/components/ui/badge.tsx
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface BadgeProps {
  variant?: "default" | "destructive" | "success" | "warning";
  children: ReactNode;
  className?: string;
}

export const Badge = ({ variant = "default", children, className }: BadgeProps) => {
  const variantClasses = {
    default: "bg-gray-100 text-gray-800",
    destructive: "bg-red-100 text-red-800",
    success: "bg-green-100 text-green-800",
    warning: "bg-yellow-100 text-yellow-800",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium",
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
};