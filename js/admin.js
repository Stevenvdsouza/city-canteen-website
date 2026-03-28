
function showApp() {
  document.getElementById('pinScreen').style.display = 'none';
  document.getElementById('staffApp').style.display  = 'block';
  loadOrders();
  setInterval(loadOrders, 10000);
  loadDailyReport();
  setInterval(loadDailyReport, 60000);
  loadReservations();
}


if (sessionStorage.getItem('staffAuthed') === '1') {
  showApp();
}

async function checkPin() {
  const code = document.getElementById('pinInput').value.trim();
  if (!code) return;
  const r = await fetch('/api/staff/verify', {
    method: 'POST', headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ code })
  });
  const data = await r.json();
  if (data.valid) {
    sessionStorage.setItem('staffAuthed', '1');
    showApp();
  } else {
    document.getElementById('pinErr').style.display    = 'block';
    document.getElementById('pinInput').value = '';
  }
}
document.getElementById('pinInput').addEventListener('keydown', e => { if(e.key==='Enter') checkPin(); });


window.addEventListener('beforeunload', () => {
  if (performance.navigation.type !== 1) {
    sessionStorage.removeItem('staffAuthed');
  }
});


async function loadOrders() {
  const list = document.getElementById('ordersList');
  try {
    const orders = await fetch('/api/orders').then(r => r.json());
    
    const live = orders.filter(o => o.status !== 'billed' && o.status !== 'rejected');

    const hasCall = live.some(o => o.call_staff);
    document.getElementById('globalCallBadge').style.display = hasCall ? 'inline-block' : 'none';

    if (!live.length) {
      list.innerHTML = '<div class="empty-note">No active orders. Waiting for customers…</div>';
    } else {
      list.innerHTML = live.map(o => renderOrderCard(o)).join('');
    }
  } catch(e) {
    list.innerHTML = '<div class="empty-note">Error loading orders. Retrying…</div>';
  }
}

function renderOrderCard(o) {
  const items = o.items || JSON.parse(o.items_json || '[]');
  const pillClass = `pill-${o.status}`;
  const cardClass = `order-card status-${o.status}${o.call_staff ? ' call-active' : ''}`;

  const actionBtns = (() => {
    switch(o.status) {
      case 'pending':
        return `<button class="act-btn btn-accept"  onclick="updateStatus(${o.id},'accepted')">✅ Accept</button>
                <button class="act-btn btn-reject"  onclick="updateStatus(${o.id},'rejected')">❌ Reject</button>`;
      case 'accepted':
        return `<button class="act-btn btn-prepare" onclick="updateStatus(${o.id},'preparing')">🍳 Mark Preparing</button>`;
      case 'preparing':
        return `<button class="act-btn btn-ready"   onclick="updateStatus(${o.id},'ready')">✔️ Mark Ready</button>`;
      case 'ready':
        return `<button class="act-btn btn-bill"    onclick="generateBill(${o.id})">🧾 Generate Bill</button>`;
      default: return '';
    }
  })();

  const assistNote = o.status === 'rejected'
    ? `<div class="assist-note">⚠️ Please assist customer at <strong>Table ${o.table_number || '—'}</strong> (${o.customer_name || 'Unknown'})</div>`
    : '';

  return `
    <div class="${cardClass}" id="order-${o.id}">
      <div class="order-top">
        <div class="order-meta">
          <div class="order-id-row">
            <span class="order-num">Order #${o.id}</span>
            <span class="status-pill ${pillClass}">${o.status}</span>
            ${o.call_staff ? '<span class="call-tag">🔔 Call Staff</span>' : ''}
          </div>
          <div class="customer-row">
            <span>👤 ${o.customer_name || '—'}</span>
            <span>📞 ${o.customer_phone || '—'}</span>
            <span>🪑 Table: <strong>${o.table_number || '—'}</strong></span>
          </div>
          <div class="order-time">🕐 ${o.created_at}</div>
        </div>
        <div class="order-total">Total: <span>₹${o.total}</span></div>
      </div>
      <div class="order-items">
        ${items.map(i => `<span class="item-chip">${i.name} × ${i.qty}</span>`).join('')}
      </div>
      ${assistNote}
      <div class="order-footer">
        <div></div>
        <div class="action-btns">${actionBtns}</div>
      </div>
    </div>`;
}

async function updateStatus(id, status) {
  await fetch(`/api/orders/${id}/status`, {
    method: 'PATCH', headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ status })
  });
  loadOrders();
}

async function generateBill(id) {
  await updateStatus(id, 'billed');
  const r = await fetch(`/api/orders/${id}/bill`);
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


async function loadDailyReport() {
  const el = document.getElementById('dailyReportSection');
  if (!el) return;
  try {
    const data = await fetch('/api/orders/daily-report').then(r => r.json());
    const { date, orders, totalRevenue, orderCount } = data;

    if (!orders.length) {
      el.innerHTML = `<div class="empty-note">No billed orders today (${date}) yet.</div>`;
      return;
    }

    const rows = orders.map(o => {
      const items = o.items.map(i => `${i.name} × ${i.qty}`).join(', ');
      return `<tr>
        <td style="font-weight:600;">#${o.id}</td>
        <td>${o.customer_name || '—'}</td>
        <td>${o.table_number || '—'}</td>
        <td style="font-size:.8rem;color:#6b7280;max-width:200px;word-break:break-word;">${items}</td>
        <td style="font-weight:700;color:#f97316;">₹${o.total}</td>
      </tr>`;
    }).join('');

    el.innerHTML = `
      <div style="background:#fff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">
        <table style="width:100%;border-collapse:collapse;font-size:.85rem;font-family:inherit;">
          <thead>
            <tr style="background:#f9fafb;">
              <th style="padding:.65rem 1rem;text-align:left;font-size:.75rem;color:#6b7280;font-weight:600;border-bottom:1px solid #e5e7eb;">Order</th>
              <th style="padding:.65rem 1rem;text-align:left;font-size:.75rem;color:#6b7280;font-weight:600;border-bottom:1px solid #e5e7eb;">Customer</th>
              <th style="padding:.65rem 1rem;text-align:left;font-size:.75rem;color:#6b7280;font-weight:600;border-bottom:1px solid #e5e7eb;">Table</th>
              <th style="padding:.65rem 1rem;text-align:left;font-size:.75rem;color:#6b7280;font-weight:600;border-bottom:1px solid #e5e7eb;">Items</th>
              <th style="padding:.65rem 1rem;text-align:right;font-size:.75rem;color:#6b7280;font-weight:600;border-bottom:1px solid #e5e7eb;">Amount</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <div style="display:flex;justify-content:space-between;align-items:center;padding:.85rem 1rem;background:#fff7ed;border-top:1px solid #fed7aa;">
          <span style="font-size:.85rem;color:#92400e;">📅 ${date} &nbsp;·&nbsp; ${orderCount} order${orderCount===1?'':'s'} billed</span>
          <span style="font-size:1.05rem;font-weight:700;color:#f97316;">Total: ₹${totalRevenue}</span>
        </div>
      </div>`;
  } catch(e) {
    el.innerHTML = `<div class="empty-note">Failed to load report.</div>`;
  }
}


async function showDailyReport() {
  const reportModal = document.getElementById('reportModal');
  const reportBody  = document.getElementById('reportBody');
  reportBody.innerHTML = '<p style="text-align:center;padding:2rem;color:#6b7280;">Loading…</p>';
  reportModal.classList.add('open');

  try {
    const data = await fetch('/api/orders/daily-report').then(r => r.json());
    const { date, orders, totalRevenue, orderCount } = data;

    if (!orders.length) {
      reportBody.innerHTML = `<p style="text-align:center;padding:2rem;color:#6b7280;">No billed orders today (${date}).</p>`;
      return;
    }

    const rows = orders.map(o => {
      const items = o.items.map(i => `${i.name} × ${i.qty}`).join(', ');
      return `<tr>
        <td>#${o.id}</td>
        <td>${o.customer_name}</td>
        <td>${o.table_number}</td>
        <td style="font-size:.8rem;color:#6b7280;">${items}</td>
        <td style="font-weight:600;">₹${o.total}</td>
      </tr>`;
    }).join('');

    reportBody.innerHTML = `
      <div class="bill-logo">
        <div class="name">🍽️ City Canteen</div>
        <div class="sub">Daily Sales Report — ${date}</div>
      </div>
      <div class="bill-info" style="margin-bottom:1rem;">
        <div class="row"><span>Date</span><span>${date}</span></div>
        <div class="row"><span>Total Orders Billed</span><span>${orderCount}</span></div>
        <div class="row" style="font-weight:700;font-size:1.05rem;"><span>Total Revenue</span><span>₹${totalRevenue}</span></div>
      </div>
      <table class="bill-items">
        <thead><tr><th>Order</th><th>Customer</th><th>Table</th><th>Items</th><th>Total</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="bill-footer" style="margin-top:1.5rem;">End of Report</div>
      <button class="print-btn" onclick="window.print()">🖨️ Print Report</button>`;
  } catch(e) {
    reportBody.innerHTML = `<p style="text-align:center;padding:2rem;color:#ef4444;">Failed to load report.</p>`;
  }
}


async function loadReservations() {
  const tbody = document.getElementById('staffResTableBody');
  if (!tbody) return;
  try {
    const resvs = await fetch('/api/reservations').then(r => r.json());
    if (!resvs.length) {
      tbody.innerHTML = '<tr><td colspan="6" style="padding:1rem;text-align:center;color:#9ca3af;">No reservations yet.</td></tr>';
      return;
    }
    tbody.innerHTML = resvs.map(r => `
      <tr style="border-bottom:1px solid #f3f4f6;">
        <td style="padding:.65rem 1rem;"><b>${r.name}</b></td>
        <td style="padding:.65rem 1rem;">${r.contact}</td>
        <td style="padding:.65rem 1rem;">${r.date}</td>
        <td style="padding:.65rem 1rem;">${r.time}</td>
        <td style="padding:.65rem 1rem;">${r.guests}</td>
        <td style="padding:.65rem 1rem;color:#6b7280;">${r.note || '—'}</td>
      </tr>`).join('');
  } catch(e) {
    tbody.innerHTML = '<tr><td colspan="6" style="padding:1rem;text-align:center;color:#ef4444;">Failed to load reservations.</td></tr>';
  }
}
