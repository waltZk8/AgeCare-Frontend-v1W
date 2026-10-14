// npm install --no-save playwright && npx playwright install chromium
// Ejecutar: node scripts/browser-check.cjs. Servidor efímero exclusivamente local.
const { chromium } = require('playwright');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const report = path.join(root, 'docs', 'verificacion-navegador');
fs.mkdirSync(report, { recursive: true });
const server = http.createServer((req, res) => {
  const file = path.resolve(root, '.' + decodeURIComponent(req.url.split('?')[0] === '/' ? '/index.html' : req.url.split('?')[0]));
  if (!file.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404).end(); return; }
    const types = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.svg':'image/svg+xml', '.png':'image/png', '.jpeg':'image/jpeg', '.wav':'audio/wav' };
    res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream'); res.end(data);
  });
});
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ headless: true });
  const checks = [];
  try {
    checks.push(...await require('./mvp-check.cjs').run(browser,`http://127.0.0.1:${server.address().port}/`,report));
    fs.writeFileSync(path.join(report, 'resultado-mvp.json'), JSON.stringify({ date:new Date().toISOString(), checks }, null, 2));
    console.log(`${checks.length} grupos de comprobaciones OK\n` + checks.join('\n'));
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
