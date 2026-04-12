import { Clock, ChefHat, CheckCircle2, Truck, XCircle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";
import { orderStore, type Order } from "@/lib/store";

const statusConfig: Record<string, {
  label: string;
  icon: typeof Clock;
  color: string;
  next: string | null;
  nextLabel: string | null;
}> = {
  pending: { label: "Pendente", icon: Clock, color: "bg-amber-500/10 text-amber-600 border-amber-500/20", next: "preparing", nextLabel: "Preparar" },
  preparing: { label: "Preparando", icon: ChefHat, color: "bg-blue-500/10 text-blue-600 border-blue-500/20", next: "ready", nextLabel: "Pronto" },
  ready: { label: "Pronto", icon: CheckCircle2, color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", next: "delivered", nextLabel: "Entregue" },
  delivered: { label: "Entregue", icon: Truck, color: "bg-muted text-muted-foreground border-border", next: null, nextLabel: null },
  cancelled: { label: "Cancelado", icon: XCircle, color: "bg-destructive/10 text-destructive border-destructive/20", next: null, nextLabel: null },
};

interface OrderCardProps {
  order: Order;
  onUpdate?: () => void;
}

export default function OrderCard({ order, onUpdate }: OrderCardProps) {
  const config = statusConfig[order.status] || statusConfig.pending;
  const StatusIcon = config.icon;

  const handleAdvance = () => {
    if (!config.next) return;
    orderStore.update(order.id, { status: config.next as Order["status"] });
    toast({ title: "Pedido atualizado!", description: `Status: ${statusConfig[config.next].label}` });
    onUpdate?.();
  };

  const handleCancel = () => {
    orderStore.update(order.id, { status: "cancelled" });
    toast({ title: "Pedido cancelado" });
    onUpdate?.();
  };

  return (
    <div className="bg-card rounded-2xl border border-border p-5 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="font-heading font-bold text-lg text-foreground">#{order.order_number || "—"}</span>
          <span className={cn("text-xs font-medium px-3 py-1 rounded-full border", config.color)}>
            <StatusIcon className="h-3 w-3 inline mr-1" />
            {config.label}
          </span>
        </div>
        {order.payment_method && (
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">{order.payment_method}</span>
        )}
      </div>

      <p className="font-medium text-foreground mb-1">{order.customer_name}</p>

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
        <div className="flex gap-2">
          {order.status !== "delivered" && order.status !== "cancelled" && (
            <button onClick={handleCancel} className="text-xs px-3 py-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors">
              Cancelar
            </button>
          )}
          {config.next && (
            <button onClick={handleAdvance} className="flex items-center gap-1 text-xs px-4 py-1.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity font-medium">
              {config.nextLabel}
              <ArrowRight className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
