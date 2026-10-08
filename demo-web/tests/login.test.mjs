import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const require = createRequire(import.meta.url);
const { demoAccounts, authenticateDemo } = require('../demo-auth.js');
const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const app = await readFile(new URL('../app.js', import.meta.url), 'utf8');

test('cada cuenta pública accede exclusivamente a su perfil', () => {
  const expected = ['Familia', 'Cuidador', 'Médico', 'Adulto mayor'];
  assert.deepEqual(Object.values(demoAccounts).map(({ role }) => role), expected);
  for (const [email, account] of Object.entries(demoAccounts)) {
    assert.equal(authenticateDemo(email, account.password), account.role);
    assert.equal(authenticateDemo(` ${email.toUpperCase()} `, account.password), account.role);
    assert.equal(authenticateDemo(email, 'incorrecta'), null);
  }
  assert.equal(authenticateDemo('nadie@agecare.demo', 'Familia123!'), null);
  assert.equal(authenticateDemo(null, 'Familia123!'), null);
});

test('la interfaz exige login y cierre de sesión para cambiar de perfil', () => {
  assert.match(html, /id="login-form"/);
  assert.match(html, /id="login-error"[^>]*role="alert"/);
  assert.match(html, /id="logout"/);
  assert.doesNotMatch(html, /<select id="role"/);
  assert.match(app, /if \(!currentRole\) return;/);
  assert.match(app, /localStorage\.removeItem\(SESSION_KEY\)/);
  assert.match(app, /state\.role = currentRole/);
  assert.match(app, /if \(currentRole\) enterDemo\(currentRole\)/);
});
