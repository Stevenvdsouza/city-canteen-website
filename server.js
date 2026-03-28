const express = require('express');
const cors    = require('cors');
const path    = require('path');
const db      = require('./database');

const app  = express();
const PORT = 3000;

//adm panel pass
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'citycanteen2026';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// 
const run = (sql, params=[]) => new Promise((res,rej) => db.run(sql, params, function(e){ if(e) rej(e); else res(this); }));
const all = (sql, params=[]) => new Promise((res,rej) => db.all(sql, params, (e,rows) => e ? rej(e) : res(rows)));
const get = (sql, params=[]) => new Promise((res,rej) => db.get(sql,  params, (e,row)  => e ? rej(e) : res(row)));



//ver staffcode

app.post('/api/staff/verify', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.json({ valid: false });
    const row = await get('SELECT id FROM staff_codes WHERE code=?', [code]);
    res.json({ valid: !!row });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

//admin login
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    res.json({ valid: true });
  } else {
    res.json({ valid: false });
  }
});



app.get('/api/staff-codes', async (req, res) => {
  try {
    const rows = await all('SELECT * FROM staff_codes ORDER BY id');
    res.json(rows);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/staff-codes', async (req, res) => {
  try {
    const { code, label } = req.body;
    if (!code) return res.status(400).json({ error: 'code required' });
    const info = await run('INSERT INTO staff_codes (code, label) VALUES (?,?)', [code, label || 'Staff']);
    res.json({ id: info.lastID, code, label: label || 'Staff' });
  } catch(e) {
    if (e.message.includes('UNIQUE')) return res.status(400).json({ error: 'Code already exists' });
    res.status(500).json({ error: e.message });
  }
});

app.delete('/api/staff-codes/:id', async (req, res) => {
  try {
    await run('DELETE FROM staff_codes WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});


// menu

app.get('/api/menu', async (req, res) => {
  try {
    const { category } = req.query;
    const rows = category
      ? await all('SELECT * FROM menu WHERE category=? AND deleted=0 ORDER BY id', [category])
      : await all('SELECT * FROM menu WHERE deleted=0 ORDER BY category, id');
    res.json(rows);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/menu', async (req, res) => {
  try {
    const { name, description, price, category, image_url } = req.body;
    if (!name || !price || !category) return res.status(400).json({ error: 'name, price, category required' });
    const info = await run(
      'INSERT INTO menu (name,description,price,category,image_url) VALUES (?,?,?,?,?)',
      [name, description||'', price, category, image_url||'']
    );
    res.json({ id: info.lastID, name, description, price, category, image_url, available: 1 });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/menu/:id', async (req, res) => {
  try {
    const { name, description, price, category, image_url, available } = req.body;
    await run(
      'UPDATE menu SET name=?,description=?,price=?,category=?,image_url=?,available=? WHERE id=?',
      [name, description, price, category, image_url, available??1, req.params.id]
    );
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

//deleted items
app.get('/api/menu/deleted', async (req, res) => {
  try {
    const rows = await all('SELECT * FROM menu WHERE deleted=1 ORDER BY category, id');
    res.json(rows);
  } catch(e) { res.status(500).json({ error: e.message }); }
});


app.delete('/api/menu/:id', async (req, res) => {
  try {
    await run('UPDATE menu SET deleted=1 WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

//menu

app.post('/api/orders', async (req, res) => {
  try {
    const { items, total, customer_name, customer_phone, table_number, table_note } = req.body;
    if (!items || !items.length) return res.status(400).json({ error: 'Cart is empty' });
    const info = await run(
      'INSERT INTO orders (items_json, total, customer_name, customer_phone, table_number, table_note) VALUES (?,?,?,?,?,?)',
      [JSON.stringify(items), total, customer_name||'', customer_phone||'', table_number||'', table_note||'']
    );
    res.json({ id: info.lastID, message: 'Order placed successfully' });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/orders', async (req, res) => {
  try {
    const rows   = await all('SELECT * FROM orders ORDER BY id DESC');
    const parsed = rows.map(r => ({ ...r, items: JSON.parse(r.items_json) }));
    res.json(parsed);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

//daily report
app.get('/api/orders/daily-report', async (req, res) => {
  try {
    const rows = await all(
      "SELECT * FROM orders WHERE status='billed' AND date(created_at)=date('now','localtime') ORDER BY id"
    );
    const orders = rows.map(r => ({ ...r, items: JSON.parse(r.items_json) }));
    const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
    const today = new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
    res.json({ date: today, orderCount: orders.length, totalRevenue, orders });
  } catch(e) { res.status(500).json({ error: e.message }); }
});


app.get('/api/orders/:id', async (req, res) => {
  try {
    const row = await get('SELECT * FROM orders WHERE id=?', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json({ ...row, items: JSON.parse(row.items_json) });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// update order status
app.patch('/api/orders/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['pending','accepted','rejected','preparing','ready','billed'];
    if (!allowed.includes(status)) return res.status(400).json({ error: 'Invalid status' });
    await run('UPDATE orders SET status=? WHERE id=?', [status, req.params.id]);
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});


app.patch('/api/orders/:id/call-staff', async (req, res) => {
  try {
    const { call_staff } = req.body;
    await run('UPDATE orders SET call_staff=? WHERE id=?', [call_staff ? 1 : 0, req.params.id]);
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

//get bill data
app.get('/api/orders/:id/bill', async (req, res) => {
  try {
    const row = await get('SELECT * FROM orders WHERE id=?', [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Not found' });
    const items = JSON.parse(row.items_json);
    res.json({
      order_id:       row.id,
      customer_name:  row.customer_name,
      customer_phone: row.customer_phone,
      table_number:   row.table_number,
      items,
      total:          row.total,
      created_at:     row.created_at,
      status:         row.status
    });
  } catch(e) { res.status(500).json({ error: e.message }); }
});


app.patch('/api/orders/:id', async (req, res) => {
  try {
    await run('UPDATE orders SET status=? WHERE id=?', [req.body.status, req.params.id]);
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

//reservation

app.post('/api/reservations', async (req, res) => {
  try {
    const { name, contact, date, time, guests, note } = req.body;
    if (!name||!contact||!date||!time||!guests) return res.status(400).json({ error: 'All fields required' });

    if (guests < 2) return res.status(400).json({ error: 'Minimum 2 guests required.' });

    
    const nowIST  = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const todayStr = nowIST.toISOString().split('T')[0];
    const hourIST  = nowIST.getHours();

    if (date < todayStr) return res.status(400).json({ error: 'Cannot book for a past date.' });
    if (date === todayStr && hourIST >= 16)
      return res.status(400).json({ error: 'Same-day reservations are only accepted before 4:00 PM. Please book for tomorrow or a later date.' });

    const info = await run(
      'INSERT INTO reservations (name,contact,date,time,guests,note) VALUES (?,?,?,?,?,?)',
      [name, contact, date, time, guests, note||'']
    );
    res.json({ id: info.lastID, message: 'Reservation confirmed' });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/reservations', async (req, res) => {
  try {
    const rows = await all('SELECT * FROM reservations ORDER BY date, time');
    res.json(rows);
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/reservations/:id', async (req, res) => {
  try {
    await run('DELETE FROM reservations WHERE id=?', [req.params.id]);
    res.json({ success: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});


app.listen(PORT, () => {
  console.log(`\n🍽️  City Canteen is running at http://localhost:${PORT}`);
  console.log(`📋  Staff panel:          http://localhost:${PORT}/admin.html`);
  console.log(`🔐  Admin panel:          http://localhost:${PORT}/superadmin.html`);
  console.log(`📅  Reservations:         http://localhost:${PORT}/opening-hours.html\n`);
});
