/* Actividades recreativas locales, sin puntuación clínica ni límite de tiempo. */
const AgeCareGames = (() => {
  const shapes = [
    {name:'Una casa',points:[[22,76],[22,44],[50,18],[78,44],[78,76]]},
    {name:'Un barco',points:[[18,64],[50,64],[50,16],[78,52],[50,52],[82,64],[68,84],[32,84]]},
    {name:'Una estrella',points:[[50,12],[61,38],[88,38],[67,57],[75,86],[50,69],[25,86],[33,57],[12,38],[39,38]]}
  ];
  const spots = [['sun',81,20,'sol'],['flower',23,79,'flor de la izquierda'],['butterfly',59,54,'mariposa'],['tree',19,32,'árbol'],['path',52,84,'sendero'],['bloom',83,82,'flor de la derecha']];
  const rounds = [['sun','flower','butterfly'],['tree','path','bloom'],['flower','tree','sun']];
  function create() {
    let active = 'dots', shape=0, round=0, size=2, shuffleRound=0;
    let next = 1, dotMessage = 'Empieza por el 1.', pieces = [2,0,3,1], selected = null, found = [], feedback = '';
    const solved = () => pieces.every((piece,index) => piece === index);
    function swap(a,b) { if (![a,b].every(i=>Number.isInteger(i)&&i>=0&&i<pieces.length) || a === b || solved()) return; [pieces[a],pieces[b]]=[pieces[b],pieces[a]]; selected=null; }
    function act(action, data={}) {
      const value = Number(data.index);
      if (action === 'game-select' && ['dots','puzzle','differences'].includes(data.id)) active=data.id;
      if (action === 'game-dot' && value === next && next <= shapes[shape].points.length) { next++; dotMessage = next > shapes[shape].points.length ? `¡Completaste ${shapes[shape].name.toLowerCase()}! ✨` : `Muy bien. Ahora toca el ${next}.`; }
      else if (action === 'game-dot' && next <= shapes[shape].points.length) dotMessage = `Vamos con calma: busca el ${next}.`;
      if (action === 'game-dots-reset') { shape=(shape+1)%shapes.length; next=1; dotMessage='Empieza por el 1.'; }
      if (action === 'game-piece' && Number.isInteger(value) && value>=0 && value<pieces.length && !solved()) {
        if (selected === null) selected=value; else if(selected === value) selected=null; else swap(selected,value);
      }
      if(action === 'game-puzzle-size' && [2,3].includes(value)) { size=value; shuffleRound=0; pieces=Array.from({length:size*size},(_,i)=>(i+1)%(size*size)); selected=null; }
      if (action === 'game-puzzle-reset') { shuffleRound++; const shift=shuffleRound%(size*size-1)+1; pieces=Array.from({length:size*size},(_,i)=>(i+shift)%(size*size)); selected=null; }
      if (action === 'game-difference' && rounds[round].includes(data.id) && !found.includes(data.id)) { found.push(data.id); feedback=found.length===3 ? '¡Encontraste las tres diferencias! 🌼' : `¡La encontraste! Llevas ${found.length} de 3.`; }
      if (action === 'game-difference-hint') { const missing=rounds[round].find(id=>!found.includes(id)); feedback=missing ? `Mira ${spots.find(item=>item[0]===missing)[3]}.` : '¡Ya encontraste las tres!'; }
      if (action === 'game-differences-reset') { round=(round+1)%rounds.length; found=[]; feedback=''; }
    }
    function html() {
      const points=shapes[shape].points;
      const line = points.slice(0,next-1).map(p=>p.join(',')).join(' ')+(next>points.length?' '+points[0].join(','):'');
      return `<section class="recreation-grid" data-game="${active}" aria-label="Juegos tranquilos"><div class="game-menu">${[['dots','🔢 Conecta puntos'],['puzzle','🧩 Rompecabezas'],['differences','🌼 Diferencias']].map(([id,label])=>`<button class="secondary ${active===id?'selected':''}" data-action="game-select" data-id="${id}" aria-pressed="${active===id}">${label}</button>`).join('')}</div>
        <article class="card game-card"><span class="tag">1 · Conecta los puntos</span><h2>🔢 ${shapes[shape].name}, paso a paso</h2><p>Toca los números del 1 al ${points.length} en orden.</p><div class="dots-board"><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><polyline points="${line}" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>${points.map(([x,y],i)=>`<button class="number-dot ${i+1<next?'complete':i+1===next?'next-dot':''}" style="left:${x}%;top:${y}%" data-action="game-dot" data-index="${i+1}" aria-label="Número ${i+1}" ${i+1<next?'disabled':''}>${i+1}</button>`).join('')}</div><p class="game-feedback" role="status">${dotMessage}</p><button class="secondary" data-action="game-dots-reset">Otra figura</button></article>
        <article class="card game-card"><span class="tag">2 · Rompecabezas</span><h2>🌄 Reconstruye el paisaje</h2><p>Arrastra una pieza sobre otra para cambiarlas. También puedes tocar dos piezas.</p><details class="puzzle-guide"><summary>Ver imagen de ayuda</summary><img src="assets/game-garden.svg" alt="Paisaje completo: sol arriba a la derecha, árbol a la izquierda y flores abajo"></details><div class="button-row"><button class="secondary" data-action="game-puzzle-size" data-index="2" aria-pressed="${size===2}">2 × 2 · 4 piezas</button><button class="secondary" data-action="game-puzzle-size" data-index="3" aria-pressed="${size===3}">3 × 3 · 9 piezas</button></div><div class="puzzle-board" style="grid-template-columns:repeat(${size},1fr)">${pieces.map((piece,index)=>`<button class="puzzle-piece ${selected===index?'selected':''}" data-action="game-piece" data-index="${index}" aria-label="Pieza ${piece+1}, posición ${index+1}" aria-pressed="${selected===index}" style="background-size:${size*100}% ${size*100}%;background-position:${piece%size*100/(size-1)}% ${Math.floor(piece/size)*100/(size-1)}%" ${solved()?'disabled':''}></button>`).join('')}</div><p class="game-feedback" role="status">${solved()?'¡El paisaje está completo! 🌻':selected===null?'Elige una pieza para empezar.':'Ahora toca otra pieza para intercambiarlas.'}</p><button class="secondary" data-action="game-puzzle-reset">Mezclar de nuevo</button></article>
        <article class="card game-card differences-card"><span class="tag">3 · Encuentra las diferencias</span><h2>🌼 Mira los dos jardines</h2><p>Hay tres cambios. Tócalos en el segundo jardín.</p><div class="differences-pair"><figure><figcaption>Primer jardín</figcaption>${garden([],round)}</figure><figure><figcaption>Segundo jardín · toca aquí</figcaption><div class="difference-scene">${garden(rounds[round],round)}${spots.map(([id,x,y,label])=>`<button class="difference-hit ${found.includes(id)?'found':''}" style="left:${x}%;top:${y}%" data-action="game-difference" data-id="${id}" aria-label="Revisar ${label}" aria-pressed="${found.includes(id)}">${found.includes(id)?'✓':''}</button>`).join('')}</div></figure></div><p class="game-feedback" role="status">${feedback || `${found.length} de 3 diferencias encontradas.`}</p><div class="button-row"><button class="secondary" data-action="game-difference-hint">Dame una pista</button><button class="secondary" data-action="game-differences-reset">Otro jardín</button></div></article>
      </section>`;
    }
    return { html, act, swap, snapshot:()=>({next,shape,size,round,targets:[...rounds[round]],pieces:[...pieces],found:[...found],solved:solved()}) };
  }
  function garden(changes=[],round=0) {
    return `<svg class="garden-scene" viewBox="0 0 400 280" role="img" aria-label="Jardín con sol, árbol y flores"><rect width="400" height="280" rx="18" fill="${['#d9e7df','#f0dfc8','#dce6f0'][round]}"/><circle cx="325" cy="55" r="27" fill="${changes.includes('sun')?'#d67a4a':'#e4bc4e'}"/><path d="M0 205Q100 130 220 208T400 185V280H0" fill="#8ca782"/><path d="M140 280Q190 210 270 185" fill="none" stroke="${changes.includes('path')?'#a78877':'#e9d9b4'}" stroke-width="25"/><rect x="65" y="98" width="19" height="101" rx="4" fill="#8d705b"/><circle cx="74" cy="90" r="48" fill="${changes.includes('tree')?'#ce935f':'#638572'}"/><circle cx="111" cy="110" r="29" fill="#73917a"/><path d="M90 252V217M333 264V235" stroke="#406551" stroke-width="7"/><g fill="${changes.includes('flower')?'#617bac':'#bd7594'}"><circle cx="90" cy="206" r="12"/><circle cx="77" cy="218" r="12"/><circle cx="102" cy="219" r="12"/><circle cx="90" cy="230" r="12"/></g><circle cx="90" cy="219" r="8" fill="#f0d77f"/><g fill="${changes.includes('bloom')?'#e4bc4e':'#b39bbd'}"><circle cx="332" cy="230" r="17"/></g><circle cx="332" cy="230" r="7" fill="#f0d77f"/>${changes.includes('butterfly')?'':'<g fill="#b580ab"><ellipse cx="223" cy="145" rx="14" ry="19" transform="rotate(-25 223 145)"/><ellipse cx="246" cy="145" rx="14" ry="19" transform="rotate(25 246 145)"/></g><path d="M235 139v28" stroke="#615361" stroke-width="5"/>'}</svg>`;
  }
  return { create };
})();
if (typeof module !== 'undefined') module.exports = AgeCareGames;
