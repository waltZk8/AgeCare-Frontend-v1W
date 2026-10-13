const assert=require('node:assert/strict');
const path=require('node:path');
const {mvpAccounts}=require('../mvp-auth.js');
exports.run=async function(browser,url,report){
 const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true});
 const errors=[]; page.on('pageerror',e=>errors.push(e.message));
 const login=async email=>{await page.locator('#login-email').fill(email); await page.locator('#login-password').fill(mvpAccounts[email].password); await page.locator('#enter').click();};
 const nav=async name=>page.locator(`#mobile-nav [data-page="${name}"]`).click();
 try {
  await page.goto(url); await login('familia@agecare.mvp');
  await nav('marketplace'); assert.equal(await page.getByText('Artículos',{exact:true}).count(),0);
  for(let i=1;i<=7;i++) {
   await page.locator(`[data-action="contact-caregiver"][data-id="cg${i}"]`).click();
   await page.locator('#caregiver-message').fill('Consulta exclusiva '+i);
   await page.locator('#caregiver-contact-form [type="submit"]').click();
  }
  for(const [email,account] of Object.entries(mvpAccounts).filter(([,a])=>a.caregiverId)) {
   await page.locator('#logout').click(); await login(email); await nav('inquiries');
   assert.equal(await page.locator('[data-action="open-inquiry"]').count(),1);
   await page.locator(`[data-action="open-inquiry"][data-id="${account.caregiverId}"]`).click();
   await page.locator('.caregiver-reply-form textarea').fill('Respuesta de '+account.caregiverId);
   await page.locator('.caregiver-reply-form [type="submit"]').click();
   assert.ok((await page.locator('#content').textContent()).includes('Respuesta de '+account.caregiverId));
   await nav('more');
   assert.equal(await page.locator('#content [data-page="health"]').count(),account.caregiverId==='cg1'?1:0);
  }
  for(const email of ['familia@agecare.mvp','medico@agecare.mvp']) {
   await page.locator('#logout').click(); await login(email); await nav('health');
   for(const tab of ['vitals','medicines','log','docs']) {
    await page.locator(`[data-action="health-tab"][data-tab="${tab}"]`).click();
    await page.locator('#entry-title').fill('Registro '+tab); await page.locator('#entry-note').fill('Contenido ficticio editable');
    await page.locator('#health-entry-form [type="submit"]').click();
    const record=page.locator('.health-entry').filter({hasText:'Registro '+tab});
    assert.equal(await record.count(),1); await record.locator('[data-action="health-edit"]').click();
    await page.locator('#entry-note').fill('Contenido actualizado'); await page.locator('#health-entry-form [type="submit"]').click();
    assert.ok((await record.textContent()).includes('Contenido actualizado'));
    await record.locator('[data-action="health-delete"]').click(); assert.equal(await record.count(),0);
   }
  }
  await nav('more'); await page.locator('#content [data-page="assistant"]').click();
  await page.locator('#assistant-question').fill('Resumen del día'); await page.locator('#assistant-form [type="submit"]').click();
  assert.ok((await page.locator('.assistant-messages').textContent()).includes('actividades pendientes'));
  await page.screenshot({path:path.join(report,'mvp-asistente.png'),animations:'disabled'});
  await page.locator('#logout').click(); await login('elena@agecare.mvp');
  await page.locator('#content [data-page="entertainment"]').click();
  await page.locator('[data-action="game-select"][data-id="puzzle"]').click();
  await page.locator('[data-action="game-puzzle-size"][data-index="3"]').click();
  assert.equal(await page.locator('.puzzle-piece').count(),9);
  for(let i=0;i<8;i++) {
   const labels=await page.locator('.puzzle-piece').evaluateAll(nodes=>nodes.map(n=>Number(n.getAttribute('aria-label').match(/Pieza (\d+)/)[1])-1));
   const from=labels.indexOf(i); if(from!==i){ await page.locator(`.puzzle-piece[data-index="${from}"]`).tap(); await page.locator(`.puzzle-piece[data-index="${i}"]`).tap(); }
  }
  assert.equal(await page.locator('.puzzle-piece:disabled').count(),9);
  await page.locator('.recreation-grid').screenshot({path:path.join(report,'mvp-rompecabezas-3x3.png'),animations:'disabled'});
  await page.locator('[data-action="game-select"][data-id="differences"]').click();
  await page.locator('[data-action="game-differences-reset"]').click();
  for(const id of ['tree','path','bloom']) await page.locator(`[data-action="game-difference"][data-id="${id}"]`).tap();
  assert.equal(await page.locator('.difference-hit.found').count(),3);
  await page.locator('[data-action="game-select"][data-id="dots"]').click();
  await page.locator('[data-action="game-dots-reset"]').click(); assert.equal(await page.locator('.number-dot').count(),8);
  for(let i=1;i<=8;i++) await page.locator(`[data-action="game-dot"][data-index="${i}"]`).tap();
  assert.ok((await page.locator('.game-feedback').first().textContent()).includes('Completaste'));
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  assert.deepEqual(errors,[]);
  return ['MVP: siete accesos reales de prueba y respuestas individuales; sin acceso de otras cuidadoras al expediente','MVP: altas, modificaciones y bajas de las cuatro fichas de Salud desde Familia y Médico','MVP: asistente local operativo y rotulado; rompecabezas 3×3 completado en móvil, segundo jardín y barco completados'];
 } finally {await page.close();}
};
