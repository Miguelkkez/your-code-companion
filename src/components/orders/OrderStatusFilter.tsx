import { cn } from "@/lib/utils";
import { Clock, ChefHat, CheckCircle2, Truck, List } from "lucide-react";

const filters = [
  { value: "all", label: "Todos", icon: List },
  { value: "pending", label: "Pendentes", icon: Clock },
  { value: "preparing", label: "Preparando", icon: ChefHat },
  { value: "ready", label: "Prontos", icon: CheckCircle2 },
  { value: "delivered", label: "Entregues", icon: Truck },
];

interface OrderStatusFilterProps {
  value: string;
  onChange: (value: string) => void;
}

export default function OrderStatusFilter({ value, onChange }: OrderStatusFilterProps) {
  return (
    <div className="flex gap-2 flex-wrap">
      {filters.map((filter) => {
        const isActive = value === filter.value;
        return (
          <button
            key={filter.value}
            onClick={() => onChange(filter.value)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200",
              isActive
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-card text-muted-foreground border border-border hover:border-primary/30 hover:text-foreground"
            )}
          >
            <filter.icon className="h-4 w-4" />
            {filter.label}
          </button>
        );
      })}
    </div>
  );
}
