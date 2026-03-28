

const CART_KEY = 'cc_cart';

function getCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
  catch { return []; }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  refreshBadge();
}

function addToCart(item) {
  
  const cart = getCart();
  const existing = cart.find(c => c.id === item.id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ ...item, qty: 1 });
  }
  saveCart(cart);
  showToast(`${item.name} added to cart!`);
}

function removeFromCart(id) {
  saveCart(getCart().filter(c => c.id !== id));
}

function updateQty(id, qty) {
  const cart = getCart();
  const item = cart.find(c => c.id === id);
  if (item) {
    item.qty = qty;
    if (item.qty <= 0) return removeFromCart(id);
  }
  saveCart(cart);
}

function getCartCount() {
  return getCart().reduce((sum, i) => sum + i.qty, 0);
}

function getCartTotal() {
  return getCart().reduce((sum, i) => sum + i.price * i.qty, 0);
}

function clearCart() {
  localStorage.removeItem(CART_KEY);
  refreshBadge();
}


function refreshBadge() {
  const badge = document.getElementById('cartBadge');
  if (!badge) return;
  const count = getCartCount();
  badge.textContent = count;
  badge.style.display = count > 0 ? 'flex' : 'none';
}


function showToast(msg) {
  let toast = document.getElementById('cc-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'cc-toast';
    toast.style.cssText = `
      position:fixed;bottom:1.5rem;left:50%;transform:translateX(-50%) translateY(20px);
      background:#1f2937;color:#fff;padding:.75rem 1.5rem;border-radius:2rem;
      font-family:'Poppins',sans-serif;font-size:.85rem;font-weight:500;
      opacity:0;transition:opacity .3s,transform .3s;z-index:9999;
      box-shadow:0 4px 20px rgba(0,0,0,.3);white-space:nowrap;`;
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.opacity = '1';
  toast.style.transform = 'translateX(-50%) translateY(0)';
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-50%) translateY(20px)';
  }, 2000);
}document.addEventListener('DOMContentLoaded', refreshBadge);
