import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import { Menu } from "lucide-react";

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center gap-4 px-6 py-4 lg:hidden border-b border-border bg-card/80 backdrop-blur-md">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-muted transition-colors duration-200"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xl">🍗</span>
            <span className="font-heading font-bold text-lg">El Pote</span>
            <span className="text-xs text-muted-foreground font-medium">Frango Frito</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="animate-fade-in-up">
            <Outlet />
          </div>
        </main>
      </div>
      <div className="fixed bottom-2 left-2 z-50 pointer-events-none select-none text-[10px] font-medium text-muted-foreground/60 tracking-wide">
        Made by Miguel · v1
      </div>
    </div>
  );
}
