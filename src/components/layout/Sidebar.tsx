import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, ShoppingBag, PlusCircle, UtensilsCrossed, X, Calculator, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/", label: "Painel", icon: LayoutDashboard },
  { path: "/novo-pedido", label: "Novo Pedido", icon: PlusCircle },
  { path: "/pedidos", label: "Pedidos", icon: ShoppingBag },
  { path: "/cardapio", label: "Cardápio", icon: UtensilsCrossed },
  { path: "/fechamento", label: "Caixa", icon: Calculator },
  { path: "/relatorios", label: "Relatórios", icon: BarChart3 },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const location = useLocation();

  return (
    <>
      {open && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-64 bg-sidebar text-sidebar-foreground flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between p-6 pb-8">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-heading font-bold text-lg">🍔</span>
            </div>
            <div>
              <h1 className="font-heading font-bold text-lg leading-tight">Lanchonete</h1>
              <p className="text-xs opacity-50">Gestor de Pedidos</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden opacity-60 hover:opacity-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg"
                    : "opacity-70 hover:opacity-100 hover:bg-sidebar-accent"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 m-3 mb-6 rounded-xl bg-sidebar-accent">
          <p className="text-xs opacity-50 font-medium">Versão 1.0</p>
          <p className="text-xs opacity-30 mt-1">© 2026 Lanchonete</p>
        </div>
      </aside>
    </>
  );
}
