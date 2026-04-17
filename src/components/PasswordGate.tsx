import { useState, useEffect, FormEvent } from "react";
import { Lock } from "lucide-react";
import { cn } from "@/lib/utils";

// SHA-256 hash of the access password. The plaintext password is NOT stored
// anywhere in the source code, so it cannot be reverse-engineered from the bundle.
const PASSWORD_HASH = "45d1bf544943b021e561523370fcb4b73bf8c67de1b68a3ec825fb28144ff434";
const SESSION_KEY = "__pdv_access_granted__";

async function sha256(text: string): Promise<string> {
  const buf = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

interface PasswordGateProps {
  children: React.ReactNode;
}

export function PasswordGate({ children }: PasswordGateProps) {
  const [unlocked, setUnlocked] = useState(false);
  const [checking, setChecking] = useState(true);
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    // Session-based unlock: gate reappears when the tab/browser is closed.
    if (sessionStorage.getItem(SESSION_KEY) === "1") {
      setUnlocked(true);
    }
    setChecking(false);
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(false);
    const hash = await sha256(value);
    if (hash === PASSWORD_HASH) {
      sessionStorage.setItem(SESSION_KEY, "1");
      setUnlocked(true);
    } else {
      setError(true);
      setShake(true);
      setValue("");
      setTimeout(() => setShake(false), 500);
    }
  };

  if (checking) return null;
  if (unlocked) return <>{children}</>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <form
        onSubmit={handleSubmit}
        className={cn(
          "w-full max-w-sm bg-card border border-border rounded-2xl p-8 shadow-xl space-y-6",
          shake && "animate-[shake_0.4s_ease-in-out]"
        )}
      >
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Lock className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Acesso Restrito</h1>
          <p className="text-sm text-muted-foreground">Digite a senha para continuar</p>
        </div>

        <div className="space-y-2">
          <input
            type="password"
            inputMode="numeric"
            autoFocus
            autoComplete="off"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError(false);
            }}
            className={cn(
              "w-full text-center text-2xl tracking-[0.5em] font-heading font-bold py-4 rounded-xl bg-background border-2 outline-none transition-all",
              error
                ? "border-destructive text-destructive"
                : "border-border focus:border-primary text-foreground"
            )}
            placeholder="••••"
          />
          {error && (
            <p className="text-sm text-destructive text-center">Senha incorreta</p>
          )}
        </div>

        <button
          type="submit"
          disabled={!value}
          className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-heading font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Entrar
        </button>
      </form>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }
      `}</style>
    </div>
  );
}
