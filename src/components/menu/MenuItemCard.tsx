import { Pencil, Trash2 } from "lucide-react";
import type { MenuItem } from "@/lib/store";

const categoryEmojis: Record<string, string> = {
  Lanches: "🍔",
  Bebidas: "🥤",
  Porções: "🍟",
  Doces: "🍰",
  Combos: "🎉",
};

interface MenuItemCardProps {
  item: MenuItem;
  onEdit?: (item: MenuItem) => void;
  onDelete?: (item: MenuItem) => void;
}

export default function MenuItemCard({ item, onEdit, onDelete }: MenuItemCardProps) {
  return (
    <div className="bg-card rounded-2xl border border-border p-5 shadow-sm hover:shadow-md transition-all duration-300 group">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <div className="h-12 w-12 rounded-xl bg-accent flex items-center justify-center text-2xl shrink-0">
            {categoryEmojis[item.category] || "🍽️"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-heading font-semibold text-foreground truncate">{item.name}</h3>
              {item.available === false && (
                <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-full">
                  Indisponível
                </span>
              )}
            </div>
            {item.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
            )}
            <span className="inline-block text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-md mt-2">
              {item.category}
            </span>
          </div>
        </div>
        <p className="font-heading font-bold text-lg text-primary ml-3 whitespace-nowrap">
          R$ {item.price?.toFixed(2)}
        </p>
      </div>
      <div className="flex justify-end gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => onEdit?.(item)} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
          <Pencil className="h-4 w-4" />
        </button>
        <button onClick={() => onDelete?.(item)} className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
