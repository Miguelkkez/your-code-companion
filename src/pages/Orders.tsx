import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { PlusCircle, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import OrderCard from "@/components/orders/OrderCard";
import OrderStatusFilter from "@/components/orders/OrderStatusFilter";
import { orderStore, type Order } from "@/lib/store";

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const loadOrders = () => {
    setOrders(orderStore.list("-created_date", 100));
    setLoading(false);
  };

  useEffect(() => { loadOrders(); }, []);

  const filteredOrders = orders.filter((o) => {
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return o.customer_name?.toLowerCase().includes(q) || o.order_number?.toString().includes(q);
    }
    return true;
  });

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Pedidos</h1>
          <p className="text-muted-foreground mt-1">{orders.length} pedidos no total</p>
        </div>
        <Link to="/novo-pedido" className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-3 rounded-xl font-medium hover:opacity-90 transition-opacity shadow-lg shadow-primary/20">
          <PlusCircle className="h-5 w-5" /> Novo Pedido
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <OrderStatusFilter value={statusFilter} onChange={setStatusFilter} />
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar cliente ou #..." className="pl-10" />
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <p className="text-muted-foreground text-lg">Nenhum pedido encontrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map((order) => (
            <OrderCard key={order.id} order={order} onUpdate={loadOrders} />
          ))}
        </div>
      )}
    </div>
  );
}
