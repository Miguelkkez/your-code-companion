import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  subtitle?: string;
  color?: "primary" | "green" | "blue" | "amber";
}

export default function StatCard({ icon: Icon, label, value, subtitle, color = "primary" }: StatCardProps) {
  return (
    <div className="bg-card rounded-2xl p-5 border border-border shadow-sm hover:shadow-md transition-shadow duration-300">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{label}</p>
          <p className="text-3xl font-heading font-bold mt-2 text-foreground">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        <div className={cn(
          "h-12 w-12 rounded-xl flex items-center justify-center",
          color === "primary" && "bg-primary/10 text-primary",
          color === "green" && "bg-emerald-500/10 text-emerald-600",
          color === "blue" && "bg-blue-500/10 text-blue-600",
          color === "amber" && "bg-amber-500/10 text-amber-600"
        )}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
