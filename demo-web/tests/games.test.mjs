import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { create } = require('../mvp-games.js');
const { spokenText } = require('../mvp-accessibility.js');

test('puntos: respeta el orden y permite terminar y reiniciar', () => {
  const game=create(); game.act('game-dot',{index:4}); assert.equal(game.snapshot().next,1);
  for(let i=1;i<=5;i++) game.act('game-dot',{index:i});
  assert.equal(game.snapshot().next,6); game.act('game-dot',{index:5}); assert.equal(game.snapshot().next,6);
  game.act('game-dots-reset'); assert.equal(game.snapshot().next,1);
});
test('rompecabezas: intercambia por toque o arrastre, evita índices inválidos y completa', () => {
  const game=create(); const initial=game.snapshot().pieces;
  game.swap(-1,2); assert.deepEqual(game.snapshot().pieces,initial);
  game.swap(0,1);
  for(const index of [1,3,2,3]) game.act('game-piece',{index});
  assert.equal(game.snapshot().solved,true); game.swap(0,1); assert.equal(game.snapshot().solved,true);
  game.act('game-puzzle-reset'); assert.equal(game.snapshot().solved,false);
});
test('diferencias: tres hallazgos únicos, pistas y reinicio', () => {
  const game=create(); for(const id of ['sun','sun','flower','bad','butterfly']) game.act('game-difference',{id});
  assert.deepEqual(game.snapshot().found,['sun','flower','butterfly']);
  game.act('game-differences-reset'); assert.deepEqual(game.snapshot().found,[]);
});
test('voz: sustituye emojis comunes y conserva el significado del texto', () => {
  assert.equal(spokenText('Hola, mamá ❤️'), 'Hola, mamá , con cariño.');
  assert.match(spokenText('Estoy triste 😢'), /triste.*tristeza/);
  assert.equal(spokenText('Control a las 16:00. 🩺'), 'Control a las 16:00.');
});

test('3x3: nueve piezas únicas, solución completa y nueva mezcla válida',()=>{
 const game=create(); game.act('game-puzzle-size',{index:3});
 assert.equal(new Set(game.snapshot().pieces).size,9);
 for(let i=0;i<9;i++) game.swap(i,game.snapshot().pieces.indexOf(i));
 assert.equal(game.snapshot().solved,true);
 game.act('game-puzzle-reset'); assert.equal(game.snapshot().solved,false);
 assert.equal(new Set(game.snapshot().pieces).size,9);
});

test('figuras y diferencias varían sin conservar los aciertos anteriores',()=>{
 const game=create(); const first=game.snapshot().targets;
 game.act('game-differences-reset'); assert.notDeepEqual(game.snapshot().targets,first);
 game.act('game-difference',{id:'sun'}); assert.equal(game.snapshot().found.length,0);
 for(const id of game.snapshot().targets) game.act('game-difference',{id});
 assert.equal(game.snapshot().found.length,3);
 game.act('game-dots-reset'); assert.equal(game.snapshot().shape,1);
 game.act('game-dots-reset'); assert.equal(game.snapshot().shape,2);
 for(let i=1;i<=10;i++) game.act('game-dot',{index:i});
 assert.equal(game.snapshot().next,11);
});
