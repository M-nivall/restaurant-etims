// Point this at wherever the backend folder sits under htdocs, e.g.
// http://localhost/etims-demo/backend/api
const API_BASE = 'http://localhost/etims-demo/backend/api';

export async function sendInvoice(payload) {
  const res = await fetch(`${API_BASE}/send_invoice.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok && !data.etims) {
    throw new Error(data.error || 'Request failed');
  }
  return data;
}

export async function fetchInvoices() {
  const res = await fetch(`${API_BASE}/invoices.php`);
  if (!res.ok) throw new Error('Could not load invoices');
  return res.json();
}
