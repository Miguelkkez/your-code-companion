import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initializeStore } from "./lib/store";

// Initialize store (loads files from disk in Electron, no-op in browser)
initializeStore().then(() => {
  createRoot(document.getElementById("root")!).render(<App />);
});
