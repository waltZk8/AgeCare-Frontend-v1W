import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import test from 'node:test';

const require = createRequire(import.meta.url);
const features = require('../demo-features.js');
const scripts = await Promise.all(['demo-auth.js', 'demo-features.js', 'app.js'].map((name) => readFile(new URL(`../${name}`, import.meta.url), 'utf8')));

// Entorno de DOM mínimo: ejecuta el código y sus eventos sin afirmar validación visual.
function boot(storage = new Map()) {
  const nodes = new Map();
  const handlers = {};
  function node(selector) {
    if (!nodes.has(selector)) {
      const classes = new Set();
      nodes.set(selector, {
        id: selector.slice(1), value: '', dataset: {}, innerHTML: '', textContent: '', maxLength: 600,
        selectionStart: 0, selectionEnd: 0, listeners: {},
        style: { setProperty() {} },
        classList: { add: (v) => classes.add(v), remove: (v) => classes.delete(v), contains: (v) => classes.has(v), toggle: (v, on) => on ? classes.add(v) : classes.delete(v) },
        addEventListener(type, callback) { this.listeners[type] = callback; },
        focus() {}, reset() {}, setAttribute() {}, scrollIntoView() {},
        setRangeText(text, start, end) { this.value = this.value.slice(0,start) + text + this.value.slice(end); },
      });
    }
    return nodes.get(selector);
  }
  const document = {
    querySelector: node, getElementById: (id) => node(`#${id}`), querySelectorAll: () => [],
    body: node('body'), documentElement: node('html'),
    addEventListener(type, callback) { (handlers[type] ||= []).push(callback); },
  };
  const context = vm.createContext({
    document, window: { scrollTo() {}, addEventListener() {} }, console,
    localStorage: { getItem: (key) => storage.get(key) ?? null, setItem: (key,value) => storage.set(key,value), removeItem: (key) => storage.delete(key) },
    setTimeout: () => 1, clearTimeout() {},
  });
  scripts.forEach((script) => vm.runInContext(script, context));
  const run = (script) => vm.runInContext(script, context);
  function submit(id, options = {}) {
    const target = { id, dataset: options.dataset || {}, matches: (selector) => options.reply && selector === '.caregiver-reply-form', querySelector: () => ({ value: options.message || '' }) };
    handlers.submit.forEach((callback) => callback({ target, preventDefault() {} }));
  }
  function click(action, values = {}) {
    const target = { dataset: { action, ...values } };
    handlers.click.forEach((callback) => callback({ target: { closest: (selector) => selector === '[data-action]' ? target : null } }));
  }
  return { node, run, submit, click, storage, document };
}

test('calendario: meses completos, años bisiestos y fechas inválidas', () => {
  assert.equal(features.calendarCells(2028,1).filter(Boolean).length, 29);
  assert.equal(features.calendarCells(2026,1).filter(Boolean).length, 28);
  assert.equal(features.calendarCells(2026,9)[3], '2026-10-01');
  assert.equal(features.validDate('2026-02-29'), false);
  assert.equal(features.validDate('2028-02-29'), true);
  assert.equal(features.validDate('2026-13-01'), false);
  for (let month=0;month<12;month++) assert.equal(features.calendarCells(2026,month).length % 7, 0);
});

test('cuatro perfiles tienen Más y separan consultas comerciales del círculo', () => {
  const app = boot();
  for (const role of ['Familia','Cuidador','Médico','Adulto mayor']) {
    app.run(`enterDemo(${JSON.stringify(role)})`);
    assert.match(app.node('#mobile-nav').innerHTML, /data-page="more"/);
    app.run("render('chat')");
    assert.match(app.node('#content').innerHTML, /id="chat-form"/);
    assert.match(app.node('#content').innerHTML, /send-photo/);
    assert.match(app.node('#content').innerHTML, /send-audio/);
    assert.doesNotMatch(app.node('#content').innerHTML, /caregiver-inbox/);
  }
  app.run("enterDemo('Médico'); render('inquiries')");
  assert.equal(app.run('state.page'), 'today');
  app.run("enterDemo('Cuidador'); render('marketplace')");
  assert.equal(app.run('state.page'), 'today');
});

test('consulta → respuesta → aceptación persiste al recargar y salir', () => {
  const app = boot();
  app.run("enterDemo('Familia'); state.contactCaregiverId='cg1'");
  app.node('#caregiver-message').value = '¿Puedes acompañar a Elena por la mañana?';
  app.submit('caregiver-contact-form');
  assert.equal(app.run('state.caregiverChats.length'), 1);
  app.run("showLogin(); enterDemo('Cuidador')");
  app.click('open-inquiry', { id: 'cg1' });
  assert.match(app.node('#content').innerHTML, /acompañar a Elena/);
  app.submit('reply', { reply:true, dataset:{ caregiverId:'cg1' }, message:'Sí, tengo disponibilidad.' });
  assert.equal(app.run('state.page'), 'inquiries');
  assert.equal(app.run("inquiryStatus('cg1')"), 'Respondida');
  app.click('inquiry-status', { id:'cg1', status:'Aceptada' });
  app.run("showLogin(); enterDemo('Familia'); state.contactCaregiverId='cg1'; render('marketplace')");
  assert.match(app.node('#content').innerHTML, /Sí, tengo disponibilidad/);
  assert.match(app.node('#content').innerHTML, /Aceptada/);
  const restored = boot(app.storage);
  assert.equal(restored.run('state.caregiverChats.length'), 2);
  assert.equal(restored.run("inquiryStatus('cg1')"), 'Aceptada');
});

test('texto, foto y audio funcionan también para Adulto mayor y conservan el borrador', () => {
  const app=boot();
  app.run("enterDemo('Adulto mayor')");
  app.node('#chat-message').value='Hola familia ❤️';
  app.submit('chat-form');
  assert.equal(app.run('state.chat.at(-1).text'), 'Hola familia ❤️');
  app.run("chatDrafts['Adulto mayor']='Nos vemos pronto'");
  app.click('send-photo');
  assert.equal(app.run('state.chat.at(-1).type'),'photo');
  assert.match(app.node('#content').innerHTML,/Nos vemos pronto/);
  app.click('send-audio');
  assert.equal(app.run('state.chat.at(-1).role'),'Adulto mayor');
  assert.match(app.node('#content').innerHTML,/audio controls/);
});

test('controles con fecha y hora: guardar, evitar duplicados y conservar al recargar', () => {
  const app=boot();
  app.run("enterDemo('Médico')");
  app.node('#appointment-title').value='Control de ejemplo';
  app.node('#appointment-date').value='2027-02-10';
  app.node('#appointment-time').value='11:45';
  app.node('#appointment-location').value='Consulta ficticia';
  app.submit('appointment-form');
  assert.equal(app.run('state.appointments.length'), 6);
  assert.match(app.node('#content').innerHTML,/10 de febrero de 2027/);
  assert.match(app.node('#content').innerHTML,/11:45/);
  app.submit('appointment-form');
  assert.equal(app.run('state.appointments.length'), 6);
  assert.equal(boot(app.storage).run('state.appointments.length'), 6);
  app.run("enterDemo('Cuidador')");
  app.submit('appointment-form');
  assert.equal(app.run('state.appointments.length'), 6);
});

test('preferencias por perfil y permisos de edición farmacológica', () => {
  const app=boot();
  app.run("enterDemo('Familia')");
  app.click('set-theme',{value:'dark'});
  app.click('set-size',{value:'large'});
  assert.equal(app.document.documentElement.dataset.theme,'dark');
  app.run("enterDemo('Cuidador')");
  assert.equal(app.document.documentElement.dataset.theme,'light');
  app.click('delete-medication',{id:'m1'});
  assert.equal(app.run('state.medications.length'),3);
  app.run("enterDemo('Familia')");
  assert.equal(app.document.documentElement.dataset.textSize,'large');
  app.click('reset');
  assert.equal(app.document.documentElement.dataset.theme,'dark');
});

test('el juego de parejas permite completar una partida', () => {
  const app=boot();
  app.run("enterDemo('Adulto mayor'); render('entertainment')");
  assert.equal(app.run('memoryGame.cards.length'),8);
  const pairs=JSON.parse(app.run('JSON.stringify(memoryGame.cards)'));
  for (const symbol of new Set(pairs)) pairs.forEach((card,index)=>{if(card===symbol) app.click('memory-card',{index:String(index)});});
  assert.equal(app.run('memoryGame.matched.length'),8);
  assert.match(app.node('#content').innerHTML,/Encontraste todas las parejas/);
});

test('sesión inválida y datos de agenda dañados no impiden abrir la demo', () => {
  const storage = new Map([
    ['agecare-demo-session-v1','constructor'],
    ['agecare-demo-state-v4', JSON.stringify({role:'Familia', caregiverChats:null, appointments:[{date:'2026-02-30'}], inquiryStatuses:{cg1:'inventado'}})],
  ]);
  const app=boot(storage);
  assert.equal(app.run('currentRole'),null);
  assert.equal(app.run('state.caregiverChats.length'),0);
  assert.equal(app.run('state.appointments.length'),0);
  assert.equal(app.run("inquiryStatus('cg1')"),'Pendiente');
});

test('el texto de los mensajes se presenta como texto y no como HTML', () => {
  const app=boot();
  app.run("enterDemo('Familia')");
  app.node('#chat-message').value='<img src=x onerror=alert(1)>';
  app.submit('chat-form');
  assert.match(app.node('#content').innerHTML,/&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.doesNotMatch(app.node('#content').innerHTML,/<img src=x/);
});
