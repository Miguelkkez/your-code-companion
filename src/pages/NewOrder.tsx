import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "@/components/ui/use-toast";
import { Plus, Minus, Trash2, ShoppingBag, ArrowLeft, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { menuItemStore, orderStore, cashRegisterStore, type MenuItem, type OrderItem } from "@/lib/store";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { printReceipt } from "@/components/orders/ReceiptPrint";

const categoryEmojis: Record<string, string> = {
  Lanches: "🍔", Bebidas: "🥤", Porções: "🍟", Doces: "🍰", Combos: "🎉",
};

const PAYMENT_METHODS = [
  { key: "Dinheiro", emoji: "💵" },
  { key: "Cartão", emoji: "💳" },
  { key: "Pix", emoji: "📱" },
  { key: "QR Code Pix", emoji: "📲" },
  { key: "iFood", emoji: "🛵" },
  { key: "99", emoji: "🚗" },
];

export default function NewOrder() {
  const navigate = useNavigate();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentValues, setPaymentValues] = useState<Record<string, string>>({});
  const [printCoupon, setPrintCoupon] = useState(false);

  useEffect(() => {
    setMenuItems(menuItemStore.filter({ available: true }));
    setLoading(false);
  }, []);

  const categories = ["all", ...new Set(menuItems.map((i) => i.category))];

  const filteredItems = menuItems.filter((i) => {
    if (activeCategory !== "all" && i.category !== activeCategory) return false;
    if (searchQuery && !i.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const addToCart = (item: MenuItem) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.menu_item_id === item.id);
      if (existing) return prev.map((c) => c.menu_item_id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { menu_item_id: item.id, name: item.name, price: item.price, cost_price: item.cost_price, quantity: 1 }];
    });
  };

  const updateQuantity = (menuItemId: string, delta: number) => {
    setCart((prev) => prev.map((c) => c.menu_item_id === menuItemId ? { ...c, quantity: Math.max(0, c.quantity + delta) } : c).filter((c) => c.quantity > 0));
  };

  const removeFromCart = (menuItemId: string) => {
    setCart((prev) => prev.filter((c) => c.menu_item_id !== menuItemId));
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalCost = cart.reduce((sum, item) => sum + (item.cost_price || 0) * item.quantity, 0);

  const totalPaid = Object.values(paymentValues).reduce((sum, v) => sum + (parseFloat(v) || 0), 0);
  const diff = totalPaid - total;

  const handleOpenPayment = () => {
    if (cart.length === 0) {
      toast({ title: "Erro", description: "Adicione pelo menos um item", variant: "destructive" });
      return;
    }
    setPaymentValues({});
    setShowPaymentDialog(true);
  };

  const handleConfirmPayment = () => {
    if (totalPaid < total) {
      toast({ title: "Valor insuficiente", description: `Faltam R$ ${(total - totalPaid).toFixed(2)} para completar o pagamento.`, variant: "destructive" });
      return;
    }

    const usedMethods = PAYMENT_METHODS
      .filter((m) => parseFloat(paymentValues[m.key] || "0") > 0)
      .map((m) => m.key);

    if (usedMethods.length === 0) {
      toast({ title: "Erro", description: "Informe pelo menos uma forma de pagamento.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    // Order # resets every cash register: count orders created since the
    // current open register was opened (excluding cancelled). Using the
    // opened_at timestamp avoids issues when the register spans midnight UTC,
    // which previously caused the # to reset mid-shift and overwrite earlier
    // orders.
    // Order # resets every cash register. Only count orders that belong to
    // the currently open register: created after it was opened AND not yet
    // archived (archived = belongs to a previous, closed register).
    const openReg = cashRegisterStore.getOpen();
    let nextNumber = 1;
    if (openReg) {
      const openedAt = new Date(openReg.opened_at).getTime();
      const regOrders = orderStore
        .list("-created_date", 5000)
        .filter(
          (o) =>
            !o.archived &&
            new Date(o.created_date).getTime() >= openedAt &&
            o.status !== "cancelled"
        );
      const maxInReg = regOrders.reduce((m, o) => Math.max(m, o.order_number || 0), 0);
      nextNumber = maxInReg + 1;
    } else {
      // No open register: start from 1 (no reference register exists)
      nextNumber = 1;
    }

    const paymentDetails: Record<string, number> = {};
    usedMethods.forEach((m) => { paymentDetails[m] = parseFloat(paymentValues[m] || "0"); });

    const newOrder = orderStore.create({
      customer_name: "-",
      items: cart,
      total,
      total_cost: totalCost,
      status: "pending",
      order_number: nextNumber,
      payment_method: usedMethods.join(", "),
      payment_details: paymentDetails,
      change_amount: diff > 0 ? diff : 0,
    });

    if (printCoupon) {
      printReceipt(newOrder);
    }

    toast({ title: "Pedido criado!", description: `Pedido #${nextNumber} criado com sucesso!${diff > 0 ? ` Troco: R$ ${diff.toFixed(2)}` : ""}` });
    setShowPaymentDialog(false);
    navigate("/pedidos");
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/" className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </Link>
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Novo Pedido</h1>
          <p className="text-muted-foreground mt-1">Selecione os itens do cardápio</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Buscar item..." className="pl-10" />
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map((cat) => (
              <button key={cat} onClick={() => setActiveCategory(cat)} className={cn(
                "px-4 py-2 rounded-xl text-sm font-medium transition-all",
                activeCategory === cat ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground"
              )}>
                {cat === "all" ? "Todos" : `${categoryEmojis[cat] || ""} ${cat}`}
              </button>
            ))}
          </div>

          {filteredItems.length === 0 ? (
            <div className="bg-card rounded-2xl border border-border p-12 text-center">
              <p className="text-muted-foreground">Nenhum item cadastrado no cardápio</p>
              <Link to="/cardapio" className="text-primary text-sm font-medium hover:underline mt-2 inline-block">Cadastrar itens</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredItems.map((item) => {
                const inCart = cart.find((c) => c.menu_item_id === item.id);
                return (
                  <button key={item.id} onClick={() => addToCart(item)} className={cn(
                    "bg-card rounded-xl border p-4 text-left transition-all duration-200 hover:shadow-md",
                    inCart ? "border-primary shadow-sm" : "border-border"
                  )}>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{categoryEmojis[item.category] || "🍽️"}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{item.name}</p>
                        <p className="text-sm text-primary font-heading font-bold">R$ {item.price?.toFixed(2)}</p>
                      </div>
                      {inCart && (
                        <span className="bg-primary text-primary-foreground text-xs font-bold h-6 w-6 rounded-full flex items-center justify-center">{inCart.quantity}</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-card rounded-2xl border border-border p-5 sticky top-4 space-y-4">
            <h2 className="font-heading font-bold text-lg flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-primary" /> Resumo do Pedido
            </h2>
            <div className="border-t border-border pt-3 space-y-2">
              {cart.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Carrinho vazio</p>
              ) : cart.map((item) => (
                <div key={item.menu_item_id} className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">R$ {item.price.toFixed(2)} × {item.quantity}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => updateQuantity(item.menu_item_id, -1)} className="p-1 rounded-md hover:bg-muted"><Minus className="h-3 w-3" /></button>
                    <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.menu_item_id, 1)} className="p-1 rounded-md hover:bg-muted"><Plus className="h-3 w-3" /></button>
                    <button onClick={() => removeFromCart(item.menu_item_id)} className="p-1 rounded-md text-destructive hover:bg-destructive/10 ml-1"><Trash2 className="h-3 w-3" /></button>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-border pt-3 flex items-center justify-between">
              <span className="font-heading font-bold text-lg">Total</span>
              <span className="font-heading font-bold text-xl text-primary">R$ {total.toFixed(2)}</span>
            </div>
            <button onClick={handleOpenPayment} disabled={submitting || cart.length === 0} className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-heading font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg shadow-primary/20">
              Finalizar Pedido
            </button>
          </div>
        </div>
      </div>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl">Pagamento</DialogTitle>
            <DialogDescription>
              Informe o valor recebido em cada forma de pagamento.
            </DialogDescription>
          </DialogHeader>

          <div className="text-center py-2">
            <p className="text-sm text-muted-foreground">Total do pedido</p>
            <p className="text-2xl font-heading font-bold text-primary">R$ {total.toFixed(2)}</p>
          </div>

          <div className="space-y-3 max-h-[40vh] overflow-y-auto">
            {PAYMENT_METHODS.map((method) => (
              <div key={method.key} className="flex items-center gap-3">
                <span className="text-xl w-8 text-center">{method.emoji}</span>
                <label className="text-sm font-medium min-w-[90px]">{method.key}</label>
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">R$</span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0,00"
                    value={paymentValues[method.key] || ""}
                    onChange={(e) => setPaymentValues((prev) => ({ ...prev, [method.key]: e.target.value }))}
                    className="pl-9 text-right"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-border pt-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total informado:</span>
              <span className="font-medium">R$ {totalPaid.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total do pedido:</span>
              <span className="font-medium">R$ {total.toFixed(2)}</span>
            </div>
            <div className={cn(
              "flex justify-between text-sm font-bold rounded-lg p-2 -mx-2",
              diff === 0 ? "text-primary bg-primary/10" :
              diff > 0 ? "text-accent-foreground bg-accent" :
              "text-destructive bg-destructive/10"
            )}>
              <span>{diff > 0 ? "🔄 Troco:" : diff < 0 ? "⚠️ Faltam:" : "✅ Valor exato"}</span>
              {diff !== 0 && <span>R$ {Math.abs(diff).toFixed(2)}</span>}
            </div>
          </div>

          <div className="flex items-center gap-2 py-1">
            <Checkbox id="print-coupon" checked={printCoupon} onCheckedChange={(v) => setPrintCoupon(!!v)} />
            <label htmlFor="print-coupon" className="text-sm text-muted-foreground cursor-pointer">🖨️ Imprimir cupom não fiscal</label>
          </div>

          <button
            onClick={handleConfirmPayment}
            disabled={submitting || totalPaid < total}
            className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-heading font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg shadow-primary/20"
          >
            {submitting ? "Criando..." : "Confirmar Pagamento"}
          </button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
