import { type Order } from "@/lib/store";

interface ReceiptPrintProps {
  order: Order;
}

export default function ReceiptPrint({ order }: ReceiptPrintProps) {
  const handlePrint = () => {
    const printWindow = window.open("", "_blank", "width=220,height=600");
    if (!printWindow) return;

    const usedMethods = order.payment_details
      ? Object.entries(order.payment_details).filter(([, v]) => v > 0)
      : order.payment_method
        ? [[order.payment_method, order.total]]
        : [];

    const itemsHtml = order.items
      .map(
        (item) =>
          `<tr><td style="text-align:left">${item.quantity}x ${item.name}</td><td style="text-align:right">${(item.price * item.quantity).toFixed(2)}</td></tr>`
      )
      .join("");

    const paymentsHtml = usedMethods
      .map(([m, v]) => `<tr><td style="text-align:left">${m}</td><td style="text-align:right">${Number(v).toFixed(2)}</td></tr>`)
      .join("");

    const changeHtml = order.change_amount && order.change_amount > 0
      ? `<tr><td style="text-align:left"><b>Troco</b></td><td style="text-align:right"><b>${order.change_amount.toFixed(2)}</b></td></tr>`
      : "";

    const date = new Date(order.created_date);
    const dateStr = date.toLocaleDateString("pt-BR");
    const timeStr = date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

    printWindow.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Cupom</title>
<style>
  @page { margin: 0; size: 58mm auto; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Courier New', monospace; font-size: 11px; width: 58mm; padding: 4mm 2mm; color: #000; }
  .center { text-align: center; }
  .bold { font-weight: bold; }
  .divider { border-top: 1px dashed #000; margin: 4px 0; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 1px 0; vertical-align: top; }
  .total-row td { padding-top: 4px; font-weight: bold; font-size: 13px; }
  .header { font-size: 14px; font-weight: bold; margin-bottom: 2px; }
  .sub { font-size: 9px; color: #555; }
</style></head><body>
  <div class="center">
    <div class="header">EL POTE FRANGO FRITO</div>
    <div class="sub">CUPOM NÃO FISCAL</div>
  </div>
  <div class="divider"></div>
  <div style="display:flex;justify-content:space-between;font-size:10px">
    <span>Pedido #${order.order_number || "—"}</span>
    <span>${dateStr} ${timeStr}</span>
  </div>
  <div class="divider"></div>
  <table>${itemsHtml}</table>
  <div class="divider"></div>
  <table>
    <tr class="total-row"><td style="text-align:left">TOTAL</td><td style="text-align:right">R$ ${order.total.toFixed(2)}</td></tr>
  </table>
  <div class="divider"></div>
  <div style="font-size:10px;margin-bottom:2px"><b>Pagamento:</b></div>
  <table>${paymentsHtml}${changeHtml}</table>
  <div class="divider"></div>
  <div class="center sub" style="margin-top:6px">
    Obrigado pela preferência!<br/>
    Volte sempre 🍗
  </div>
</body></html>`);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 300);
  };

  return { handlePrint };
}

export function printReceipt(order: Order) {
  const printWindow = window.open("", "_blank", "width=220,height=600");
  if (!printWindow) return;

  const usedMethods = order.payment_details
    ? Object.entries(order.payment_details).filter(([, v]) => v > 0)
    : order.payment_method
      ? [[order.payment_method, order.total]]
      : [];

  const itemsHtml = order.items
    .map(
      (item) =>
        `<tr><td style="text-align:left">${item.quantity}x ${item.name}</td><td style="text-align:right">${(item.price * item.quantity).toFixed(2)}</td></tr>`
    )
    .join("");

  const paymentsHtml = usedMethods
    .map(([m, v]) => `<tr><td style="text-align:left">${m}</td><td style="text-align:right">${Number(v).toFixed(2)}</td></tr>`)
    .join("");

  const changeHtml = order.change_amount && order.change_amount > 0
    ? `<tr><td style="text-align:left"><b>Troco</b></td><td style="text-align:right"><b>${order.change_amount.toFixed(2)}</b></td></tr>`
    : "";

  const date = new Date(order.created_date);
  const dateStr = date.toLocaleDateString("pt-BR");
  const timeStr = date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  printWindow.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Cupom</title>
<style>
  @page { margin: 0; size: 58mm auto; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Courier New', monospace; font-size: 11px; width: 58mm; padding: 4mm 2mm; color: #000; }
  .center { text-align: center; }
  .divider { border-top: 1px dashed #000; margin: 4px 0; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 1px 0; vertical-align: top; }
  .total-row td { padding-top: 4px; font-weight: bold; font-size: 13px; }
  .header { font-size: 14px; font-weight: bold; margin-bottom: 2px; }
  .sub { font-size: 9px; color: #555; }
</style></head><body>
  <div class="center">
    <div class="header">EL POTE FRANGO FRITO</div>
    <div class="sub">CUPOM NÃO FISCAL</div>
  </div>
  <div class="divider"></div>
  <div style="display:flex;justify-content:space-between;font-size:10px">
    <span>Pedido #${order.order_number || "—"}</span>
    <span>${dateStr} ${timeStr}</span>
  </div>
  <div class="divider"></div>
  <table>${itemsHtml}</table>
  <div class="divider"></div>
  <table>
    <tr class="total-row"><td style="text-align:left">TOTAL</td><td style="text-align:right">R$ ${order.total.toFixed(2)}</td></tr>
  </table>
  <div class="divider"></div>
  <div style="font-size:10px;margin-bottom:2px"><b>Pagamento:</b></div>
  <table>${paymentsHtml}${changeHtml}</table>
  <div class="divider"></div>
  <div class="center sub" style="margin-top:6px">
    Obrigado pela preferência!<br/>
    Volte sempre 🍗
  </div>
</body></html>`);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => { printWindow.print(); printWindow.close(); }, 300);
}
