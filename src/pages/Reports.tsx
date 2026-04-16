import { useState, useEffect, useMemo } from "react";
import { BarChart3, TrendingUp, Award, Calendar, DollarSign } from "lucide-react";
import { orderStore, menuItemStore, type Order, type MenuItem } from "@/lib/store";
import { cn } from "@/lib/utils";

const dayNames = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const dayNamesShort = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export default function Reports() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"7" | "30" | "all">("30");

  useEffect(() => {
    setOrders(orderStore.list("-created_date", 9999));
    setMenuItems(menuItemStore.list());
    setLoading(false);
  }, []);

  const now = new Date();
  const filteredOrders = orders.filter((o) => {
    if (o.status === "cancelled") return false;
    if (period === "all") return true;
    const days = parseInt(period);
    const orderDate = new Date(o.created_date);
    const diff = (now.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24);
    return diff <= days;
  });

  // Build a cost lookup from menu items
  const costLookup: Record<string, number> = {};
  menuItems.forEach((m) => {
    if (m.cost_price != null) costLookup[m.name] = m.cost_price;
  });

  // Most sold products with cost/profit
  const productMap: Record<string, { name: string; quantity: number; revenue: number; cost: number; byDay: number[] }> = {};
  filteredOrders.forEach((o) => {
    const dayOfWeek = new Date(o.created_date).getDay();
    o.items?.forEach((item) => {
      if (!productMap[item.name]) {
        productMap[item.name] = { name: item.name, quantity: 0, revenue: 0, cost: 0, byDay: Array(7).fill(0) };
      }
      productMap[item.name].quantity += item.quantity;
      productMap[item.name].revenue += item.price * item.quantity;
      const itemCost = item.cost_price ?? costLookup[item.name] ?? 0;
      productMap[item.name].cost += itemCost * item.quantity;
      productMap[item.name].byDay[dayOfWeek] += item.quantity;
    });
  });

  const topProducts = Object.values(productMap).sort((a, b) => b.quantity - a.quantity);
  const maxQty = topProducts.length > 0 ? topProducts[0].quantity : 1;

  // Sales by day of week
  const salesByDay = Array(7).fill(0);
  const ordersByDay = Array(7).fill(0);
  filteredOrders.forEach((o) => {
    const d = new Date(o.created_date).getDay();
    salesByDay[d] += o.total || 0;
    ordersByDay[d] += 1;
  });
  const maxDaySales = Math.max(...salesByDay, 1);

  const totalRevenue = filteredOrders.reduce((s, o) => s + (o.total || 0), 0);
  const totalCost = filteredOrders.reduce((s, o) => {
    const orderCost = o.total_cost ?? o.items?.reduce((c, item) => {
      const itemCost = item.cost_price ?? costLookup[item.name] ?? 0;
      return c + itemCost * item.quantity;
    }, 0) ?? 0;
    return s + orderCost;
  }, 0);
  const totalProfit = totalRevenue - totalCost;
  const totalOrders = filteredOrders.length;
  const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  const bestDayIdx = salesByDay.indexOf(Math.max(...salesByDay));
  const bestDay = salesByDay[bestDayIdx] > 0 ? dayNames[bestDayIdx] : "—";

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Relatório de Vendas</h1>
          <p className="text-muted-foreground mt-1">Análise de desempenho e lucratividade</p>
        </div>
        <div className="flex gap-2">
          {(["7", "30", "all"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-medium transition-all",
                period === p
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {p === "7" ? "7 dias" : p === "30" ? "30 dias" : "Tudo"}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-card rounded-2xl p-5 border border-border">
          <p className="text-sm text-muted-foreground">Faturamento</p>
          <p className="text-2xl font-heading font-bold mt-1 text-foreground">R$ {totalRevenue.toFixed(2)}</p>
        </div>
        <div className="bg-card rounded-2xl p-5 border border-border">
          <p className="text-sm text-muted-foreground">Custo</p>
          <p className="text-2xl font-heading font-bold mt-1 text-destructive">R$ {totalCost.toFixed(2)}</p>
        </div>
        <div className="bg-card rounded-2xl p-5 border border-border">
          <p className="text-sm text-muted-foreground">Lucro</p>
          <p className={`text-2xl font-heading font-bold mt-1 ${totalProfit >= 0 ? "text-emerald-600" : "text-destructive"}`}>R$ {totalProfit.toFixed(2)}</p>
        </div>
        <div className="bg-card rounded-2xl p-5 border border-border">
          <p className="text-sm text-muted-foreground">Pedidos</p>
          <p className="text-2xl font-heading font-bold mt-1 text-foreground">{totalOrders}</p>
        </div>
        <div className="bg-card rounded-2xl p-5 border border-border">
          <p className="text-sm text-muted-foreground">Ticket Médio</p>
          <p className="text-2xl font-heading font-bold mt-1 text-foreground">R$ {avgTicket.toFixed(2)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
          <h2 className="font-heading font-semibold text-lg flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" /> Produtos Mais Vendidos
          </h2>
          {topProducts.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">Nenhuma venda no período</p>
          ) : (
            <div className="space-y-3">
              {topProducts.slice(0, 10).map((product, idx) => {
                const productProfit = product.revenue - product.cost;
                return (
                  <div key={product.name} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-xs font-bold h-6 w-6 rounded-full flex items-center justify-center",
                          idx === 0 ? "bg-amber-500/20 text-amber-600" :
                          idx === 1 ? "bg-muted text-muted-foreground" :
                          idx === 2 ? "bg-orange-500/20 text-orange-600" :
                          "bg-muted text-muted-foreground"
                        )}>
                          {idx + 1}
                        </span>
                        <span className="text-sm font-medium text-foreground">{product.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-heading font-bold text-foreground">{product.quantity}x</span>
                        <span className="text-xs text-muted-foreground ml-2">R$ {product.revenue.toFixed(2)}</span>
                        {product.cost > 0 && (
                          <span className="text-xs text-emerald-600 ml-1">(+R$ {productProfit.toFixed(2)})</span>
                        )}
                      </div>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500"
                        style={{ width: `${(product.quantity / maxQty) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sales by day of week */}
        <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
          <h2 className="font-heading font-semibold text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" /> Vendas por Dia da Semana
          </h2>
          <div className="flex items-end gap-3 h-48 pt-4">
            {salesByDay.map((amount, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-xs font-heading font-bold text-foreground">
                  {amount > 0 ? `R$${amount.toFixed(0)}` : ""}
                </span>
                <div className="w-full flex justify-center">
                  <div
                    className={cn(
                      "w-full max-w-10 rounded-t-lg transition-all duration-500",
                      i === bestDayIdx && amount > 0 ? "bg-primary" : "bg-primary/30"
                    )}
                    style={{ height: `${Math.max((amount / maxDaySales) * 140, amount > 0 ? 8 : 2)}px` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground font-medium">{dayNamesShort[i]}</span>
                <span className="text-xs text-muted-foreground">{ordersByDay[i]}p</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly Sales Chart */}
      {(() => {
        const monthlyData: Record<string, { revenue: number; cost: number; orders: number }> = {};
        filteredOrders.forEach((o) => {
          const d = new Date(o.created_date);
          const key = `${d.getFullYear()}-${String(d.getMonth()).padStart(2, "0")}`;
          if (!monthlyData[key]) monthlyData[key] = { revenue: 0, cost: 0, orders: 0 };
          monthlyData[key].revenue += o.total || 0;
          const orderCost = o.total_cost ?? o.items?.reduce((c, item) => {
            const itemCost = item.cost_price ?? costLookup[item.name] ?? 0;
            return c + itemCost * item.quantity;
          }, 0) ?? 0;
          monthlyData[key].cost += orderCost;
          monthlyData[key].orders += 1;
        });
        const sortedMonths = Object.keys(monthlyData).sort();
        const maxMonthRevenue = Math.max(...sortedMonths.map(k => monthlyData[k].revenue), 1);

        return sortedMonths.length > 0 ? (
          <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
            <h2 className="font-heading font-semibold text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" /> Relatório Mensal
            </h2>
            <div className="flex items-end gap-3 h-52 pt-4">
              {sortedMonths.map((key) => {
                const data = monthlyData[key];
                const [, monthIdx] = key.split("-");
                const profit = data.revenue - data.cost;
                const isMax = data.revenue === maxMonthRevenue;
                return (
                  <div key={key} className="flex-1 flex flex-col items-center gap-2 min-w-0">
                    <span className="text-xs font-heading font-bold text-foreground truncate">
                      R${data.revenue.toFixed(0)}
                    </span>
                    <div className="w-full flex justify-center">
                      <div
                        className={cn(
                          "w-full max-w-12 rounded-t-lg transition-all duration-500",
                          isMax ? "bg-primary" : "bg-primary/30"
                        )}
                        style={{ height: `${Math.max((data.revenue / maxMonthRevenue) * 160, data.revenue > 0 ? 8 : 2)}px` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground font-medium">{monthNames[parseInt(monthIdx)]}</span>
                    <span className="text-xs text-muted-foreground">{data.orders}p</span>
                    <span className={`text-xs font-bold ${profit >= 0 ? "text-emerald-600" : "text-destructive"}`}>
                      {profit >= 0 ? "+" : ""}R${profit.toFixed(0)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null;
      })()}

      {/* Product by day detail */}
      {topProducts.length > 0 && (
        <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
          <h2 className="font-heading font-semibold text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" /> Quando cada produto vende mais
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Produto</th>
                  {dayNamesShort.map((d) => (
                    <th key={d} className="text-center py-3 px-2 font-medium text-muted-foreground">{d}</th>
                  ))}
                  <th className="text-right py-3 px-2 font-medium text-muted-foreground">Total</th>
                  <th className="text-right py-3 px-2 font-medium text-muted-foreground">Lucro</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.slice(0, 8).map((product) => {
                  const maxDay = Math.max(...product.byDay);
                  const productProfit = product.revenue - product.cost;
                  return (
                    <tr key={product.name} className="border-b border-border/50">
                      <td className="py-3 px-2 font-medium text-foreground">{product.name}</td>
                      {product.byDay.map((qty, i) => (
                        <td key={i} className="text-center py-3 px-2">
                          {qty > 0 ? (
                            <span className={cn(
                              "inline-flex items-center justify-center h-7 w-7 rounded-lg text-xs font-bold",
                              qty === maxDay && qty > 0 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                            )}>
                              {qty}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/30">—</span>
                          )}
                        </td>
                      ))}
                      <td className="text-right py-3 px-2 font-heading font-bold text-foreground">{product.quantity}</td>
                      <td className={`text-right py-3 px-2 font-heading font-bold ${productProfit >= 0 ? "text-emerald-600" : "text-destructive"}`}>
                        R$ {productProfit.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
