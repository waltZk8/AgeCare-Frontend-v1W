import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';
const require = createRequire(import.meta.url);
const { createReader } = require('../mvp-accessibility.js');
const { preferences } = require('../mvp-features.js');

test('preferencias inválidas recuperan valores seguros y migran los valores anteriores', () => {
  assert.deepEqual(preferences(null), {theme:'light',size:'standard',contrast:false,reducedMotion:false,spacing:false});
  assert.equal(preferences({theme:'dark',size:'large'}).theme,'dark');
  assert.equal(preferences({size:'extra'}).size,'extra');
  assert.equal(preferences({contrast:'false',spacing:'true',size:200}).contrast,false);
  assert.equal(preferences({contrast:'false',spacing:'true',size:200}).spacing,false);
  assert.equal(preferences({size:'invalid'}).size,'standard');
});

function fixture(voices = []) {
  const spoken = [], messages = [];
  let cancellations = 0;
  const host = { SpeechSynthesisUtterance: class { constructor(text) { this.text = text; } },
    speechSynthesis:{getVoices:()=>voices, cancel:()=>cancellations++, speak:(value)=>spoken.push(value)} };
  return {host,spoken,messages,reader:createReader(host,text=>messages.push(text)),cancellations:()=>cancellations};
}

test('lectura rechaza voces remotas y funciona sin soporte de voz', () => {
  const a = fixture([{lang:'es-CL',localService:false}]);
  assert.equal(a.reader.read('Hola'),false);
  assert.equal(a.spoken.length,0);
  assert.match(a.messages.at(-1),/No hay una voz local/);
  const messages = [];
  assert.equal(createReader({},value=>messages.push(value)).read('Hola'),false);
  assert.match(messages[0],/no tiene lectura/);
});

test('lectura local en español se detiene y descarta callbacks de una lectura cancelada', () => {
  const a = fixture([{lang:'en-US',localService:true},{lang:'es-CL',localService:true}]);
  assert.equal(a.reader.read('Hola, Elena'),true);
  assert.equal(a.spoken[0].text,'Hola, Elena');
  assert.equal(a.spoken[0].lang,'es-CL');
  assert.equal(a.spoken[0].rate,0.96);
  a.reader.stop();
  assert.equal(a.cancellations(),2);
  a.spoken[0].onend();
  assert.equal(a.messages.at(-1),'Lectura detenida.');
  a.reader.read('Otro mensaje');
  a.spoken[1].onend();
  assert.equal(a.messages.at(-1),'Lectura terminada.');
});

test('errores del sintetizador mantienen una respuesta clara sin romper la app', () => {
  const a = fixture([{lang:'es',localService:true}]);
  a.host.speechSynthesis.speak = () => { throw new Error('unavailable'); };
  assert.equal(a.reader.read('Hola'),false);
  assert.match(a.messages.at(-1),/No se pudo reproducir/);
  a.host.speechSynthesis.getVoices = () => { throw new Error('unavailable'); };
  assert.equal(a.reader.read('Hola'),false);
  assert.match(a.messages.at(-1),/No se pudo cargar/);
});
