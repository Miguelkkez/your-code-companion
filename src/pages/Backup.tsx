import { useState } from "react";
import { Download, Upload, FolderOpen, CheckCircle2, AlertTriangle } from "lucide-react";
import { menuItemStore, orderStore, cashRegisterStore } from "@/lib/store";

export default function Backup() {
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const exportData = () => {
    try {
      const data = {
        version: 1,
        exported_at: new Date().toISOString(),
        menu_items: menuItemStore.list(),
        orders: orderStore.list(),
        cash_registers: cashRegisterStore.list(),
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `lanchonete-backup-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setStatus({ type: "success", message: "Backup exportado com sucesso! Salve o arquivo em uma pasta segura no seu computador." });
    } catch (e) {
      setStatus({ type: "error", message: "Erro ao exportar backup." });
    }
  };

  const importData = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          if (!data.menu_items || !data.orders || !data.cash_registers) {
            setStatus({ type: "error", message: "Arquivo de backup inválido." });
            return;
          }
          // Restore all data
          localStorage.setItem("menu_items", JSON.stringify(data.menu_items));
          localStorage.setItem("orders", JSON.stringify(data.orders));
          localStorage.setItem("cash_registers", JSON.stringify(data.cash_registers));
          setStatus({ type: "success", message: `Backup restaurado! ${data.menu_items.length} itens, ${data.orders.length} pedidos, ${data.cash_registers.length} caixas. Recarregando...` });
          setTimeout(() => window.location.reload(), 2000);
        } catch {
          setStatus({ type: "error", message: "Erro ao ler o arquivo de backup." });
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const isElectron = typeof window !== "undefined" && !!window.electronStore;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">Backup de Dados</h1>
        <p className="text-muted-foreground mt-1">Exporte e importe seus dados para manter tudo salvo no seu computador</p>
      </div>

      {/* Storage info */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center gap-3 mb-3">
          <FolderOpen className="h-5 w-5 text-primary" />
          <h2 className="font-heading font-semibold text-foreground">Onde seus dados estão salvos</h2>
        </div>
        {isElectron ? (
          <p className="text-sm text-muted-foreground">
            Seus dados estão salvos em <strong>arquivos no seu computador</strong> na pasta de dados do aplicativo.
            Eles não serão perdidos ao fechar o programa.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Seus dados estão salvos no <strong>armazenamento local do navegador</strong> (localStorage).
            Se você limpar os dados do navegador, eles serão perdidos.
            <br />
            <strong className="text-amber-500">Recomendação:</strong> faça backups regulares usando o botão abaixo!
          </p>
        )}
      </div>

      {/* Status message */}
      {status && (
        <div className={`flex items-center gap-3 p-4 rounded-xl border ${status.type === "success" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400"}`}>
          {status.type === "success" ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <AlertTriangle className="h-5 w-5 shrink-0" />}
          <p className="text-sm">{status.message}</p>
        </div>
      )}

      {/* Export */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center gap-3 mb-2">
          <Download className="h-5 w-5 text-emerald-400" />
          <h2 className="font-heading font-semibold text-foreground">Exportar Backup</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Baixa um arquivo .json com todos os seus dados: cardápio, pedidos e caixas.
          Salve em uma pasta no seu computador.
        </p>
        <button
          onClick={exportData}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl font-medium transition-colors"
        >
          <Download className="h-4 w-4" />
          Exportar Dados
        </button>
      </div>

      {/* Import */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center gap-3 mb-2">
          <Upload className="h-5 w-5 text-blue-400" />
          <h2 className="font-heading font-semibold text-foreground">Importar Backup</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Restaura seus dados a partir de um arquivo de backup .json salvo anteriormente.
          <strong className="text-amber-500"> Atenção:</strong> isso substituirá todos os dados atuais.
        </p>
        <button
          onClick={importData}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-medium transition-colors"
        >
          <Upload className="h-4 w-4" />
          Importar Dados
        </button>
      </div>
    </div>
  );
}
