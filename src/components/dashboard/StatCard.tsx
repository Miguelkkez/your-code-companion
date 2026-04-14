import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  subtitle?: string;
  color?: "primary" | "green" | "blue" | "amber";
  delay?: number;
}

export default function StatCard({ icon: Icon, label, value, subtitle, color = "primary", delay = 0 }: StatCardProps) {
  return (
    <div
      className="bg-card rounded-2xl p-5 border border-border hover-lift animate-fade-in-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{label}</p>
          <p className="text-3xl font-heading font-bold mt-2 text-foreground">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        <div className={cn(
          "h-12 w-12 rounded-xl flex items-center justify-center transition-transform duration-300",
          color === "primary" && "bg-primary/10 text-primary",
          color === "green" && "bg-primary/10 text-primary",
          color === "blue" && "bg-primary/10 text-primary",
          color === "amber" && "bg-primary/10 text-primary"
        )}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
