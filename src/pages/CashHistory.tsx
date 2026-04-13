import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Calendar, DollarSign, ChevronDown, ChevronUp, CreditCard, Banknote, Smartphone, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { cashRegisterStore, orderStore, type CashRegister, type Order } from "@/lib/store";

export default function CashHistory() {
  const [registers, setRegisters] = useState<CashRegister[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    setRegisters(cashRegisterStore.list().filter((r) => r.status === "closed"));
    setAllOrders(orderStore.list("-created_date", 9999));
  }, []);

  const getOrdersForRegister = (reg: CashRegister): Order[] => {
    if (reg.order_ids && reg.order_ids.length > 0) {
      return allOrders.filter((o) => reg.order_ids.includes(o.id));
    }
    return allOrders.filter(
      (o) => o.created_date.startsWith(reg.date) && o.status !== "cancelled"
    );
  };

  const paymentIcons: Record<string, { icon: typeof DollarSign; color: string; bg: string }> = {
    Dinheiro: { icon: Banknote, color: "text-emerald-600", bg: "bg-emerald-500/10" },
    "Cartão": { icon: CreditCard, color: "text-blue-600", bg: "bg-blue-500/10" },
    Pix: { icon: Smartphone, color: "text-violet-600", bg: "bg-violet-500/10" },
    "Não informado": { icon: DollarSign, color: "text-muted-foreground", bg: "bg-muted" },
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/fechamento" className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft className="h-5 w-5 text-muted-foreground" />
        </Link>
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Caixas Anteriores</h1>
          <p className="text-muted-foreground mt-1">{registers.length} caixa{registers.length !== 1 ? "s" : ""} fechado{registers.length !== 1 ? "s" : ""}</p>
        </div>
      </div>

      {registers.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <p className="text-muted-foreground text-lg">Nenhum caixa fechado ainda</p>
        </div>
      ) : (
        <div className="space-y-4">
          {registers.map((reg) => {
            const isExpanded = expandedId === reg.id;
            const regOrders = isExpanded ? getOrdersForRegister(reg) : [];
            const dateFormatted = new Date(reg.date + "T12:00:00").toLocaleDateString("pt-BR", {
              weekday: "long", day: "numeric", month: "long", year: "numeric",
            });

            const itemsSold: Record<string, { name: string; quantity: number; total: number; cost: number }> = {};
            regOrders.forEach((o) => {
              o.items?.forEach((item) => {
                if (!itemsSold[item.name]) {
                  itemsSold[item.name] = { name: item.name, quantity: 0, total: 0, cost: 0 };
                }
                itemsSold[item.name].quantity += item.quantity;
                itemsSold[item.name].total += item.price * item.quantity;
                itemsSold[item.name].cost += (item.cost_price || 0) * item.quantity;
              });
            });

            const profit = (reg.total_profit != null) ? reg.total_profit : (reg.total_sales - (reg.total_cost || 0));

            return (
              <div key={reg.id} className="bg-card rounded-2xl border border-border overflow-hidden">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : reg.id)}
                  className="w-full p-5 flex items-center justify-between text-left hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-heading font-semibold text-foreground capitalize">{dateFormatted}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(reg.opened_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        {reg.closed_at && ` — ${new Date(reg.closed_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-heading font-bold text-lg text-primary">R$ {reg.total_sales.toFixed(2)}</p>
                      <p className={`text-xs font-medium ${profit >= 0 ? "text-emerald-600" : "text-destructive"}`}>
                        Lucro: R$ {profit.toFixed(2)}
                      </p>
                    </div>
                    {isExpanded ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-border p-5 space-y-5">
                    <div>
                      <h3 className="font-heading font-semibold text-sm text-muted-foreground mb-3 uppercase tracking-wider">Forma de Pagamento</h3>
                      <div className="space-y-2">
                        {Object.entries(reg.by_payment || {}).map(([method, amount]) => {
                          const config = paymentIcons[method] || paymentIcons["Não informado"];
                          const Icon = config.icon;
                          return (
                            <div key={method} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                              <div className="flex items-center gap-2">
                                <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", config.bg)}>
                                  <Icon className={cn("h-4 w-4", config.color)} />
                                </div>
                                <span className="text-sm font-medium text-foreground">{method}</span>
                              </div>
                              <span className="font-heading font-bold text-foreground">R$ {amount.toFixed(2)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <h3 className="font-heading font-semibold text-sm text-muted-foreground mb-3 uppercase tracking-wider">Itens Vendidos</h3>
                      {Object.keys(itemsSold).length === 0 ? (
                        <p className="text-sm text-muted-foreground">Sem itens detalhados</p>
                      ) : (
                        <div className="space-y-1">
                          {Object.values(itemsSold)
                            .sort((a, b) => b.quantity - a.quantity)
                            .map((item) => (
                              <div key={item.name} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs bg-primary/10 text-primary font-bold h-6 w-6 rounded-full flex items-center justify-center">{item.quantity}</span>
                                  <span className="text-sm font-medium text-foreground">{item.name}</span>
                                </div>
                                <div className="text-right">
                                  <span className="text-sm font-heading font-bold text-foreground">R$ {item.total.toFixed(2)}</span>
                                  {item.cost > 0 && (
                                    <span className="text-xs text-emerald-600 ml-2">
                                      (lucro: R$ {(item.total - item.cost).toFixed(2)})
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>

                    <div className="bg-muted/50 rounded-xl p-4 space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Fundo de caixa</span>
                        <span className="font-medium">R$ {reg.initial_cash.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Vendas totais</span>
                        <span className="font-medium text-primary">R$ {reg.total_sales.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Custo total</span>
                        <span className="font-medium text-destructive">- R$ {(reg.total_cost || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm pt-2 border-t border-border">
                        <span className="font-heading font-semibold">Lucro</span>
                        <span className={`font-heading font-bold ${profit >= 0 ? "text-emerald-600" : "text-destructive"}`}>
                          R$ {profit.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
