
async function doLogin() {
  const u = document.getElementById('loginUser').value.trim();
  const p = document.getElementById('loginPass').value;
  const r = await fetch('/api/admin/login', {
    method: 'POST', headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ username: u, password: p })
  });
  const d = await r.json();
  if (d.valid) {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminApp').style.display    = 'block';
    loadMenuItems(); loadCodes(); loadOrders(); loadLiveOrders(); loadAdminDailyReport();
  } else {
    document.getElementById('loginErr').style.display = 'block';
    document.getElementById('loginPass').value = '';
  }
}


function switchTab(name, el) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('panel-' + name).classList.add('active');
  if (name === 'reservations') loadReservations();
  if (name === 'orders')       loadOrders();
  if (name === 'orders-live')  loadLiveOrders();
  if (name === 'report')       loadAdminDailyReport();
  if (name === 'codes')        loadCodes();
}


async function loadMenuItems() {
  const tbody = document.getElementById('menuTableBody');
  tbody.innerHTML = '<tr><td colspan="6" class="empty-note">Loading…</td></tr>';
  const items = await fetch('/api/menu').then(r => r.json());
  if (!items.length) { tbody.innerHTML = '<tr><td colspan="6" class="empty-note">No items yet.</td></tr>'; return; }
  tbody.innerHTML = items.map(item => `
    <tr>
      <td><img src="${item.image_url||''}" onerror="this.style.display='none'" alt=""></td>
      <td><b>${item.name}</b>${item.description ? `<br><small style="color:var(--gray-400)">${item.description}</small>` : ''}</td>
      <td><span class="badge-cat">${item.category}</span></td>
      <td>₹${item.price}</td>
      <td>
        <button class="avail-toggle ${item.available ? 'on' : 'off'}" onclick="toggleAvail(${item.id}, ${item.available ? 0 : 1}, this)">
          ${item.available ? 'Available' : 'Unavailable'}
        </button>
      </td>
      <td>
        <button class="del-btn" onclick="deleteMenuItem(${item.id}, this)" title="Delete">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/></svg>
        </button>
      </td>
    </tr>`).join('');
}

async function addMenuItem() {
  const name  = document.getElementById('newName').value.trim();
  const price = parseFloat(document.getElementById('newPrice').value);
  const cat   = document.getElementById('newCategory').value;
  const img   = document.getElementById('newImage').value.trim();
  const desc  = document.getElementById('newDesc').value.trim();
  if (!name || !price || !cat) { alert('Name, price and category are required.'); return; }
  await fetch('/api/menu', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ name, price, category: cat, image_url: img, description: desc }) });
  ['newName','newPrice','newImage','newDesc'].forEach(id => document.getElementById(id).value = '');
  loadMenuItems();
}

async function deleteMenuItem(id, btn) {
  if (!confirm('Delete this item?')) return;
  btn.closest('tr').style.opacity = '.4';
  await fetch('/api/menu/' + id, { method: 'DELETE' });
  loadMenuItems();
}

async function toggleAvail(id, newVal, btn) {
  const items = await fetch('/api/menu').then(r => r.json());
  const item  = items.find(i => i.id === id);
  if (!item) return;
  await fetch('/api/menu/' + id, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ ...item, available: newVal }) });
  btn.textContent  = newVal ? 'Available' : 'Unavailable';
  btn.className    = 'avail-toggle ' + (newVal ? 'on' : 'off');
  btn.setAttribute('onclick', `toggleAvail(${id}, ${newVal ? 0 : 1}, this)`);
}


async function loadReservations() {
  const tbody = document.getElementById('resTableBody');
  const resvs = await fetch('/api/reservations').then(r => r.json());
  if (!resvs.length) { tbody.innerHTML = '<tr><td colspan="7" class="empty-note">No reservations yet.</td></tr>'; return; }
  tbody.innerHTML = resvs.map(r => `
    <tr>
      <td><b>${r.name}</b></td><td>${r.contact}</td><td>${r.date}</td><td>${r.time}</td>
      <td>${r.guests}</td><td>${r.note||'—'}</td>
      <td>
        <button class="del-btn" onclick="deleteReservation(${r.id}, this)" title="Delete">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/></svg>
        </button>
      </td>
    </tr>`).join('');
}

async function deleteReservation(id, btn) {
  if (!confirm('Remove this reservation?')) return;
  btn.closest('tr').style.opacity = '.4';
  await fetch('/api/reservations/' + id, { method: 'DELETE' });
  loadReservations();
}


async function loadCodes() {
  const grid = document.getElementById('codesGrid');
  const codes = await fetch('/api/staff-codes').then(r => r.json());
  if (!codes.length) { grid.innerHTML = '<div class="empty-note">No staff codes yet. Add one below.</div>'; return; }
  grid.innerHTML = codes.map(c => `
    <div class="code-card">
      <div class="code-label">${c.label}</div>
      <div class="code-value">${c.code}</div>
      <div style="font-size:.7rem;color:var(--gray-400);">Created ${c.created_at}</div>
      <div class="code-actions">
        <button class="copy-btn" onclick="copyCode('${c.code}', this)">📋 Copy</button>
        <button class="code-del-btn" onclick="deleteCode(${c.id}, this)">✕</button>
      </div>
    </div>`).join('');
}

function copyCode(code, btn) {
  navigator.clipboard.writeText(code).then(() => {
    btn.textContent = '✅ Copied!';
    setTimeout(() => { btn.textContent = '📋 Copy'; }, 1500);
  });
}

async function addCode() {
  const code  = document.getElementById('newCodeVal').value.trim();
  const label = document.getElementById('newCodeLabel').value.trim();
  if (!code) { alert('Code is required.'); return; }
  const r = await fetch('/api/staff-codes', {
    method: 'POST', headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ code, label: label || 'Staff' })
  });
  const d = await r.json();
  if (!r.ok) { alert(d.error); return; }
  document.getElementById('newCodeVal').value   = '';
  document.getElementById('newCodeLabel').value = '';
  loadCodes();
}

async function deleteCode(id, btn) {
  if (!confirm('Delete this staff code? That staff member will lose access.')) return;
  btn.closest('.code-card').style.opacity = '.4';
  await fetch('/api/staff-codes/' + id, { method: 'DELETE' });
  loadCodes();
}


async function loadOrders() {
  const tbody = document.getElementById('ordersTableBody');
  const orders = await fetch('/api/orders').then(r => r.json());
  if (!orders.length) { tbody.innerHTML = '<tr><td colspan="9" class="empty-note">No orders yet.</td></tr>'; return; }
  tbody.innerHTML = orders.map(o => `
    <tr>
      <td><b>#${o.id}</b></td>
      <td>${o.customer_name||'—'}</td>
      <td>${o.customer_phone||'—'}</td>
      <td>${o.table_number||'—'}</td>
      <td style="max-width:200px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${o.items.map(i=>i.name+' ×'+i.qty).join(', ')}</td>
      <td style="font-weight:700;color:var(--primary);">₹${o.total}</td>
      <td><span class="status-pill pill-${o.status}">${o.status}</span></td>
      <td style="font-size:.75rem;color:var(--gray-400);">${o.created_at}</td>
      <td><button class="refresh-btn" onclick="showBill(${o.id})">🧾 Bill</button></td>
    </tr>`).join('');
}

async function showBill(id) {
  const r = await fetch('/api/orders/' + id + '/bill');
  const bill = await r.json();
  document.getElementById('billBody').innerHTML = `
    <div class="bill-logo">
      <div class="name">🍽️ City Canteen</div>
      <div class="sub">Anagundi Bejai Kapikad · +91 8296259552</div>
    </div>
    <div class="bill-info">
      <div class="row"><span>Order #</span><span>${bill.order_id}</span></div>
      <div class="row"><span>Customer</span><span>${bill.customer_name}</span></div>
      <div class="row"><span>Phone</span><span>${bill.customer_phone}</span></div>
      <div class="row"><span>Table</span><span>${bill.table_number}</span></div>
      <div class="row"><span>Time</span><span>${bill.created_at}</span></div>
    </div>
    <table class="bill-items">
      <thead><tr><th>Item</th><th>Qty</th><th>Rate</th><th>Amount</th></tr></thead>
      <tbody>${bill.items.map(i=>`<tr><td>${i.name}</td><td>${i.qty}</td><td>₹${i.price}</td><td>₹${i.price*i.qty}</td></tr>`).join('')}</tbody>
    </table>
    <div class="bill-total"><span>Total</span><span>₹${bill.total}</span></div>
    <div class="bill-footer">Thank you for dining with us! 🙏</div>
    <button class="print-btn" onclick="window.print()">🖨️ Print Bill</button>`;
  document.getElementById('billModal').classList.add('open');
}


async function loadLiveOrders() {
  const el = document.getElementById('adminLiveOrdersList');
  if (!el) return;
  try {
    const orders = await fetch('/api/orders').then(r => r.json());
    const live = orders.filter(o => o.status !== 'billed' && o.status !== 'rejected');
    if (!live.length) {
      el.innerHTML = '<div class="empty-note">No active orders right now.</div>';
      return;
    }
    el.innerHTML = `<div class="table-wrap"><table class="data-table">
      <thead><tr><th>#</th><th>Customer</th><th>Table</th><th>Items</th><th>Total</th><th>Status</th><th>Time</th></tr></thead>
      <tbody>${live.map(o => `<tr>
        <td><b>#${o.id}</b></td>
        <td>${o.customer_name || '--'}</td>
        <td>${o.table_number || '--'}</td>
        <td style="max-width:200px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${o.items.map(i => i.name + ' x' + i.qty).join(', ')}</td>
        <td style="font-weight:700;color:var(--primary);">Rs.${o.total}</td>
        <td><span class="status-pill pill-${o.status}">${o.status}</span></td>
        <td style="font-size:.75rem;color:var(--gray-400);">${o.created_at}</td>
      </tr>`).join('')}</tbody>
    </table></div>`;
  } catch(e) {
    el.innerHTML = '<div class="empty-note">Failed to load live orders.</div>';
  }
}


async function loadAdminDailyReport() {
  const el = document.getElementById('adminDailyReportSection');
  if (!el) return;
  try {
    const data = await fetch('/api/orders/daily-report').then(r => r.json());
    const { date, orders, totalRevenue, orderCount } = data;
    if (!orders.length) {
      el.innerHTML = `<div class="empty-note">No billed orders today (${date}) yet.</div>`;
      return;
    }
    const rows = orders.map(o => {
      const items = o.items.map(i => `${i.name} x ${i.qty}`).join(', ');
      return `<tr>
        <td style="padding:.65rem 1rem;font-weight:600;">#${o.id}</td>
        <td style="padding:.65rem 1rem;">${o.customer_name || '--'}</td>
        <td style="padding:.65rem 1rem;">${o.table_number || '--'}</td>
        <td style="padding:.65rem 1rem;font-size:.8rem;color:#6b7280;max-width:200px;word-break:break-word;">${items}</td>
        <td style="padding:.65rem 1rem;font-weight:700;color:#f97316;">Rs.${o.total}</td>
      </tr>`;
    }).join('');
    el.innerHTML = `
      <div style="background:#fff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">
        <table style="width:100%;border-collapse:collapse;font-size:.85rem;font-family:inherit;">
          <thead><tr style="background:#f9fafb;">
            <th style="padding:.65rem 1rem;text-align:left;font-size:.75rem;color:#6b7280;font-weight:600;border-bottom:1px solid #e5e7eb;">Order</th>
            <th style="padding:.65rem 1rem;text-align:left;font-size:.75rem;color:#6b7280;font-weight:600;border-bottom:1px solid #e5e7eb;">Customer</th>
            <th style="padding:.65rem 1rem;text-align:left;font-size:.75rem;color:#6b7280;font-weight:600;border-bottom:1px solid #e5e7eb;">Table</th>
            <th style="padding:.65rem 1rem;text-align:left;font-size:.75rem;color:#6b7280;font-weight:600;border-bottom:1px solid #e5e7eb;">Items</th>
            <th style="padding:.65rem 1rem;text-align:right;font-size:.75rem;color:#6b7280;font-weight:600;border-bottom:1px solid #e5e7eb;">Amount</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <div style="display:flex;justify-content:space-between;align-items:center;padding:.85rem 1rem;background:#fff7ed;border-top:1px solid #fed7aa;">
          <span style="font-size:.85rem;color:#92400e;">${date} - ${orderCount} order${orderCount === 1 ? '' : 's'} billed</span>
          <span style="font-size:1.05rem;font-weight:700;color:#f97316;">Total: Rs.${totalRevenue}</span>
        </div>
      </div>`;
  } catch(e) {
    el.innerHTML = '<div class="empty-note">Failed to load report.</div>';
  }
}
