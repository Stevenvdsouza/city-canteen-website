
const hamburgerBtn = document.getElementById('hamburgerBtn');
const mobileNav    = document.getElementById('mobileNav');
const navBackdrop  = document.getElementById('navBackdrop');
const navClose     = document.getElementById('navClose');

function openNav()  { mobileNav.classList.add('open');    hamburgerBtn.classList.add('open');    document.body.style.overflow = 'hidden'; }
function closeNav() { mobileNav.classList.remove('open'); hamburgerBtn.classList.remove('open'); document.body.style.overflow = ''; }

hamburgerBtn.addEventListener('click', openNav);
navBackdrop.addEventListener('click', closeNav);
navClose.addEventListener('click', closeNav);

const PLUS_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>`;
const CAT_LABELS = {
  all:'All Items', burgers:'Burgers', pizza:'Pizza', rolls:'Rolls', sandwich:'Sandwich',
  momos:'Momos', starters:'Starters', chicken_wings:'Chicken Wings', garlic_bread:'Garlic Bread',
  fries:'Fries', nachos:'Nachos', squid:'Squid', maggi:'Maggi', egg:'Egg', breakfast:'Breakfast',
  soups:'Soups', salads:'Salads', mojito:'Mojito', milkshakes:'Milkshakes',
  fruit_juice:'Fruit Juice', iced_tea:'Iced Tea', dessert:'Dessert',
  beverages:'Beverages', noodles:'Noodles', wings:'Wings'
};
const FALLBACK_IMGS = {
  burgers:'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop',
  pizza:'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop',
  rolls:'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400&h=300&fit=crop',
  sandwich:'https://images.unsplash.com/photo-1553909489-cd47e0907980?w=400&h=300&fit=crop',
  momos:'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?w=400&h=300&fit=crop',
  starters:'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=300&fit=crop',
  chicken_wings:'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=400&h=300&fit=crop',
  garlic_bread:'https://images.unsplash.com/photo-1573140247632-f8fd74997d5c?w=400&h=300&fit=crop',
  fries:'https://images.unsplash.com/photo-1585109649139-366815a0d713?w=400&h=300&fit=crop',
  nachos:'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=400&h=300&fit=crop',
  squid:'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=300&fit=crop',
  maggi:'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=400&h=300&fit=crop',
  egg:'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=400&h=300&fit=crop',
  breakfast:'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=400&h=300&fit=crop',
  soups:'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&h=300&fit=crop',
  salads:'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop',
  mojito:'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=300&fit=crop',
  milkshakes:'https://images.unsplash.com/photo-1572490122747-3e92c4a2ff17?w=400&h=300&fit=crop',
  fruit_juice:'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&h=300&fit=crop',
  iced_tea:'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=300&fit=crop',
  dessert:'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&h=300&fit=crop',
  beverages:'https://images.unsplash.com/photo-1504279577054-acfeccf8fc52?w=400&h=300&fit=crop',
  noodles:'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&h=300&fit=crop',
  wings:'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=400&h=300&fit=crop'
};

let allItems = [];
let activeCat = 'all';

function renderGrid(items) {
  const grid = document.getElementById('productsGrid');
  document.getElementById('sectionTitle').textContent = CAT_LABELS[activeCat] || activeCat;
  document.getElementById('itemCountLabel').textContent = items.length + ' item' + (items.length === 1 ? '' : 's');
  if (!items.length) {
    grid.innerHTML = '<div style="grid-column:1/-1;padding:3rem;text-align:center;color:#9ca3af;">No items in this category.</div>';
    return;
  }
  grid.innerHTML = items.map(i => {
    const imageHtml = i.image_url
      ? `<img src="${i.image_url}" alt="${i.name}" loading="lazy" onerror="this.parentElement.innerHTML='<div class=\\'img-placeholder\\'></div>';this.onerror=null;">`
      : `<div class="img-placeholder"></div>`;
    return `<div class="product-card">
      <div class="product-image">
        ${imageHtml}
      </div>
      <div class="product-info">
        <h3 class="product-name">${i.name}</h3>
        ${i.description ? `<p style="font-size:.73rem;color:#6b7280;margin-top:.2rem;line-height:1.35;">${i.description}</p>` : ''}
        <div class="product-footer">
          <span style="font-size:1rem;font-weight:700;color:var(--primary,#f97316);">₹${i.price}</span>
          <button class="add-to-cart" onclick='addToCart(${JSON.stringify({id:i.id,name:i.name,price:i.price,image_url:i.image_url,category:i.category})})' title="Add to cart">${PLUS_SVG}</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

async function loadAndRender(cat) {
  activeCat = cat;
  const url = cat === 'all' ? '/api/menu' : `/api/menu?category=${encodeURIComponent(cat)}`;
  const grid = document.getElementById('productsGrid');
  grid.innerHTML = '<div style="grid-column:1/-1;padding:3rem;text-align:center;color:#9ca3af;">Loading…</div>';
  try {
    const items = await fetch(url).then(r => r.json());
    if (cat === 'all') allItems = items;
    renderGrid(items);
  } catch(e) {
    grid.innerHTML = '<div style="grid-column:1/-1;padding:3rem;text-align:center;color:#ef4444;">Failed to load menu.</div>';
  }
}


document.querySelector('.sidebar').addEventListener('click', e => {
  const li = e.target.closest('li[data-cat]');
  if (!li) return;
  document.querySelectorAll('.sidebar .category-item').forEach(el => el.classList.remove('active'));
  li.classList.add('active');
  loadAndRender(li.dataset.cat);
});


loadAndRender('burgers');

let allMenuItems = [];
const searchInput   = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');
const searchClear   = document.getElementById('searchClear');

fetch('./menu.json').then(r => r.json()).then(data => { allMenuItems = data; }).catch(() => {});

searchInput.addEventListener('input', () => {
  const q = searchInput.value.trim().toLowerCase();
  searchClear.style.display = q ? 'flex' : 'none';
  if (!q) { searchResults.style.display = 'none'; return; }

  const matches = allMenuItems.filter(i => i.name.toLowerCase().includes(q));
  if (!matches.length) {
    searchResults.innerHTML = '<div class="sr-empty">No dishes found for "' + searchInput.value + '"</div>';
  } else {
    searchResults.innerHTML = '<div class="sr-header">Results</div>' + matches.map(i => `
      <div class="sr-item">
        <img class="sr-img" src="${i.image_url || ''}" alt="${i.name}" onerror="this.style.display='none'">
        <div class="sr-info">
          <span class="sr-name">${i.name}</span>
          <span class="sr-cat">${i.category}</span>
        </div>
        <span class="sr-price">₹${i.price}</span>
        <button class="sr-add" onclick='addToCart(${JSON.stringify({id:i.id,name:i.name,price:i.price,image_url:i.image_url,category:i.category})})'>ADD</button>
      </div>`).join('');
  }
  searchResults.style.display = 'block';
});

searchClear.addEventListener('click', () => {
  searchInput.value = '';
  searchClear.style.display = 'none';
  searchResults.style.display = 'none';
  searchInput.focus();
});

document.addEventListener('click', e => {
  if (!document.getElementById('searchWrap').contains(e.target)) {
    searchResults.style.display = 'none';
  }
});
