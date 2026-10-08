import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { access, readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const html = await readFile(new URL('index.html', root), 'utf8');
const script = await readFile(new URL('app.js', root), 'utf8');
const style = await readFile(new URL('styles.css', root), 'utf8');
const vercel = JSON.parse(await readFile(new URL('vercel.json', root), 'utf8'));
const featureScript = await readFile(new URL('demo-features.js', root), 'utf8');
const authScript = await readFile(new URL('demo-auth.js', root), 'utf8');

test('incluye entrada, cuatro perfiles, navegación y notificaciones', () => {
  for (const expected of [
    'enter', 'Familia', 'Cuidador', 'Médico', 'Adulto mayor',
    'notifications-button', 'notification-panel',
  ]) assert.ok(html.includes(expected), `falta ${expected}`);
  assert.ok(html.includes('src="assets/welcome-image.png"'));
  assert.ok(html.includes('alt="AgeCare"'));
});

test('incluye flujos del MVP solicitados', () => {
  for (const expected of [
    'familyDashboard', 'caregiverDashboard', 'doctorDashboard', 'adultDashboard',
    'routine-form', 'medication-form', 'chat-form', 'send-audio',
    'marketplacePage', 'contact-caregiver', 'entertainmentPage', 'joke-helped',
    "notify(['Familia', 'Cuidador']", 'read-all', 'reset',
  ]) assert.ok(script.includes(expected), `falta ${expected}`);
});

test('conecta las consultas del marketplace con la bandeja y respuesta de Cuidador', () => {
  for (const expected of [
    'caregiverInboxSection', 'Mensajes de Familia', 'caregiver-reply-form',
    'Nuevo mensaje de Familia', 'Respuesta de la cuidadora', 'state.caregiverChats.push',
  ]) assert.ok(script.includes(expected), `falta ${expected}`);
  assert.ok(style.includes('.caregiver-inbox'));
});

test('diferencia interfaz móvil y tablet accesible', () => {
  assert.ok(style.includes('.app:not(.hidden){display:block;width:min(480px,100%)'));
  assert.ok(style.includes('body.role-adult'));
  assert.ok(style.includes('width:min(960px,100%)'));
  assert.ok(style.includes('.role-adult .mood-button{min-height:125px'));
});

test('incluye retratos ilustrados locales del marketplace', async () => {
  for (const name of ['caregiver-rosa.svg', 'caregiver-ana.svg', 'caregiver-lucia.svg']) {
    await access(new URL(`assets/${name}`, root));
    assert.ok(script.includes(`assets/${name}`));
  }
  await access(new URL('assets/welcome-image.png', root));
});

test('no contiene endpoints ni recursos web externos', () => {
  assert.doesNotMatch(html, /https?:\/\//);
  assert.doesNotMatch(script, /fetch\s*\(|XMLHttpRequest|WebSocket|https?:\/\//);
  assert.doesNotMatch(style, /url\s*\(\s*["']?https?:\/\//);
  assert.doesNotMatch(featureScript + authScript, /fetch\s*\(|XMLHttpRequest|WebSocket|https?:\/\//);
});

test('el logo oficial se conserva byte a byte y los adjuntos son locales', async () => {
  const logo = await readFile(new URL('assets/agecare-logo-oficial.jpeg',root));
  assert.equal(createHash('sha256').update(logo).digest('hex'), 'cb178bcd3d959286ef0599ad1190c16106e4448a011f017f181bfae0daeb0d9d');
  assert.doesNotMatch(html, /brand-mark/);
  assert.match(html, /class="app-logo" src="assets\/agecare-logo-oficial.jpeg"/);
  await access(new URL('assets/demo-photo.svg',root));
  const audio = await readFile(new URL('assets/demo-audio.wav',root));
  assert.equal(audio.toString('ascii',0,4),'RIFF');
  assert.equal(audio.toString('ascii',8,12),'WAVE');
});

test('Vercel bloquea capacidades y conexiones externas', () => {
  const headers = vercel.headers.flatMap((entry) => entry.headers);
  const csp = headers.find((header) => header.key === 'Content-Security-Policy');
  const permissions = headers.find((header) => header.key === 'Permissions-Policy');
  assert.ok(csp.value.includes("connect-src 'none'"));
  assert.ok(csp.value.includes("frame-ancestors 'none'"));
  assert.ok(permissions.value.includes('camera=()'));
  assert.ok(permissions.value.includes('microphone=()'));
});
