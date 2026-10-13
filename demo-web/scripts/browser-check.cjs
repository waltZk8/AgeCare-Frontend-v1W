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
    for (const [role, slug, width, height] of [['Familia','familia',390,844],['Cuidador','cuidador',390,844],['Médico','medico',390,844],['Adulto mayor','adulto',1024,768]]) {
      const page = await browser.newPage({ viewport: { width, height } });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(`http://127.0.0.1:${server.address().port}/`);
      const login = async () => { assert.ok(await page.locator('#login-form').isVisible()); await page.locator(`[data-mvp-role="${role}"]`).click(); await page.locator('#enter').click(); };
      await login();
      const nav = async name => page.locator(`${role === 'Adulto mayor' ? '#content' : '#mobile-nav'} [data-page="${name}"]`).first().click();
      await page.screenshot({ path: path.join(report, `${slug}-inicio.png`), fullPage:true });
      await nav('chat');
      const field = page.locator('#chat-message');
      await field.click(); await field.fill(`Hola ${role}`);
      assert.equal(await field.inputValue(), `Hola ${role}`);
      await page.locator('.emoji-picker summary').click();
      await page.locator('[data-action="insert-emoji"]').first().click();
      assert.match(await field.inputValue(), new RegExp(`Hola ${role}`));
      assert.ok((await field.inputValue()).length > `Hola ${role}`.length);
      await page.locator('#chat-form [type="submit"]').click();
      assert.ok(await page.locator('.chat-bubble').filter({ hasText:`Hola ${role}` }).count());
      assert.ok(await page.locator('.chat-list').evaluate(el => el.scrollHeight-el.clientHeight-el.scrollTop<3), 'Último mensaje visible sin bajar de nuevo');
      await field.fill('Borrador conservado');
      await page.locator('[data-action="send-photo"]').click();
      assert.equal(await field.inputValue(), 'Borrador conservado');
      assert.ok(await page.locator('.chat-bubble img').count());
      await page.locator('[data-action="send-audio"]').click();
      assert.ok(await page.locator('audio').count());
      assert.ok(await page.evaluate(() => window.scrollY > 0), 'El chat no vuelve arriba');
      checks.push(`${role}: texto, emoji, foto y audio de ejemplo, borrador y desplazamiento`);
      await nav('more'); await page.locator('#content [data-page="settings"]').click();
      await page.locator('[data-pref="theme"][data-value="dark"]').click();
      assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
      await page.reload(); assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark'); await login();
      await nav('more'); await page.locator('#content [data-page="accessibility"]').click();
      await page.locator('[data-pref="size"][data-value="extra"]').click();
      assert.equal(await page.locator('html').getAttribute('data-text-size'), 'extra');
      await page.locator('[data-pref="contrast"][data-value="true"]').click();
      await page.locator('[data-pref="spacing"][data-value="true"]').click();
      await page.locator('[data-pref="reducedMotion"][data-value="true"]').click();
      await page.reload();
      await login();
      for (const attr of ['data-contrast','data-spacing']) assert.equal(await page.locator('html').getAttribute(attr), 'true');
      assert.equal(await page.locator('html').getAttribute('data-motion'), 'reduced');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'Accesibilidad sin desbordamiento');
      await nav('more'); await page.locator('#content [data-page="accessibility"]').click();
      await page.screenshot({ path: path.join(report, `${slug}-accesibilidad-200.png`), fullPage:true });
      await page.locator('[data-action="reset-preferences"]').click();
      checks.push(`${role}: tema y accesibilidad persistentes al recargar, reflujo 200 %`);
      await nav('more'); await page.locator('#content [data-page="health"]').click();
      for (const tab of ['medicines','log','docs','vitals']) {
        await page.locator(`.section-switch [data-action="health-tab"][data-tab="${tab}"]`).click();
        assert.equal(await page.locator(`.section-switch [data-tab="${tab}"]`).getAttribute('aria-pressed'), 'true');
        if (tab === 'docs') assert.ok(await page.locator('.health-entry').count());
        assert.equal(await page.locator('#health-entry-form').count(), ['Familia','Médico'].includes(role)?1:0);
      }
      checks.push(`${role}: cuatro pestañas de Salud y documento`);
      await nav('more'); await page.locator('#content [data-page="calendar"]').click();
      await page.locator('[data-action="calendar-next"]').click();
      await page.locator('#calendar-month').selectOption('9');
      await page.locator('[data-date="2026-10-09"]').first().click();
      assert.equal(await page.locator('[data-date="2026-10-09"]').first().getAttribute('aria-pressed'), 'true');
      assert.equal(await page.locator('#appointment-form').count(), ['Médico','Cuidador','Familia'].includes(role) ? 1 : 0);
      if (role === 'Médico') {
        await page.locator('#appointment-title').fill('Seguimiento de prueba');
        await page.locator('#appointment-time').fill('17:15');
        await page.locator('#appointment-location').fill('Consulta de ejemplo');
        await page.locator('#appointment-form [type="submit"]').click();
        assert.ok(await page.locator('.appointment-detail').filter({ hasText:'Seguimiento de prueba' }).count());
        await page.reload(); await login(); await nav('more'); await page.locator('#content [data-page="calendar"]').click();
        assert.ok(await page.locator('.appointment-detail').filter({ hasText:'Seguimiento de prueba' }).count());
        checks.push('Médico: nuevo control guardado y conservado al recargar');
      }
      await page.screenshot({ path: path.join(report, `${slug}-calendario.png`), fullPage:true });
      checks.push(`${role}: calendario compartido, selección de mes y día, permisos`);
      await page.locator('#notifications-button').click();
      await page.locator('[data-action="read-all"]').click();
      assert.equal(await page.locator('#notification-count').textContent(), '0');
      assert.deepEqual(errors, []);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      checks.push(`${role}: avisos leídos, sin errores JavaScript ni desbordamiento`);
      await page.close();
    }
    checks.push(...await require('./experience-check.cjs').run(browser,`http://127.0.0.1:${server.address().port}/`,report));
    checks.push(...await require('./mvp-check.cjs').run(browser,`http://127.0.0.1:${server.address().port}/`,report));
    fs.writeFileSync(path.join(report, 'resultado.json'), JSON.stringify({ date:new Date().toISOString(), checks }, null, 2));
    console.log(`${checks.length} grupos de comprobaciones OK\n` + checks.join('\n'));
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
