// Hybrid data store: uses Electron file system when available, localStorage as fallback

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  cost_price?: number;
  category: string;
  image_url?: string;
  available: boolean;
  created_date: string;
}

export interface OrderItem {
  menu_item_id: string;
  name: string;
  price: number;
  cost_price?: number;
  quantity: number;
}

export interface Order {
  id: string;
  customer_name: string;
  items: OrderItem[];
  total: number;
  total_cost?: number;
  status: "pending" | "preparing" | "ready" | "delivered" | "cancelled";
  notes?: string;
  order_number: number;
  payment_method?: string;
  payment_details?: Record<string, number>;
  change_amount?: number;
  created_date: string;
}

export interface CashRegister {
  id: string;
  date: string;
  opened_at: string;
  closed_at?: string;
  initial_cash: number;
  status: "open" | "closed";
  total_sales: number;
  total_cost: number;
  total_profit: number;
  total_orders: number;
  by_payment: Record<string, number>;
  order_ids: string[];
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

// ---- Hybrid persistence layer ----
// In Electron: reads/writes JSON files on disk via IPC (async, but we cache in memory)
// In browser: uses localStorage

const isElectron = typeof window !== "undefined" && !!window.electronStore;

// In-memory cache for Electron mode
const memoryCache: Record<string, any[]> = {};
let electronInitialized = false;

// Load all data from Electron files into memory cache
export async function initializeStore(): Promise<void> {
  if (!isElectron || electronInitialized) return;
  const keys = ["menu_items", "orders", "cash_registers"];
  for (const key of keys) {
    try {
      memoryCache[key] = await window.electronStore!.get(key);
    } catch {
      memoryCache[key] = [];
    }
  }
  electronInitialized = true;
}

function getAll<T>(key: string): T[] {
  if (isElectron) {
    return (memoryCache[key] || []) as T[];
  }
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}

function saveAll<T>(key: string, data: T[]) {
  if (isElectron) {
    memoryCache[key] = data;
    // Write to disk asynchronously
    window.electronStore!.set(key, data).catch((e: any) => console.error("Save error:", e));
  } else {
    localStorage.setItem(key, JSON.stringify(data));
  }
}

// ---- Stores (unchanged API) ----

export const menuItemStore = {
  list(sortField?: string, limit?: number): MenuItem[] {
    let items = getAll<MenuItem>("menu_items");
    if (sortField) items.sort((a, b) => (a[sortField as keyof MenuItem] as string || "").localeCompare(b[sortField as keyof MenuItem] as string || ""));
    if (limit) items = items.slice(0, limit);
    return items;
  },
  filter(criteria: Partial<MenuItem>): MenuItem[] {
    return getAll<MenuItem>("menu_items").filter(item =>
      Object.entries(criteria).every(([k, v]) => item[k as keyof MenuItem] === v)
    );
  },
  create(data: Omit<MenuItem, "id" | "created_date">): MenuItem {
    const items = getAll<MenuItem>("menu_items");
    const item: MenuItem = { ...data, id: generateId(), created_date: new Date().toISOString() };
    items.push(item);
    saveAll("menu_items", items);
    return item;
  },
  update(id: string, data: Partial<MenuItem>): MenuItem | null {
    const items = getAll<MenuItem>("menu_items");
    const idx = items.findIndex(i => i.id === id);
    if (idx === -1) return null;
    items[idx] = { ...items[idx], ...data };
    saveAll("menu_items", items);
    return items[idx];
  },
  delete(id: string) {
    saveAll("menu_items", getAll<MenuItem>("menu_items").filter(i => i.id !== id));
  },
};

export const orderStore = {
  list(sortField?: string, limit?: number): Order[] {
    let items = getAll<Order>("orders");
    if (sortField === "-created_date") items.sort((a, b) => new Date(b.created_date).getTime() - new Date(a.created_date).getTime());
    else if (sortField === "-order_number") items.sort((a, b) => (b.order_number || 0) - (a.order_number || 0));
    if (limit) items = items.slice(0, limit);
    return items;
  },
  create(data: Omit<Order, "id" | "created_date">): Order {
    const items = getAll<Order>("orders");
    const order: Order = { ...data, id: generateId(), created_date: new Date().toISOString() };
    items.push(order);
    saveAll("orders", items);
    return order;
  },
  update(id: string, data: Partial<Order>): Order | null {
    const items = getAll<Order>("orders");
    const idx = items.findIndex(i => i.id === id);
    if (idx === -1) return null;
    items[idx] = { ...items[idx], ...data };
    saveAll("orders", items);
    return items[idx];
  },
};

export const cashRegisterStore = {
  list(): CashRegister[] {
    return getAll<CashRegister>("cash_registers").sort((a, b) => new Date(b.opened_at).getTime() - new Date(a.opened_at).getTime());
  },
  getOpen(): CashRegister | null {
    return getAll<CashRegister>("cash_registers").find(r => r.status === "open") || null;
  },
  getByDate(date: string): CashRegister | null {
    return getAll<CashRegister>("cash_registers").find(r => r.date === date) || null;
  },
  open(initialCash: number): CashRegister {
    const items = getAll<CashRegister>("cash_registers");
    const now = new Date();
    const register: CashRegister = {
      id: generateId(),
      date: now.toISOString().split("T")[0],
      opened_at: now.toISOString(),
      initial_cash: initialCash,
      status: "open",
      total_sales: 0,
      total_cost: 0,
      total_profit: 0,
      total_orders: 0,
      by_payment: {},
      order_ids: [],
    };
    items.push(register);
    saveAll("cash_registers", items);
    return register;
  },
  close(id: string, summary: { total_sales: number; total_cost: number; total_profit: number; total_orders: number; by_payment: Record<string, number>; order_ids: string[] }): CashRegister | null {
    const items = getAll<CashRegister>("cash_registers");
    const idx = items.findIndex(i => i.id === id);
    if (idx === -1) return null;
    items[idx] = { ...items[idx], ...summary, status: "closed", closed_at: new Date().toISOString() };
    saveAll("cash_registers", items);
    return items[idx];
  },
  update(id: string, data: Partial<CashRegister>): CashRegister | null {
    const items = getAll<CashRegister>("cash_registers");
    const idx = items.findIndex(i => i.id === id);
    if (idx === -1) return null;
    items[idx] = { ...items[idx], ...data };
    saveAll("cash_registers", items);
    return items[idx];
  },
};
