import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Plus, Minus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";
import { orderStore, menuItemStore, type Order, type OrderItem, type MenuItem } from "@/lib/store";

const PAYMENT_METHODS = [
  { key: "Dinheiro", emoji: "💵" },
  { key: "Cartão", emoji: "💳" },
  { key: "Pix", emoji: "📱" },
  { key: "QR Code Pix", emoji: "📲" },
  { key: "iFood", emoji: "🛵" },
  { key: "99", emoji: "🚗" },
];

interface EditOrderDialogProps {
  order: Order;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export default function EditOrderDialog({ order, open, onOpenChange, onUpdate }: EditOrderDialogProps) {
  const [items, setItems] = useState<OrderItem[]>([...order.items]);
  const [paymentValues, setPaymentValues] = useState<Record<string, string>>(() => {
    const vals: Record<string, string> = {};
    if (order.payment_details) {
      Object.entries(order.payment_details).forEach(([k, v]) => {
        if (v > 0) vals[k] = v.toString();
      });
    }
    return vals;
  });
  const [step, setStep] = useState<"items" | "payment">("items");

  const availableItems = menuItemStore.filter({ available: true });

  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const totalCost = items.reduce((s, i) => s + (i.cost_price || 0) * i.quantity, 0);
  const totalPaid = Object.values(paymentValues).reduce((s, v) => s + (parseFloat(v) || 0), 0);
  const diff = totalPaid - total;

  const updateQty = (menuItemId: string, delta: number) => {
    setItems(prev => prev.map(i => i.menu_item_id === menuItemId ? { ...i, quantity: Math.max(0, i.quantity + delta) } : i).filter(i => i.quantity > 0));
  };

  const removeItem = (menuItemId: string) => {
    setItems(prev => prev.filter(i => i.menu_item_id !== menuItemId));
  };

  const addItem = (menuItem: MenuItem) => {
    setItems(prev => {
      const existing = prev.find(i => i.menu_item_id === menuItem.id);
      if (existing) return prev.map(i => i.menu_item_id === menuItem.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { menu_item_id: menuItem.id, name: menuItem.name, price: menuItem.price, cost_price: menuItem.cost_price, quantity: 1 }];
    });
  };

  const handleSave = () => {
    if (items.length === 0) {
      toast({ title: "Erro", description: "Adicione pelo menos um item.", variant: "destructive" });
      return;
    }
    if (totalPaid < total) {
      toast({ title: "Valor insuficiente", description: `Faltam R$ ${(total - totalPaid).toFixed(2)}`, variant: "destructive" });
      return;
    }

    const usedMethods = PAYMENT_METHODS.filter(m => parseFloat(paymentValues[m.key] || "0") > 0).map(m => m.key);
    if (usedMethods.length === 0) {
      toast({ title: "Erro", description: "Informe pelo menos uma forma de pagamento.", variant: "destructive" });
      return;
    }

    const paymentDetails: Record<string, number> = {};
    usedMethods.forEach(m => { paymentDetails[m] = parseFloat(paymentValues[m] || "0"); });

    orderStore.update(order.id, {
      items,
      total,
      total_cost: totalCost,
      payment_method: usedMethods.join(", "),
      payment_details: paymentDetails,
      change_amount: diff > 0 ? diff : 0,
    });

    toast({ title: "Pedido atualizado!", description: `Pedido #${order.order_number} editado com sucesso.` });
    onOpenChange(false);
    onUpdate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">Editar Pedido #{order.order_number}</DialogTitle>
          <DialogDescription>Edite os itens e a forma de pagamento do pedido.</DialogDescription>
        </DialogHeader>

        {/* Step tabs */}
        <div className="flex gap-2 mb-2">
          <button onClick={() => setStep("items")} className={cn("flex-1 py-2 rounded-lg text-sm font-medium transition-colors", step === "items" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground")}>
            Itens
          </button>
          <button onClick={() => setStep("payment")} className={cn("flex-1 py-2 rounded-lg text-sm font-medium transition-colors", step === "payment" ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground")}>
            Pagamento
          </button>
        </div>

        {step === "items" && (
          <div className="space-y-3">
            {/* Current items */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Itens do pedido:</p>
              {items.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum item</p>
              ) : items.map(item => (
                <div key={item.menu_item_id} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-secondary/50">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">R$ {item.price.toFixed(2)} × {item.quantity}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => updateQty(item.menu_item_id, -1)} className="p-1 rounded-md hover:bg-muted"><Minus className="h-3 w-3" /></button>
                    <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                    <button onClick={() => updateQty(item.menu_item_id, 1)} className="p-1 rounded-md hover:bg-muted"><Plus className="h-3 w-3" /></button>
                    <button onClick={() => removeItem(item.menu_item_id)} className="p-1 rounded-md text-destructive hover:bg-destructive/10 ml-1"><Trash2 className="h-3 w-3" /></button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add items */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Adicionar item:</p>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {availableItems.filter(ai => !items.find(i => i.menu_item_id === ai.id)).map(ai => (
                  <button key={ai.id} onClick={() => addItem(ai)} className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-secondary/50 text-sm transition-colors">
                    <span>{ai.name}</span>
                    <span className="text-primary font-medium">R$ {ai.price.toFixed(2)}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-border pt-3 flex justify-between">
              <span className="font-heading font-bold">Total</span>
              <span className="font-heading font-bold text-primary">R$ {total.toFixed(2)}</span>
            </div>
            <button onClick={() => setStep("payment")} className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl font-heading font-semibold hover:opacity-90 transition-opacity">
              Próximo: Pagamento →
            </button>
          </div>
        )}

        {step === "payment" && (
          <div className="space-y-3">
            <div className="text-center py-1">
              <p className="text-sm text-muted-foreground">Total do pedido</p>
              <p className="text-2xl font-heading font-bold text-primary">R$ {total.toFixed(2)}</p>
            </div>
            <div className="space-y-3 max-h-[35vh] overflow-y-auto">
              {PAYMENT_METHODS.map(method => (
                <div key={method.key} className="flex items-center gap-3">
                  <span className="text-xl w-8 text-center">{method.emoji}</span>
                  <label className="text-sm font-medium min-w-[90px]">{method.key}</label>
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">R$</span>
                    <Input type="number" min="0" step="0.01" placeholder="0,00" value={paymentValues[method.key] || ""} onChange={(e) => setPaymentValues(prev => ({ ...prev, [method.key]: e.target.value }))} className="pl-9 text-right" />
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-border pt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total informado:</span>
                <span className="font-medium">R$ {totalPaid.toFixed(2)}</span>
              </div>
              <div className={cn("flex justify-between text-sm font-bold rounded-lg p-2 -mx-2", diff === 0 ? "text-primary bg-primary/10" : diff > 0 ? "text-accent-foreground bg-accent" : "text-destructive bg-destructive/10")}>
                <span>{diff > 0 ? "🔄 Troco:" : diff < 0 ? "⚠️ Faltam:" : "✅ Valor exato"}</span>
                {diff !== 0 && <span>R$ {Math.abs(diff).toFixed(2)}</span>}
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep("items")} className="flex-1 py-2.5 rounded-xl border border-border font-medium hover:bg-muted transition-colors">
                ← Itens
              </button>
              <button onClick={handleSave} disabled={totalPaid < total || items.length === 0} className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-heading font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
                Salvar
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
