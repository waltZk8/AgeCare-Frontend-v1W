import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

// Medición de los pares de tokens. No equivale a auditar el CSS computado de toda la UI.
const css = await readFile(new URL('../visual-accessibility.css', import.meta.url), 'utf8');
const rules = [...css.matchAll(/^(:root[^\n{]*)\{([^{}]*)\}/gm)].map(([_,selector,body], order) => ({selector,body,order}));
function tokens(context) {
  const variables = {};
  const matches = rules.flatMap(rule => rule.selector.split(',').map(selector => {
    if (!/^:root(?:\[data-[\w-]+="[^"]+"\])*$/.test(selector.trim())) return null;
    const attributes = [...selector.matchAll(/\[data-([\w-]+)="([^"]+)"\]/g)];
    return attributes.every(([_,key,value])=> context[key] === value) ? {...rule,specificity:attributes.length} : null;
  }).filter(Boolean)).sort((a,b)=>a.specificity-b.specificity || a.order-b.order);
  for (const rule of matches) for (const [_,key,value] of rule.body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) variables[key]=value.trim();
  const resolve = (value, depth=0) => {
    if (depth > 10) throw new Error('Variable circular');
    return value.replace(/var\((--[\w-]+)\)/g,(_,key)=>resolve(variables[key],depth+1));
  };
  return key=>resolve(variables[key]);
}
function luminance(hex) {
  const value = hex.slice(1);
  const full = value.length === 3 ? [...value].map(c=>c+c).join('') : value;
  const channels = [0,2,4].map(i=>parseInt(full.slice(i,i+2),16)/255).map(c=>c<=0.04045?c/12.92:((c+0.055)/1.055)**2.4);
  return channels[0]*0.2126+channels[1]*0.7152+channels[2]*0.0722;
}
function contrast(a,b) { const values=[luminance(a),luminance(b)].sort((x,y)=>y-x); return (values[0]+0.05)/(values[1]+0.05); }
const pairs = [['--navy','--paper'],['--navy','--surface-subtle'],['--muted','--paper'],['--on-brand','--teal'],['--tint-ink','--teal-soft'],['--purple-ink','--purple-tint'],['--gold-ink','--gold-tint'],['--section-ink','--section-tint']];

test('tokens de texto: contraste mínimo 4,5 en temas, alto contraste, perfiles y secciones', () => {
  for (const theme of ['light','dark']) for (const high of ['false','true']) for (const role of ['family','caregiver','doctor','elder']) for (const page of ['today','health','routine','chat','marketplace','accessibility']) {
    const values=tokens({theme,contrast:high,role,page});
    for (const [foreground,background] of pairs) {
      const ratio=contrast(values(foreground),values(background));
      assert.ok(ratio>=4.5,`${theme}/${high}/${role}/${page}: ${foreground} sobre ${background}: ${ratio.toFixed(2)}`);
    }
  }
});

test('texto principal y acción del adulto mayor alcanzan 7:1 en los tokens', () => {
  for (const theme of ['light','dark']) for (const high of ['false','true']) {
    const values=tokens({theme,contrast:high,role:'elder',page:'today'});
    for (const pair of [['--navy','--paper'],['--navy','--section-tint'],['--on-brand','--teal']]) assert.ok(contrast(values(pair[0]),values(pair[1]))>=7,`${theme}/${high}: ${pair.join('/')}`);
  }
});
