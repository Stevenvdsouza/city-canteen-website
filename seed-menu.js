
const http = require('http');
const fs   = require('fs');
const path = require('path');

const items = JSON.parse(fs.readFileSync(path.join(__dirname, 'menu.json'), 'utf8'));

function post(item) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(item);
    const opts = {
      hostname: 'localhost', port: 3000, path: '/api/menu',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    };
    const req = http.request(opts, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => resolve(JSON.parse(data)));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

(async () => {
  let ok = 0, fail = 0;
  for (const item of items) {
    try {
      const r = await post(item);
      if (r.id) { ok++; process.stdout.write('.'); }
      else       { fail++; console.log('\nFAIL:', item.name, r); }
    } catch(e) {
      fail++;
      console.log('\nERROR:', item.name, e.message);
    }
  }
  console.log(`\n\n✅ Done! ${ok} items added, ${fail} failed.`);
})();
