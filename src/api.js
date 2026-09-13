// Point this at wherever the backend folder sits under htdocs, e.g.
// http://localhost/etims-demo/backend/api
const API_BASE = 'https://backend-restaurant-etims.onrender.com/api';

// Render's free tier sleeps after inactivity — the first request after
// a cold start can fail outright instead of just being slow. Retry once
// after a short delay before giving up.
async function fetchWithRetry(url, options, retries = 1, delayMs = 3000) {
  try {
    return await fetch(url, options);
  } catch (err) {
    if (retries > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      return fetchWithRetry(url, options, retries - 1, delayMs);
    }
    throw err;
  }
}

export async function sendInvoice(payload) {
  const res = await fetchWithRetry(`${API_BASE}/send_invoice.php`, {
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
  const res = await fetchWithRetry(`${API_BASE}/invoices.php`);
  if (!res.ok) throw new Error('Could not load invoices');
  return res.json();
}
