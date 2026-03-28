
function renderCart() {
  const cart  = getCart();
  const list  = document.getElementById('cartList');
  const count = document.getElementById('itemCount');
  const btn   = document.getElementById('submitBtn');
  const total = cart.reduce((s,i) => s+i.qty, 0);

  count.textContent = total + ' item' + (total === 1 ? '' : 's');

  if (!cart.length) {
    list.innerHTML = `<div class="empty-state">
      <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="none" stroke="currentColor" stroke-width="1.2" viewBox="0 0 24 24"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
      <p style="font-weight:600;">Your cart is empty</p>
      <small>Add items from the menu to get started</small>
    </div>`;
    btn.disabled = true; btn.style.opacity = '.5';
  } else {
    btn.disabled = false; btn.style.opacity = '1';
    list.innerHTML = '';
    cart.forEach(item => {
      const row = document.createElement('div');
      row.className = 'cart-item';
      row.innerHTML = `
        <div class="cart-item-img" style="background:var(--gray-100,#f3f4f6);flex-shrink:0;"></div>
        <div class="cart-item-body">
          <div class="cart-item-name">${item.name}</div>
          <div class="qty-controls">
            <button class="qty-btn" onclick="changeQty(${item.id},-1)">−</button>
            <span class="qty-num">${item.qty}</span>
            <button class="qty-btn" onclick="changeQty(${item.id},1)">+</button>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:.4rem;">
          <span class="cart-item-price">₹${item.price * item.qty}</span>
          <button class="remove-btn" onclick="removeItem(${item.id})" title="Remove">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/></svg>
          </button>
        </div>`;
      list.appendChild(row);
    });
  }
  calcTotals(cart);
}

function calcTotals(cart) {
  document.getElementById('total').textContent = '₹' + cart.reduce((s,i) => s+i.price*i.qty, 0);
  const si = document.getElementById('summaryItems');
  si.innerHTML = !cart.length
    ? '<p style="font-size:.8rem;color:var(--gray-400);text-align:center;">No items yet</p>'
    : cart.map(i => `<div class="summary-item-row"><span class="item-label">${i.name} <span style="color:var(--gray-400);">× ${i.qty}</span></span><span class="item-subtotal">₹${i.price*i.qty}</span></div>`).join('');
}

function changeQty(id, delta) {
  const cart = getCart();
  const item = cart.find(c => c.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) { removeFromCart(id); } else { saveCart(cart); }
  renderCart();
}
function removeItem(id) { removeFromCart(id); renderCart(); }


async function submitOrder() {
  const cart = getCart();
  if (!cart.length) return;

  const name  = document.getElementById('custName').value.trim();
  const phone = document.getElementById('custPhone').value.trim();
  const tableNum = parseInt(document.getElementById('custTable').value);
  const table = isNaN(tableNum) ? '' : String(tableNum);

  let valid = true;
  ['custName','custPhone','custTable'].forEach(id => document.getElementById(id).classList.remove('error'));

  if (!name)  { document.getElementById('custName').classList.add('error');  valid = false; }
  if (!phone) { document.getElementById('custPhone').classList.add('error'); valid = false; }
  if (!table || tableNum < 1 || tableNum > 10) {
    document.getElementById('custTable').classList.add('error');
    valid = false;
  }
  if (!valid) { alert('Please fill in your Name, Phone, and a valid Table Number (1–10).'); return; }

  const total = cart.reduce((s,i) => s+i.price*i.qty, 0);
  const btn = document.getElementById('submitBtn');
  btn.textContent = 'Placing order…'; btn.disabled = true;

  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: cart, total, customer_name: name, customer_phone: phone, table_number: table })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    const orderedItems = [...cart]; 
    clearCart();
    showConfirmation(data.id, name, phone, table, orderedItems, total);
  } catch(e) {
    alert('Failed to place order: ' + e.message);
    btn.textContent = 'Place Order →'; btn.disabled = false;
  }
}


function showConfirmation(id, name, phone, table, items, total) {
  document.getElementById('cartPage').style.display = 'none';
  const section = document.getElementById('confirmationSection');
  section.style.display = 'block';

  document.getElementById('confirmCustomerInfo').innerHTML = `
    <span>👤 ${name}</span>
    <span>📞 ${phone}</span>
    <span>🪑 ${table}</span>
    <span style="font-weight:600;color:var(--primary);">Order #${id}</span>`;

  document.getElementById('confirmItemList').innerHTML =
    items.map(i => `
      <div class="summary-item-row">
        <span class="item-label">${i.name} <span style="color:var(--gray-400);">× ${i.qty}</span></span>
        <span class="item-subtotal">₹${i.price * i.qty}</span>
      </div>`).join('') +
    `<div class="summary-item-row" style="margin-top:.75rem;padding-top:.75rem;border-top:1px solid var(--gray-200,#e5e7eb);font-weight:700;">
        <span>Total</span><span>₹${total}</span>
      </div>`;
}

renderCart();
