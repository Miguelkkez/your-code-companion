import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "@/components/layout/AppLayout";
import { PasswordGate } from "@/components/PasswordGate";
import Dashboard from "@/pages/Dashboard";
import NewOrder from "@/pages/NewOrder";
import Orders from "@/pages/Orders";
import Menu from "@/pages/Menu";
import CashClose from "@/pages/CashClose";
import CashHistory from "@/pages/CashHistory";
import Reports from "@/pages/Reports";
import Backup from "@/pages/Backup";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <PasswordGate>
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/novo-pedido" element={<NewOrder />} />
              <Route path="/pedidos" element={<Orders />} />
              <Route path="/cardapio" element={<Menu />} />
              <Route path="/fechamento" element={<CashClose />} />
              <Route path="/caixas-anteriores" element={<CashHistory />} />
              <Route path="/relatorios" element={<Reports />} />
              <Route path="/backup" element={<Backup />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </PasswordGate>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
