import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { DollarSign, CreditCard, Smartphone, Banknote, TrendingUp, Calculator, Lock, Unlock, History } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import { orderStore, cashRegisterStore, type Order, type CashRegister } from "@/lib/store";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function CashClose() {
  const [openRegister, setOpenRegister] = useState<CashRegister | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialCash, setInitialCash] = useState("");
  const [confirmClose, setConfirmClose] = useState(false);

  const reload = () => {
    const reg = cashRegisterStore.getOpen();
    setOpenRegister(reg);
    setOrders(orderStore.list("-created_date", 500));
    setLoading(false);
  };

  useEffect(() => { reload(); }, []);

  const handleOpenRegister = () => {
    const initial = parseFloat(initialCash) || 0;
    if (initial < 0) {
      toast({ title: "Erro", description: "Valor inválido", variant: "destructive" });
      return;
    }
    cashRegisterStore.open(initial);
    setInitialCash("");
    toast({ title: "Caixa aberto!", description: `Fundo de caixa: R$ ${initial.toFixed(2)}` });
    reload();
  };

  const handleCloseRegister = () => {
    if (!openRegister) return;
    const regDate = openRegister.date;
    const regOrders = orders.filter(
      (o) => o.created_date.startsWith(regDate) && o.status !== "cancelled"
    );
    const totalSales = regOrders.reduce((s, o) => s + (o.total || 0), 0);
    const byPayment = regOrders.reduce((acc, o) => {
      const m = o.payment_method || "Não informado";
      acc[m] = (acc[m] || 0) + (o.total || 0);
      return acc;
    }, {} as Record<string, number>);

    cashRegisterStore.close(openRegister.id, {
      total_sales: totalSales,
      total_orders: regOrders.length,
      by_payment: byPayment,
      order_ids: regOrders.map((o) => o.id),
    });

    setConfirmClose(false);
    toast({ title: "Caixa fechado!", description: `Total de vendas: R$ ${totalSales.toFixed(2)}` });
    reload();
  };

  const paymentIcons: Record<string, { icon: typeof DollarSign; color: string; bg: string }> = {
    Dinheiro: { icon: Banknote, color: "text-emerald-600", bg: "bg-emerald-500/10" },
    "Cartão": { icon: CreditCard, color: "text-blue-600", bg: "bg-blue-500/10" },
    Pix: { icon: Smartphone, color: "text-violet-600", bg: "bg-violet-500/10" },
    "Não informado": { icon: DollarSign, color: "text-muted-foreground", bg: "bg-muted" },
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;
  }

  // No register open — show "Open register" screen
  if (!openRegister) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground">Caixa</h1>
            <p className="text-muted-foreground mt-1">
              {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
          <Link to="/caixas-anteriores" className="flex items-center gap-2 text-sm text-primary font-medium hover:underline">
            <History className="h-4 w-4" /> Caixas anteriores
          </Link>
        </div>

        <div className="bg-card rounded-2xl border border-border p-8 text-center space-y-6">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h2 className="font-heading font-bold text-xl text-foreground">Nenhum caixa aberto</h2>
            <p className="text-muted-foreground mt-1">Informe o fundo de caixa para começar o dia.</p>
          </div>
          <div className="max-w-xs mx-auto space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground font-medium">R$</span>
              <Input
                type="number"
                step="0.01"
                placeholder="0,00"
                value={initialCash}
                onChange={(e) => setInitialCash(e.target.value)}
                className="text-lg font-heading font-bold"
              />
            </div>
            <button
              onClick={handleOpenRegister}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-xl font-heading font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
            >
              <Unlock className="h-5 w-5" /> Abrir Caixa
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Register is open — show current day summary
  const regDate = openRegister.date;
  const todayOrders = orders.filter(
    (o) => o.created_date.startsWith(regDate) && o.status !== "cancelled"
  );

  const byPayment = todayOrders.reduce((acc, o) => {
    const m = o.payment_method || "Não informado";
    acc[m] = (acc[m] || 0) + (o.total || 0);
    return acc;
  }, {} as Record<string, number>);

  const totalSales = todayOrders.reduce((s, o) => s + (o.total || 0), 0);
  const cashSales = byPayment["Dinheiro"] || 0;
  const cashInRegister = openRegister.initial_cash + cashSales;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Caixa Aberto</h1>
          <p className="text-muted-foreground mt-1">
            {new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <Link to="/caixas-anteriores" className="flex items-center gap-2 text-sm text-primary font-medium hover:underline">
          <History className="h-4 w-4" /> Caixas anteriores
        </Link>
      </div>

      {/* Status badge */}
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center gap-3">
        <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-sm font-medium text-emerald-700">
          Caixa aberto desde {new Date(openRegister.opened_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} — Fundo: R$ {openRegister.initial_cash.toFixed(2)}
        </span>
      </div>

      {/* Sales by payment */}
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

      {/* Summary */}
      <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
        <h2 className="font-heading font-semibold text-lg flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" /> Resumo do Caixa
        </h2>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Fundo de caixa (inicial)</span>
            <span className="font-medium">R$ {openRegister.initial_cash.toFixed(2)}</span>
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

      {/* Close button */}
      <button
        onClick={() => setConfirmClose(true)}
        className="w-full flex items-center justify-center gap-2 bg-destructive text-destructive-foreground py-3 rounded-xl font-heading font-semibold hover:opacity-90 transition-opacity"
      >
        <Lock className="h-5 w-5" /> Fechar Caixa
      </button>

      {/* Confirm dialog */}
      <Dialog open={confirmClose} onOpenChange={setConfirmClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Fechar Caixa?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground text-sm">
              Tem certeza que deseja fechar o caixa do dia? Após fechar, os dados ficarão salvos em "Caixas Anteriores".
            </p>
            <div className="bg-secondary/50 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total de vendas</span>
                <span className="font-heading font-bold text-primary">R$ {totalSales.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Pedidos</span>
                <span className="font-medium">{todayOrders.length}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setConfirmClose(false)} className="flex-1 py-2.5 rounded-xl border border-border font-medium hover:bg-muted transition-colors">
                Cancelar
              </button>
              <button onClick={handleCloseRegister} className="flex-1 py-2.5 rounded-xl bg-destructive text-destructive-foreground font-heading font-semibold hover:opacity-90 transition-opacity">
                Confirmar Fechamento
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
