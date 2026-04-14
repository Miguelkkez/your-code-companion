import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, ShoppingBag, PlusCircle, UtensilsCrossed, X, Calculator, BarChart3, HardDrive } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { path: "/", label: "Painel", icon: LayoutDashboard },
  { path: "/novo-pedido", label: "Novo Pedido", icon: PlusCircle },
  { path: "/pedidos", label: "Pedidos", icon: ShoppingBag },
  { path: "/cardapio", label: "Cardápio", icon: UtensilsCrossed },
  { path: "/fechamento", label: "Caixa", icon: Calculator },
  { path: "/relatorios", label: "Relatórios", icon: BarChart3 },
  { path: "/backup", label: "Backup", icon: HardDrive },
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden animate-fade-in" onClick={onClose} />
      )}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-64 bg-sidebar text-sidebar-foreground flex flex-col transition-transform duration-300 ease-out lg:translate-x-0 lg:static lg:z-auto",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between p-6 pb-8">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="text-primary-foreground font-heading font-bold text-xl">🍗</span>
            </div>
            <div>
              <h1 className="font-heading font-bold text-base leading-tight tracking-tight">El Pote</h1>
              <p className="text-[11px] opacity-40 font-medium tracking-wide">Frango Frito</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden opacity-60 hover:opacity-100 transition-opacity">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item, i) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                style={{ animationDelay: `${i * 40}ms` }}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 animate-slide-in-left",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-primary/20"
                    : "opacity-60 hover:opacity-100 hover:bg-sidebar-accent"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 m-3 mb-6 rounded-xl bg-sidebar-accent/60">
          <p className="text-xs opacity-40 font-medium">El Pote Frango Frito</p>
          <p className="text-[10px] opacity-25 mt-0.5">© 2026 • v1.0</p>
        </div>
      </aside>
    </>
  );
}
