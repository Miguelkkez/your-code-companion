import { useState, useEffect } from "react";
import { Download, Upload, FolderOpen, CheckCircle2, AlertTriangle, Clock, Power, PowerOff } from "lucide-react";
import { menuItemStore, orderStore, cashRegisterStore } from "@/lib/store";
import {
  isFileSystemAccessSupported,
  isAutoBackupEnabled,
  getLastBackupTime,
  enableAutoBackup,
  disableAutoBackup,
  triggerManualAutoBackup,
} from "@/lib/autobackup";

export default function Backup() {
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [autoEnabled, setAutoEnabled] = useState(false);
  const [lastBackup, setLastBackup] = useState<string | null>(null);
  const fsSupported = isFileSystemAccessSupported();

  useEffect(() => {
    setAutoEnabled(isAutoBackupEnabled());
    setLastBackup(getLastBackupTime());
  }, []);

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
      setStatus({ type: "success", message: "Backup exportado com sucesso!" });
    } catch {
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
          localStorage.setItem("menu_items", JSON.stringify(data.menu_items));
          localStorage.setItem("orders", JSON.stringify(data.orders));
          localStorage.setItem("cash_registers", JSON.stringify(data.cash_registers));
          setStatus({ type: "success", message: `Backup restaurado! Recarregando...` });
          setTimeout(() => window.location.reload(), 2000);
        } catch {
          setStatus({ type: "error", message: "Erro ao ler o arquivo de backup." });
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleToggleAuto = async () => {
    if (autoEnabled) {
      disableAutoBackup();
      setAutoEnabled(false);
      setStatus({ type: "success", message: "Backup automático desativado." });
    } else {
      const ok = await enableAutoBackup();
      if (ok) {
        setAutoEnabled(true);
        setLastBackup(getLastBackupTime());
        setStatus({ type: "success", message: "Backup automático ativado! Seus dados serão salvos na pasta escolhida a cada hora." });
      } else {
        setStatus({ type: "error", message: "Não foi possível ativar. Verifique se seu navegador suporta (Chrome/Edge)." });
      }
    }
  };

  const handleForceBackup = async () => {
    const ok = await triggerManualAutoBackup();
    if (ok) {
      setLastBackup(getLastBackupTime());
      setStatus({ type: "success", message: "Backup salvo na pasta agora!" });
    } else {
      setStatus({ type: "error", message: "Falha ao salvar. Reative o backup automático." });
    }
  };

  const isElectron = typeof window !== "undefined" && !!window.electronStore;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">Backup de Dados</h1>
        <p className="text-muted-foreground mt-1">Exporte, importe e configure backup automático</p>
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
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Seus dados estão no <strong>armazenamento local do navegador</strong>. Ative o backup automático para salvar numa pasta do seu PC!
          </p>
        )}
      </div>

      {/* Status */}
      {status && (
        <div className={`flex items-center gap-3 p-4 rounded-xl border ${status.type === "success" ? "bg-primary/10 border-primary/20 text-primary" : "bg-destructive/10 border-destructive/20 text-destructive"}`}>
          {status.type === "success" ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <AlertTriangle className="h-5 w-5 shrink-0" />}
          <p className="text-sm">{status.message}</p>
        </div>
      )}

      {/* Auto backup */}
      {fsSupported && !isElectron && (
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="h-5 w-5 text-primary" />
            <h2 className="font-heading font-semibold text-foreground">Backup Automático (a cada 1h)</h2>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Escolha uma pasta no seu computador e o sistema salvará automaticamente um arquivo de backup a cada hora.
            Funciona no <strong>Chrome</strong> e <strong>Edge</strong>.
          </p>
          {lastBackup && (
            <p className="text-xs text-muted-foreground mb-3">
              Último backup: <strong>{new Date(lastBackup).toLocaleString("pt-BR")}</strong>
            </p>
          )}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleToggleAuto}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-colors ${
                autoEnabled
                  ? "bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/20"
                  : "bg-primary text-primary-foreground hover:opacity-90"
              }`}
            >
              {autoEnabled ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
              {autoEnabled ? "Desativar" : "Ativar Backup Automático"}
            </button>
            {autoEnabled && (
              <button
                onClick={handleForceBackup}
                className="flex items-center gap-2 bg-secondary text-secondary-foreground px-5 py-3 rounded-xl font-medium hover:opacity-90 transition-colors"
              >
                <Download className="h-4 w-4" />
                Salvar Agora
              </button>
            )}
          </div>
        </div>
      )}

      {!fsSupported && !isElectron && (
        <div className="bg-card rounded-2xl border border-border p-6">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-heading font-semibold text-foreground">Backup Automático</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Seu navegador não suporta backup automático. Use <strong>Google Chrome</strong> ou <strong>Microsoft Edge</strong> para esta funcionalidade.
          </p>
        </div>
      )}

      {/* Manual export */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center gap-3 mb-2">
          <Download className="h-5 w-5 text-primary" />
          <h2 className="font-heading font-semibold text-foreground">Exportar Backup Manual</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Baixa um arquivo .json com todos os seus dados.
        </p>
        <button onClick={exportData} className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-3 rounded-xl font-medium hover:opacity-90 transition-colors">
          <Download className="h-4 w-4" />
          Exportar Dados
        </button>
      </div>

      {/* Import */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-center gap-3 mb-2">
          <Upload className="h-5 w-5 text-primary" />
          <h2 className="font-heading font-semibold text-foreground">Importar Backup</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Restaura dados de um arquivo de backup .json.
          <strong className="text-destructive"> Atenção:</strong> substituirá todos os dados atuais.
        </p>
        <button onClick={importData} className="flex items-center gap-2 bg-secondary text-secondary-foreground px-5 py-3 rounded-xl font-medium hover:opacity-90 transition-colors">
          <Upload className="h-4 w-4" />
          Importar Dados
        </button>
      </div>
    </div>
  );
}
