import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, DollarSign, Clock, CheckCircle2, PlusCircle, ArrowRight } from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import OrderCard from "@/components/orders/OrderCard";
import { orderStore, type Order } from "@/lib/store";

export default function Dashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const loadOrders = () => {
    setOrders(orderStore.list("-created_date", 50));
    setLoading(false);
  };

  useEffect(() => { loadOrders(); }, []);

  const today = new Date().toDateString();
  const todayOrders = orders.filter((o) => new Date(o.created_date).toDateString() === today);
  const activeOrders = orders.filter((o) => o.status === "pending" || o.status === "preparing");
  const todayRevenue = todayOrders.filter((o) => o.status !== "cancelled").reduce((sum, o) => sum + (o.total || 0), 0);
  const completedToday = todayOrders.filter((o) => o.status === "delivered").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between animate-fade-in-up">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Painel</h1>
          <p className="text-muted-foreground mt-1">Bem-vindo ao <strong>El Pote Frango Frito</strong></p>
        </div>
        <Link to="/novo-pedido" className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-3 rounded-xl font-medium hover:opacity-90 transition-all duration-200 shadow-lg shadow-primary/20 hover-lift">
          <PlusCircle className="h-5 w-5" />
          Novo Pedido
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={ShoppingBag} label="Pedidos Hoje" value={todayOrders.length} color="primary" delay={0} />
        <StatCard icon={DollarSign} label="Faturamento Hoje" value={`R$ ${todayRevenue.toFixed(2)}`} color="green" delay={80} />
        <StatCard icon={Clock} label="Pedidos Ativos" value={activeOrders.length} color="amber" delay={160} />
        <StatCard icon={CheckCircle2} label="Entregues Hoje" value={completedToday} color="blue" delay={240} />
      </div>

      <div className="animate-fade-in-up" style={{ animationDelay: "300ms" }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-heading font-semibold text-foreground">Pedidos Recentes</h2>
          <Link to="/pedidos" className="flex items-center gap-1 text-sm text-primary font-medium hover:underline transition-colors">
            Ver todos <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {activeOrders.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border p-12 text-center animate-scale-in">
            <p className="text-muted-foreground text-lg">Nenhum pedido ativo no momento</p>
            <Link to="/novo-pedido" className="inline-flex items-center gap-2 mt-4 text-primary font-medium hover:underline">
              <PlusCircle className="h-4 w-4" /> Criar novo pedido
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeOrders.slice(0, 6).map((order, i) => (
              <div key={order.id} className="animate-fade-in-up" style={{ animationDelay: `${350 + i * 60}ms` }}>
                <OrderCard order={order} onUpdate={loadOrders} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
