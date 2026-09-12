import React, { useEffect, useState } from 'react';
import { sendInvoice, fetchInvoices } from './api.js';

const emptyItem = () => ({ name: '', qty: 1, unit_price: '', tax_type: 'B' });

export default function App() {
  const [customerName, setCustomerName] = useState('');
  const [customerPin, setCustomerPin] = useState('');
  const [items, setItems] = useState([emptyItem()]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    loadRecent();
  }, []);

  async function loadRecent() {
    try {
      const data = await fetchInvoices();
      setRecent(data.invoices || []);
    } catch (e) {
      // silent — history is a nice-to-have, not critical
    }
  }

  function updateItem(index, field, value) {
    const next = [...items];
    next[index][field] = value;
    setItems(next);
  }

  function addItem() {
    setItems([...items, emptyItem()]);
  }

  function removeItem(index) {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  }

  const subTotalPreview = items.reduce((sum, it) => {
    const gross = (parseFloat(it.qty) || 0) * (parseFloat(it.unit_price) || 0);
    return sum + gross;
  }, 0);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setResult(null);

    if (!customerName.trim()) {
      setError('Please enter the customer name.');
      return;
    }
    if (items.some((it) => !it.name.trim() || !it.unit_price)) {
      setError('Every item needs a name and a price.');
      return;
    }

    setLoading(true);
    try {
      const data = await sendInvoice({
        customer_name: customerName,
        customer_pin: customerPin,
        items: items.map((it) => ({
          name: it.name,
          qty: parseFloat(it.qty) || 1,
          unit_price: parseFloat(it.unit_price) || 0,
          tax_type: it.tax_type,
        })),
      });
      setResult(data);
      loadRecent();
      if (data.success) {
        setCustomerName('');
        setCustomerPin('');
        setItems([emptyItem()]);
      }
    } catch (e) {
      setError(e.message || 'Something went wrong sending the invoice.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <header className="hero">
        <h1>eTIMS Invoice Demo</h1>
        
      </header>

      <div className="layout">
        <form className="card" onSubmit={handleSubmit}>
          <h2>New Invoice</h2>

          <div className="field-row">
            <div className="field">
              <label>Customer name</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Jane Wanjiru"
              />
            </div>
            <div className="field">
              <label>Customer KRA PIN (optional)</label>
              <input
                type="text"
                value={customerPin}
                onChange={(e) => setCustomerPin(e.target.value)}
                placeholder="A123456789Z"
              />
            </div>
          </div>

          <h3>Items ordered</h3>
          <div className="items-table">
            <div className="items-head">
              <span>Item</span>
              <span>Qty</span>
              <span>Price (KES)</span>
              <span>Tax</span>
              <span></span>
            </div>
            {items.map((item, i) => (
              <div className="items-row" key={i}>
                <input
                  type="text"
                  placeholder="e.g. Chicken Pilau"
                  value={item.name}
                  onChange={(e) => updateItem(i, 'name', e.target.value)}
                />
                <input
                  type="number"
                  min="1"
                  value={item.qty}
                  onChange={(e) => updateItem(i, 'qty', e.target.value)}
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.unit_price}
                  onChange={(e) => updateItem(i, 'unit_price', e.target.value)}
                />
                <select value={item.tax_type} onChange={(e) => updateItem(i, 'tax_type', e.target.value)}>
                  <option value="B">B – 16% VAT</option>
                  <option value="E">E – 8% VAT</option>
                  <option value="A">A – Exempt</option>
                  <option value="C">C – Zero rated</option>
                </select>
                <button type="button" className="link-btn" onClick={() => removeItem(i)}>
                  ✕
                </button>
              </div>
            ))}
          </div>

          <button type="button" className="secondary-btn" onClick={addItem}>
            + Add item
          </button>

          <div className="preview-total">
            Running total: <strong>KES {subTotalPreview.toFixed(2)}</strong>
          </div>

          {error && <div className="alert error">{error}</div>}

          <button type="submit" className="primary-btn" disabled={loading}>
            {loading ? 'Sending to eTIMS…' : 'Send Invoice to eTIMS'}
          </button>
        </form>

        <div className="card result-card">
          <h2>eTIMS Feedback</h2>
          {!result && <p className="muted">Submit an invoice to see the tax response here.</p>}

          {result && (
            <div className={`result ${result.success ? 'ok' : 'fail'}`}>
              <p className="result-status">
                {result.success ? '✅ Accepted by eTIMS' : '⚠️ eTIMS did not accept this invoice'}
              </p>
              <table className="kv-table">
                <tbody>
                  <tr><td>Our invoice no.</td><td>{result.invoice_no}</td></tr>
                  <tr><td>Sub total</td><td>KES {result.sub_total}</td></tr>
                  <tr><td>VAT</td><td>KES {result.vat_amount}</td></tr>
                  <tr><td>Total</td><td>KES {result.total_amount}</td></tr>
                  <tr><td>Result code</td><td>{result.etims?.result_code ?? '—'}</td></tr>
                  <tr><td>Result message</td><td>{result.etims?.result_msg ?? '—'}</td></tr>
                  <tr><td>KRA receipt no.</td><td>{result.etims?.curr_rcpt_no ?? '—'}</td></tr>
                  <tr><td>Receipt signature</td><td className="mono">{result.etims?.receipt_sign ?? '—'}</td></tr>
                  <tr><td>SDC date/time</td><td>{result.etims?.sdc_datetime ?? '—'}</td></tr>
                </tbody>
              </table>
            </div>
          )}

          <h3 className="recent-title">Recent invoices</h3>
          <ul className="recent-list">
            {recent.map((inv) => (
              <li key={inv.id}>
                <span>{inv.invoice_no}</span>
                <span>{inv.customer_name}</span>
                <span className={`badge ${inv.status}`}>{inv.status}</span>
              </li>
            ))}
            {recent.length === 0 && <li className="muted">No invoices yet.</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}
