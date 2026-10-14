import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import test from 'node:test';

const require = createRequire(import.meta.url);
const features = require('../mvp-features.js');
const scripts = await Promise.all(['mvp-auth.js', 'mvp-features.js', 'mvp-accessibility.js', 'mvp-games.js', 'app.js'].map((name) => readFile(new URL(`../${name}`, import.meta.url), 'utf8')));

// Entorno de DOM mínimo: ejecuta el código y sus eventos sin afirmar validación visual.
function boot(storage = new Map()) {
  const nodes = new Map();
  const handlers = {};
  const scrollCalls = [];
  const window = { scrollY:0, scrollTo(options) { scrollCalls.push(options); this.scrollY = options.top; }, addEventListener() {} };
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
    document, window, console,
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
    // HTML lleva data-page para CSS, pero nunca es un enlace de navegación.
    handlers.click.forEach((callback) => callback({ target: { closest: (selector) => selector === '[data-action]' ? target : selector === '[data-page]' ? document.documentElement : null } }));
  }
  return { node, run, submit, click, storage, document, window, scrollCalls };
}

test('calendario compartido: clics con HTML data-page conservan sección, desplazamiento y permisos', () => {
  const app = boot();
  for (const role of ['Familia','Cuidador','Médico','Adulto mayor']) {
    app.run(`enterMvp(${JSON.stringify(role)}); render('calendar'); calendarYear=2026; calendarMonth=9;`);
    app.window.scrollY = 450;
    app.click('calendar-next');
    assert.equal(app.run('state.page'), 'calendar');
    assert.equal(app.run('calendarMonth'), 10);
    assert.equal(app.scrollCalls.at(-1).top, 450);
    assert.equal(app.node('#content').innerHTML.includes('id="appointment-form"'), ['Médico','Cuidador','Familia'].includes(role));
    const count = app.run('state.appointments.length');
    if (!['Médico','Cuidador','Familia'].includes(role)) { app.click('delete-appointment',{ id:'a1' }); assert.equal(app.run('state.appointments.length'), count); }
  }
});

test('cada apertura exige acceso aunque exista sesión previa, sin borrar mensajes ni tema', () => {
  const app=boot(); app.run("enterMvp('Familia'); setPreference('theme','dark')");
  app.node('#chat-message').value='Mensaje conservado'; app.submit('chat-form');
  app.storage.set('agecare-mvp-session-v1','Familia');
  const reopened=boot(app.storage);
  assert.equal(reopened.run('currentRole'),null);
  assert.equal(reopened.document.documentElement.dataset.theme,'dark');
  assert.equal(reopened.run('state.chat.at(-1).text'),'Mensaje conservado');
  reopened.run("enterMvp('Cuidador')"); assert.equal(reopened.document.documentElement.dataset.theme,'dark');
});

test('Rosa no puede ver, responder ni aceptar una consulta dirigida a Marta', () => {
  const app=boot(); app.run("enterMvp('Familia'); state.contactCaregiverId='cg4'");
  app.node('#caregiver-message').value='Solo Marta'; app.submit('caregiver-contact-form');
  app.run("enterMvp('Cuidador'); render('inquiries')");
  assert.doesNotMatch(app.node('#content').innerHTML,/Solo Marta/);
  app.click('open-inquiry',{id:'cg4'}); assert.equal(app.run('selectedInquiry'),null);
  app.submit('reply',{reply:true,dataset:{caregiverId:'cg4'},message:'No autorizado'});
  assert.equal(app.run('state.caregiverChats.length'),1);
  app.click('inquiry-status',{id:'cg4',status:'Aceptada'});
  assert.equal(app.run("inquiryStatus('cg4')"),'Pendiente');
});

test('Cuidador modifica controles y Familia puede eliminar citas', () => {
  const app=boot(); app.run("enterMvp('Cuidador'); render('calendar')");
  app.click('edit-appointment',{id:'a1'});
  app.node('#appointment-title').value='Control reprogramado';
  app.node('#appointment-date').value='2026-10-12'; app.node('#appointment-time').value='11:30';
  app.node('#appointment-location').value='Consulta de ejemplo'; app.submit('appointment-form');
  assert.equal(app.run("state.appointments.find(item=>item.id==='a1').date"),'2026-10-12');
  assert.equal(app.run('state.appointments.length'),5);
  app.run("enterMvp('Familia'); render('calendar')");
  app.click('delete-appointment',{id:'a1'}); app.click('edit-appointment',{id:'a1'});
  assert.equal(app.run('editAppointmentId'),null); assert.equal(app.run('state.appointments.length'),4);
});

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
    app.run(`enterMvp(${JSON.stringify(role)})`);
    assert.match(app.node('#mobile-nav').innerHTML, /data-page="more"/);
    app.run("render('chat')");
    assert.match(app.node('#content').innerHTML, /id="chat-form"/);
    assert.match(app.node('#content').innerHTML, /send-photo/);
    assert.match(app.node('#content').innerHTML, /send-audio/);
    assert.doesNotMatch(app.node('#content').innerHTML, /caregiver-inbox/);
  }
  app.run("enterMvp('Médico'); render('inquiries')");
  assert.equal(app.run('state.page'), 'today');
  app.run("enterMvp('Cuidador'); render('marketplace')");
  assert.equal(app.run('state.page'), 'today');
});

test('consulta → respuesta → aceptación persiste al recargar y salir', () => {
  const app = boot();
  app.run("enterMvp('Familia'); state.contactCaregiverId='cg1'");
  app.node('#caregiver-message').value = '¿Puedes acompañar a Elena por la mañana?';
  app.submit('caregiver-contact-form');
  assert.equal(app.run('state.caregiverChats.length'), 1);
  app.run("showLogin(); enterMvp('Cuidador')");
  app.click('open-inquiry', { id: 'cg1' });
  assert.match(app.node('#content').innerHTML, /acompañar a Elena/);
  app.submit('reply', { reply:true, dataset:{ caregiverId:'cg1' }, message:'Sí, tengo disponibilidad.' });
  assert.equal(app.run('state.page'), 'inquiries');
  assert.equal(app.run("inquiryStatus('cg1')"), 'Respondida');
  app.click('inquiry-status', { id:'cg1', status:'Aceptada' });
  app.run("showLogin(); enterMvp('Familia'); state.contactCaregiverId='cg1'; render('marketplace')");
  assert.match(app.node('#content').innerHTML, /Sí, tengo disponibilidad/);
  assert.match(app.node('#content').innerHTML, /Aceptada/);
  const restored = boot(app.storage);
  assert.equal(restored.run('state.caregiverChats.length'), 2);
  assert.equal(restored.run("inquiryStatus('cg1')"), 'Aceptada');
});

test('texto, foto y audio funcionan también para Adulto mayor y conservan el borrador', () => {
  const app=boot();
  app.run("enterMvp('Adulto mayor')");
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
  app.run("enterMvp('Médico')");
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
  app.run("enterMvp('Cuidador')");
  app.submit('appointment-form');
  assert.equal(app.run('state.appointments.length'), 6);
});

test('preferencias por perfil y permisos de edición farmacológica', () => {
  const app=boot();
  app.run("enterMvp('Familia')");
  app.click('set-theme',{value:'dark'});
  app.click('set-size',{value:'large'});
  assert.equal(app.document.documentElement.dataset.theme,'dark');
  app.run("enterMvp('Cuidador')");
  assert.equal(app.document.documentElement.dataset.theme,'dark');
  app.click('delete-medication',{id:'m1'});
  assert.equal(app.run('state.medications.length'),3);
  app.run("enterMvp('Familia')");
  assert.equal(app.document.documentElement.dataset.textSize,'large');
  app.click('reset');
  assert.equal(app.document.documentElement.dataset.theme,'dark');
});

test('el juego de parejas permite completar una partida', () => {
  const app=boot();
  app.run("enterMvp('Adulto mayor'); render('entertainment')");
  assert.equal(app.run('memoryGame.cards.length'),8);
  const pairs=JSON.parse(app.run('JSON.stringify(memoryGame.cards)'));
  for (const symbol of new Set(pairs)) pairs.forEach((card,index)=>{if(card===symbol) app.click('memory-card',{index:String(index)});});
  assert.equal(app.run('memoryGame.matched.length'),8);
  assert.match(app.node('#content').innerHTML,/Encontraste todas las parejas/);
});

test('sesión inválida y datos de agenda dañados no impiden abrir el MVP', () => {
  const storage = new Map([
    ['agecare-mvp-session-v1','constructor'],
    ['agecare-mvp-state-v4', JSON.stringify({role:'Familia', caregiverChats:null, appointments:[{date:'2026-02-30'}], inquiryStatuses:{cg1:'inventado'}})],
  ]);
  const app=boot(storage);
  assert.equal(app.run('currentRole'),null);
  assert.equal(app.run('state.caregiverChats.length'),0);
  assert.equal(app.run('state.appointments.length'),0);
  assert.equal(app.run("inquiryStatus('cg1')"),'Pendiente');
});

test('el texto de los mensajes se presenta como texto y no como HTML', () => {
  const app=boot();
  app.run("enterMvp('Familia')");
  app.node('#chat-message').value='<img src=x onerror=alert(1)>';
  app.submit('chat-form');
  assert.match(app.node('#content').innerHTML,/&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.doesNotMatch(app.node('#content').innerHTML,/<img src=x/);
});

test('accesibilidad: 200 %, contraste, espacio y movimiento persisten por perfil sin borrar conversaciones', () => {
  const app = boot();
  app.run("enterMvp('Familia'); render('accessibility')");
  for (const [pref,value] of [['size','extra'],['contrast','true'],['spacing','true'],['reducedMotion','true']]) app.click('set-preference',{pref,value});
  assert.equal(app.run('state.page'),'accessibility');
  assert.equal(app.document.documentElement.dataset.textSize,'extra');
  assert.equal(app.document.documentElement.dataset.contrast,'true');
  assert.equal(app.document.documentElement.dataset.spacing,'true');
  assert.equal(app.document.documentElement.dataset.motion,'reduced');
  const restored = boot(app.storage);
  restored.run("enterMvp('Familia')");
  assert.equal(restored.document.documentElement.dataset.textSize,'extra');
  restored.run("showLogin(); enterMvp('Médico')");
  assert.equal(restored.document.documentElement.dataset.contrast,'false');
  restored.run("showLogin(); enterMvp('Familia'); render('accessibility')");
  restored.click('reset-preferences');
  assert.equal(restored.document.documentElement.dataset.textSize,'standard');
  assert.equal(restored.run('state.chat.length'),4);
});

test('los cuatro perfiles llegan a Accesibilidad y usan un estado seguro al no tener voz', () => {
  const app = boot();
  for (const role of ['Familia','Cuidador','Médico','Adulto mayor']) {
    app.run(`enterMvp(${JSON.stringify(role)}); render('more')`);
    assert.match(app.node('#content').innerHTML,/data-page="accessibility"/);
    app.run("render('accessibility')");
    assert.equal(app.run('state.page'),'accessibility');
    app.click('read-sample');
    assert.match(app.node('#reading-status').textContent,/no tiene lectura/);
  }
});

test('Salud separa medicinas, bitácora y fichas ficticias; sigue los registros locales', () => {
  const app = boot();
  app.run("enterMvp('Familia'); render('health')");
  assert.match(app.node('#content').innerHTML,/No hay un dispositivo conectado/);
  app.click('health-tab',{tab:'medicines'});
  assert.match(app.node('#content').innerHTML,/Metformina/);
  assert.match(app.node('#content').innerHTML,/Gestionar el plan/);
  app.click('health-tab',{tab:'log'});
  assert.match(app.node('#content').innerHTML,/Observación del desayuno/);
  app.click('health-tab',{tab:'docs'});
  app.click('open-document',{id:'doc1'});
  assert.match(app.node('#content').innerHTML,/Documento ficticio de prueba/);
  app.run("enterMvp('Adulto mayor')");
  app.click('health-tab',{tab:'docs'});
  assert.equal(app.run('state.page'),'health');
  app.run("enterMvp('Cuidador')");
  app.click('take-medication',{id:'m2'});
  app.run("enterMvp('Médico'); render('health')");
  assert.equal(app.run('state.medications.filter(item=>item.taken).length'),2);
  app.click('health-tab',{tab:'medicines'});
  assert.match(app.node('#content').innerHTML,/Gestionar el plan/);
});

test('galería comparte fotos del chat, conserva corazones y limita el paso de fotos', () => {
  const app = boot();
  app.run("enterMvp('Familia')");
  app.click('send-photo');
  const photoId = app.run('state.chat.at(-1).id');
  app.run("enterMvp('Adulto mayor'); render('photos')");
  assert.match(app.node('#content').innerHTML,/Compartida por María/);
  app.click('photo-heart',{id:photoId});
  assert.equal(app.run('state.photoReactions.length'),1);
  app.click('photo-heart',{id:'invalid'});
  assert.equal(app.run('state.photoReactions.length'),1);
  app.click('gallery-mode');
  app.click('photo-next');
  app.click('photo-next');
  assert.equal(app.run('photoIndex'),1);
  app.click('photo-prev');
  app.click('photo-prev');
  assert.equal(app.run('photoIndex'),0);
  const restored = boot(app.storage);
  assert.equal(restored.run('state.photoReactions.length'),1);
  restored.run("enterMvp('Médico'); render('photos')");
  assert.equal(restored.run('state.page'),'today');
});

test('catálogo sin artículos conserva consultas privadas separadas del círculo', () => {
  const app=boot(); app.run("enterMvp('Familia'); state.contactCaregiverId='cg1'");
  app.node('#caregiver-message').value='Consulta privada'; app.submit('caregiver-contact-form');
  assert.doesNotMatch(app.node('#content').innerHTML,/data-action="market-tab"|Andador con asiento/);
  app.run("render('chat')"); assert.doesNotMatch(app.node('#content').innerHTML,/Consulta privada/);
  app.run("render('marketplace')"); assert.match(app.node('#content').innerHTML,/Consulta privada/);
});

test('Familia y Médico crean, editan y eliminan fichas en las cuatro secciones',()=>{
 const app=boot();
 for(const role of ['Familia','Médico']) for(const tab of ['vitals','medicines','log','docs']) {
  app.run(`enterMvp('${role}'); healthTab='${tab}'; render('health')`);
  for(const [key,value] of Object.entries({title:'Registro nuevo',date:'2026-10-12',time:'12:30',value:'Prueba',note:'Detalle ficticio'})) app.node('#entry-'+key).value=value;
  app.submit('health-entry-form'); const id=app.run('state.healthEntries.at(-1).id');
  assert.equal(app.run('state.healthEntries.at(-1).section'),tab);
  app.click('health-edit',{id}); app.node('#entry-title').value='Editado'; app.submit('health-entry-form');
  assert.equal(app.run('state.healthEntries.at(-1).title'),'Editado');
  assert.equal(boot(app.storage).run('state.healthEntries.at(-1).title'),'Editado');
  app.click('health-delete',{id}); assert.equal(app.run(`state.healthEntries.some(item=>item.id==='${id}')`),false);
 }
 app.run("enterMvp('Cuidador')"); const count=app.run('state.healthEntries.length');
 app.submit('health-entry-form'); app.click('health-delete',{id:'hv1'}); assert.equal(app.run('state.healthEntries.length'),count);
});

test('siete identidades: cada cuidadora recibe y responde solo a su consulta',()=>{
 const app=boot();
 for(let i=1;i<=7;i++) {
  app.run(`enterMvp('Familia'); state.contactCaregiverId='cg${i}'`);
  app.node('#caregiver-message').value='Privado '+i; app.submit('caregiver-contact-form');
 }
 for(let i=1;i<=7;i++) {
  app.run(`enterMvp('Cuidador','cg${i}'); render('inquiries')`);
  app.click('open-inquiry',{id:'cg'+i}); assert.match(app.node('#content').innerHTML,new RegExp('Privado '+i));
  for(let j=1;j<=7;j++) if(i!==j) assert.doesNotMatch(app.node('#content').innerHTML,new RegExp('Privado '+j));
  app.submit('reply',{reply:true,dataset:{caregiverId:'cg'+i},message:'Respuesta '+i});
  assert.equal(app.run('state.caregiverChats.at(-1).caregiverId'),'cg'+i);
  if(i>1) {
   app.run("render('health')"); assert.notEqual(app.run('state.page'),'health');
   assert.equal(app.run(`visibleNotifications().every(item=>item.caregiverId==='cg${i}')`),true);
  }
 }
});

test('asistente local usa registros y no recomienda tratamientos',()=>{
 const app=boot(); app.run("enterMvp('Familia'); sendAssistant('Resumen del día')");
 assert.match(app.node('#content').innerHTML,/actividades pendientes/);
 app.run("sendAssistant('Cambiar dosis')"); assert.match(app.node('#content').innerHTML,/No puedo evaluar/);
 app.run("enterMvp('Cuidador','cg4'); sendAssistant('Resumen del día')");
 assert.match(app.node('#content').innerHTML,/No tienes acceso al expediente/);
});

test('rutina: horarios se conservan al completar y la vista se ordena cronológicamente', () => {
  const app = boot();
  app.run("enterMvp('Familia'); state.routine.reverse(); render('routine')");
  const html = app.node('#content').innerHTML;
  assert.ok(html.indexOf('08:30') < html.indexOf('10:30'));
  assert.ok(html.indexOf('10:30') < html.indexOf('16:00'));
  assert.match(html,/08:30<\/span>/);
  assert.match(html,/Completada/);
});
