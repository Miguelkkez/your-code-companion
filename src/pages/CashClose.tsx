import { useState, useEffect } from "react";
import { DollarSign, CreditCard, Smartphone, Banknote, TrendingUp, Calculator } from "lucide-react";
import { Input } from "@/components/ui/input";
import { orderStore, type Order } from "@/lib/store";

export default function CashClose() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialCash, setInitialCash] = useState("");

  useEffect(() => {
    setOrders(orderStore.list("-created_date", 500));
    setLoading(false);
  }, []);

  const today = new Date().toDateString();
  const todayOrders = orders.filter((o) => new Date(o.created_date).toDateString() === today && o.status !== "cancelled");

  const byPayment = todayOrders.reduce((acc, o) => {
    const method = o.payment_method || "Não informado";
    acc[method] = (acc[method] || 0) + (o.total || 0);
    return acc;
  }, {} as Record<string, number>);

  const totalSales = todayOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  const cashSales = byPayment["Dinheiro"] || 0;
  const initial = parseFloat(initialCash) || 0;
  const cashInRegister = initial + cashSales;

  const paymentIcons: Record<string, { icon: typeof DollarSign; color: string; bg: string }> = {
    Dinheiro: { icon: Banknote, color: "text-emerald-600", bg: "bg-emerald-500/10" },
    "Cartão": { icon: CreditCard, color: "text-blue-600", bg: "bg-blue-500/10" },
    Pix: { icon: Smartphone, color: "text-violet-600", bg: "bg-violet-500/10" },
    "Não informado": { icon: DollarSign, color: "text-muted-foreground", bg: "bg-muted" },
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">Fechamento de Caixa</h1>
        <p className="text-muted-foreground mt-1">
          {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
      </div>

      <div className="bg-card rounded-2xl border border-border p-6">
        <label className="text-sm font-medium text-foreground flex items-center gap-2 mb-3">
          <Banknote className="h-4 w-4 text-primary" /> Saldo Inicial em Dinheiro (Fundo de Caixa)
        </label>
        <div className="flex items-center gap-3">
          <span className="text-muted-foreground font-medium">R$</span>
          <Input type="number" step="0.01" placeholder="0,00" value={initialCash} onChange={(e) => setInitialCash(e.target.value)} className="text-lg font-heading font-bold max-w-48" />
        </div>
      </div>

      <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
        <h2 className="font-heading font-semibold text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" /> Vendas por Forma de Pagamento
        </h2>
        {Object.keys(byPayment).length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-4">Nenhuma venda hoje</p>
        ) : (
          <div className="space-y-3">
            {Object.entries(byPayment).map(([method, amount]) => {
              const config = paymentIcons[method] || paymentIcons["Não informado"];
              const Icon = config.icon;
              const count = todayOrders.filter((o) => (o.payment_method || "Não informado") === method).length;
              return (
                <div key={method} className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 border border-border">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-xl ${config.bg} flex items-center justify-center`}>
                      <Icon className={`h-5 w-5 ${config.color}`} />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{method}</p>
                      <p className="text-xs text-muted-foreground">{count} pedido{count !== 1 ? "s" : ""}</p>
                    </div>
                  </div>
                  <span className="font-heading font-bold text-lg text-foreground">R$ {amount.toFixed(2)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
        <h2 className="font-heading font-semibold text-lg flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" /> Resumo do Caixa
        </h2>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Fundo de caixa (inicial)</span>
            <span className="font-medium">R$ {initial.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Vendas em dinheiro</span>
            <span className="font-medium text-emerald-600">+ R$ {cashSales.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center pt-3 border-t border-border">
            <span className="font-heading font-semibold">Dinheiro em caixa</span>
            <span className="font-heading font-bold text-xl text-emerald-600">R$ {cashInRegister.toFixed(2)}</span>
          </div>
        </div>
        <div className="h-px bg-border" />
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total de pedidos hoje</span>
            <span className="font-medium">{todayOrders.length}</span>
          </div>
          <div className="flex justify-between items-center pt-1">
            <span className="font-heading font-semibold">Total de vendas</span>
            <span className="font-heading font-bold text-xl text-primary">R$ {totalSales.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
