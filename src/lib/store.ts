// Simple localStorage-based data store

export interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  image_url?: string;
  available: boolean;
  created_date: string;
}

export interface OrderItem {
  menu_item_id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  customer_name: string;
  items: OrderItem[];
  total: number;
  status: "pending" | "preparing" | "ready" | "delivered" | "cancelled";
  notes?: string;
  order_number: number;
  payment_method?: string;
  created_date: string;
}

export interface CashRegister {
  id: string;
  date: string; // YYYY-MM-DD
  opened_at: string;
  closed_at?: string;
  initial_cash: number;
  status: "open" | "closed";
  total_sales: number;
  total_orders: number;
  by_payment: Record<string, number>;
  order_ids: string[];
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function getAll<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}

function saveAll<T>(key: string, data: T[]) {
  localStorage.setItem(key, JSON.stringify(data));
}

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
