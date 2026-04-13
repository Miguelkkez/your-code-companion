import { Trash2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { orderStore, type Order } from "@/lib/store";

interface OrderCardProps {
  order: Order;
  onUpdate?: () => void;
}

export default function OrderCard({ order, onUpdate }: OrderCardProps) {
  const handleCancel = () => {
    orderStore.update(order.id, { status: "cancelled" });
    toast({ title: "Pedido cancelado" });
    onUpdate?.();
  };

  const isCancelled = order.status === "cancelled";

  return (
    <div className={`bg-card rounded-2xl border border-border p-5 shadow-sm hover:shadow-md transition-all duration-300 ${isCancelled ? "opacity-50" : ""}`}>
      <div className="flex items-center justify-between mb-4">
        <span className="font-heading font-bold text-lg text-foreground">#{order.order_number || "—"}</span>
        {order.payment_method && (
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">{order.payment_method}</span>
        )}
      </div>

      <div className="space-y-1 my-3">
        {order.items?.map((item, i) => (
          <div key={i} className="flex justify-between text-sm">
            <span className="text-muted-foreground">{item.quantity}x {item.name}</span>
            <span className="text-foreground font-medium">R$ {(item.price * item.quantity).toFixed(2)}</span>
          </div>
        ))}
      </div>

      {order.notes && (
        <p className="text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2 mb-3 italic">📝 {order.notes}</p>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-border">
        <span className="font-heading font-bold text-lg text-foreground">R$ {order.total?.toFixed(2)}</span>
        {!isCancelled && (
          <button onClick={handleCancel} className="text-xs px-3 py-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors flex items-center gap-1">
            <Trash2 className="h-3 w-3" /> Cancelar
          </button>
        )}
        {isCancelled && (
          <span className="text-xs text-destructive font-medium">Cancelado</span>
        )}
      </div>

      <p className="text-xs text-muted-foreground mt-2">
        {new Date(order.created_date).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}
      </p>
    </div>
  );
}
