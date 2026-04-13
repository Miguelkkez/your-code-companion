import { useState, useEffect } from "react";
import { toast } from "@/components/ui/use-toast";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import MenuItemCard from "@/components/menu/MenuItemCard";
import { menuItemStore, type MenuItem } from "@/lib/store";

const categories = ["Lanches", "Bebidas", "Porções", "Doces", "Combos"];

const emptyForm = { name: "", description: "", price: "", cost_price: "", category: "", available: true };

export default function Menu() {
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const loadItems = () => {
    setItems(menuItemStore.list("category", 100));
    setLoading(false);
  };

  useEffect(() => { loadItems(); }, []);

  const openNew = () => { setEditingItem(null); setForm(emptyForm); setDialogOpen(true); };

  const openEdit = (item: MenuItem) => {
    setEditingItem(item);
    setForm({
      name: item.name || "",
      description: item.description || "",
      price: item.price?.toString() || "",
      cost_price: item.cost_price?.toString() || "",
      category: item.category || "",
      available: item.available !== false,
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.price || !form.category) {
      toast({ title: "Erro", description: "Preencha nome, preço e categoria", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const data = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      price: parseFloat(form.price),
      cost_price: form.cost_price ? parseFloat(form.cost_price) : undefined,
      category: form.category,
      available: form.available,
    };

    if (editingItem) {
      menuItemStore.update(editingItem.id, data);
      toast({ title: "Item atualizado!" });
    } else {
      menuItemStore.create(data as any);
      toast({ title: "Item adicionado!" });
    }
    setDialogOpen(false);
    setSubmitting(false);
    loadItems();
  };

  const handleDelete = (item: MenuItem) => {
    menuItemStore.delete(item.id);
    toast({ title: "Item removido" });
    loadItems();
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" /></div>;
  }

  const grouped = categories.reduce((acc, cat) => {
    const catItems = items.filter((i) => i.category === cat);
    if (catItems.length > 0) acc[cat] = catItems;
    return acc;
  }, {} as Record<string, MenuItem[]>);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Cardápio</h1>
          <p className="text-muted-foreground mt-1">{items.length} itens cadastrados</p>
        </div>
        <button onClick={openNew} className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-3 rounded-xl font-medium hover:opacity-90 transition-opacity shadow-lg shadow-primary/20">
          <Plus className="h-5 w-5" /> Novo Item
        </button>
      </div>

      {items.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center">
          <p className="text-muted-foreground text-lg">Nenhum item no cardápio</p>
          <button onClick={openNew} className="inline-flex items-center gap-2 mt-4 text-primary font-medium hover:underline">
            <Plus className="h-4 w-4" /> Adicionar primeiro item
          </button>
        </div>
      ) : (
        Object.entries(grouped).map(([category, catItems]) => (
          <div key={category}>
            <h2 className="font-heading font-semibold text-lg text-foreground mb-3">{category}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {catItems.map((item) => <MenuItemCard key={item.id} item={item} onEdit={openEdit} onDelete={handleDelete} />)}
            </div>
          </div>
        ))
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">{editingItem ? "Editar Item" : "Novo Item"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-sm font-medium">Nome *</label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: X-Burguer" className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Descrição</label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Pão, hambúrguer, queijo..." className="mt-1" rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Preço de Venda *</label>
                <Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="15.00" className="mt-1" />
              </div>
              <div>
                <label className="text-sm font-medium">Preço de Custo</label>
                <Input type="number" step="0.01" value={form.cost_price} onChange={(e) => setForm({ ...form, cost_price: e.target.value })} placeholder="8.00" className="mt-1" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Categoria *</label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Disponível</label>
              <Switch checked={form.available} onCheckedChange={(v) => setForm({ ...form, available: v })} />
            </div>
            <button onClick={handleSave} disabled={submitting} className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-heading font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
              {submitting ? "Salvando..." : editingItem ? "Salvar Alterações" : "Adicionar Item"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
