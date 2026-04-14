// Auto-backup service using File System Access API
// Saves data to a user-chosen folder every hour automatically

const BACKUP_INTERVAL = 60 * 60 * 1000; // 1 hour
const HANDLE_KEY = "autobackup_enabled";
const LAST_BACKUP_KEY = "autobackup_last";

let intervalId: ReturnType<typeof setInterval> | null = null;
let dirHandle: FileSystemDirectoryHandle | null = null;

function getBackupData(): string {
  return JSON.stringify({
    version: 1,
    exported_at: new Date().toISOString(),
    menu_items: JSON.parse(localStorage.getItem("menu_items") || "[]"),
    orders: JSON.parse(localStorage.getItem("orders") || "[]"),
    cash_registers: JSON.parse(localStorage.getItem("cash_registers") || "[]"),
  }, null, 2);
}

async function writeBackup(): Promise<boolean> {
  if (!dirHandle) return false;
  try {
    // Verify we still have permission
    const perm = await dirHandle.queryPermission({ mode: "readwrite" });
    if (perm !== "granted") {
      const req = await dirHandle.requestPermission({ mode: "readwrite" });
      if (req !== "granted") return false;
    }
    const fileName = `lanchonete-autobackup.json`;
    const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(getBackupData());
    await writable.close();
    localStorage.setItem(LAST_BACKUP_KEY, new Date().toISOString());
    return true;
  } catch (e) {
    console.error("Auto-backup failed:", e);
    return false;
  }
}

export function isFileSystemAccessSupported(): boolean {
  return "showDirectoryPicker" in window;
}

export function isAutoBackupEnabled(): boolean {
  return localStorage.getItem(HANDLE_KEY) === "true" && dirHandle !== null;
}

export function getLastBackupTime(): string | null {
  return localStorage.getItem(LAST_BACKUP_KEY);
}

export async function enableAutoBackup(): Promise<boolean> {
  if (!isFileSystemAccessSupported()) return false;
  try {
    dirHandle = await window.showDirectoryPicker({ mode: "readwrite" });
    localStorage.setItem(HANDLE_KEY, "true");
    // Do first backup immediately
    const ok = await writeBackup();
    if (ok) startInterval();
    return ok;
  } catch {
    return false;
  }
}

export function disableAutoBackup() {
  dirHandle = null;
  localStorage.removeItem(HANDLE_KEY);
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

function startInterval() {
  if (intervalId) clearInterval(intervalId);
  intervalId = setInterval(() => {
    writeBackup();
  }, BACKUP_INTERVAL);
}

export async function triggerManualAutoBackup(): Promise<boolean> {
  if (!dirHandle) return false;
  return writeBackup();
}
