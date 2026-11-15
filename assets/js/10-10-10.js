'use strict';
const KEY='darts-challenge-v1', LIBRARY_KEY='darts-challenge-games-v1', kinds=['rtw','scoring','checkout'];
const disciplineNames=['Singles','Scoring','Checkouts'];
const disciplineHints=['0–3 Punkte pro Zahl','0–9 Punkte pro Aufnahme','? Offen · ✓ Getroffen · ✕ Nicht getroffen'];
const disciplineExplanations=[
'Trefft die 10 zufällig gezogenen Zahlen (1–20) mit je drei Pfeilen. Schüler*innen bis einschließlich 12 Jahre dürfen auch Double- und Triple-Treffer in der Zielzahl werten; für alle anderen zählt nur das Single-Feld.',
'Legt eine Zielzahl fest (z. B. 20 oder 19) und spielt 10 Aufnahmen mit je drei Pfeilen darauf. Single = 1 Punkt, Double = 2 Punkte, Triple = 3 Punkte; Treffer anderer Zahlen zählen 0.',
'Checkt die 10 zufällig gezogenen Werte (41–60) mit höchstens drei Pfeilen je Checkout. Schüler*innen bis einschließlich 12 Jahre dürfen mit Single-Out beenden; für alle anderen gilt Double-Out. Erfolg zählt 1 Punkt, Fehlversuch 0.'
];
function draw(min,max,n){const a=Array.from({length:max-min+1},(_,i)=>i+min);for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a.slice(0,n)}
function fresh(names={}){return {checkoutStateVersion:2,nameA:names.nameA||'',nameB:names.nameB||'',rtw:draw(1,20,10),checkout:draw(41,60,10),scores:Object.fromEntries(kinds.map(k=>[k,[Array(10).fill(''),Array(10).fill('')]]))}}
function valid(s){return s&&['rtw','checkout'].every(k=>Array.isArray(s[k])&&s[k].length===10&&new Set(s[k]).size===10&&s[k].every(n=>Number.isInteger(n)&&n>=(k==='rtw'?1:41)&&n<=(k==='rtw'?20:60)))&&kinds.every(k=>Array.isArray(s.scores?.[k])&&s.scores[k].length===2&&s.scores[k].every(a=>Array.isArray(a)&&a.length===10&&a.every(v=>v===''||Number.isInteger(v)&&v>=0&&v<=999)))&&['nameA','nameB'].every(k=>typeof s[k]==='string')}

function isComplete(game){return kinds.every(k=>game.scores[k].every(row=>row.every(v=>v!=='')))}
function makeRecord(game){return {startedAt:new Date().toISOString(),endedAt:null,wasComplete:false,id:globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+'-'+Math.random().toString(36).slice(2),createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),game}}
function loadLibrary(){try{const data=JSON.parse(localStorage.getItem(LIBRARY_KEY));if(data&&Array.isArray(data.games)){const games=data.games.filter(r=>r&&typeof r.id==='string'&&typeof r.createdAt==='string'&&typeof r.updatedAt==='string'&&valid(r.game));if(games.length)return {activeId:games.some(r=>r.id===data.activeId)?data.activeId:games[0].id,games}}}catch{}let old;try{old=JSON.parse(localStorage.getItem(KEY))}catch{}const record=makeRecord(valid(old)?old:fresh());return {activeId:record.id,games:[record]}}
let library=loadLibrary(),state=library.games.find(r=>r.id===library.activeId).game;
for(const r of library.games){r.startedAt=r.startedAt||r.createdAt;if(typeof r.wasComplete!=='boolean')r.wasComplete=isComplete(r.game);r.endedAt=r.endedAt||null;}
function save(){const record=library.games.find(r=>r.id===library.activeId);record.game=state;record.updatedAt=new Date().toISOString();const done=isComplete(state);if(done&&!record.wasComplete)record.endedAt=record.updatedAt;if(!done)record.endedAt=null;record.wasComplete=done;try{localStorage.setItem(LIBRARY_KEY,JSON.stringify(library));document.getElementById('status').textContent='✓ '+library.games.length+' Spiel'+(library.games.length===1?'':'e')+' lokal gespeichert'}catch{document.getElementById('status').textContent='Speichern fehlgeschlagen – Ergebnisse bitte drucken'}renderGameList();renderResults()}
function renderGameList(){const list=document.getElementById('game-list');list.replaceChildren();library.games.forEach((r,index)=>{const g=r.game,done=kinds.every(k=>g.scores[k].every(row=>row.every(v=>v!==''))),option=document.createElement('option');option.value=r.id;option.textContent='Spiel '+(index+1)+' · '+(g.nameA.trim()||'Spieler*in A')+' gegen '+(g.nameB.trim()||'Spieler*in B')+' · '+new Date(r.createdAt).toLocaleDateString('de-DE')+' · '+(done?'Abgeschlossen':'In Bearbeitung');list.append(option)});list.value=library.activeId;const current=library.games.find(r=>r.id===library.activeId);document.getElementById('game-info').textContent='Start: '+formatTime(current.startedAt)+' · Ende: '+(current.endedAt?formatTime(current.endedAt):isComplete(current.game)?'Nicht erfasst':'Noch offen')+' · '+library.games.length+' gespeicherte Spiele'}

function formatTime(value){return value&&Number.isFinite(Date.parse(value))?new Date(value).toLocaleString('de-DE',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit'}):'Nicht erfasst'}
function resultFor(game){const disciplines=kinds.map(k=>{const done=game.scores[k].every(row=>row.every(v=>v!==''));const sums=game.scores[k].map(row=>row.reduce((a,v)=>a+(v===''?0:v),0));return {done,sums,points:done?(sums[0]===sums[1]?[1,1]:sums[0]>sums[1]?[2,0]:[0,2]):[0,0]}});return {disciplines,done:disciplines.every(d=>d.done),totals:[0,1].map(p=>disciplines.reduce((a,d)=>a+d.points[p],0))}}
function renderResults(){const body=document.getElementById('results-body');body.replaceChildren();library.games.forEach((r,index)=>{const g=r.game,result=resultFor(g),nameA=g.nameA.trim()||'Spieler*in A',nameB=g.nameB.trim()||'Spieler*in B';const row=document.createElement('tr');const winner=!result.done?'In Bearbeitung':result.totals[0]===result.totals[1]?'Unentschieden':(result.totals[0]>result.totals[1]?nameA:nameB)+' gewinnt';const values=['Spiel '+(index+1)+' · '+nameA+' / '+nameB,formatTime(r.startedAt),r.endedAt?formatTime(r.endedAt):result.done?'Nicht erfasst':'Noch offen',...result.disciplines.map(d=>d.done?d.sums.join(' : '):'–'),result.done?result.totals.join(' : '):'–',winner];values.forEach(value=>{const td=document.createElement('td');td.textContent=value;row.append(td)});const td=document.createElement('td'),button=document.createElement('button');button.textContent=r.id===library.activeId?'Aktuell':'Anzeigen';button.disabled=r.id===library.activeId;button.onclick=()=>{switchGame(r.id);document.getElementById('game-list').focus()};td.append(button);const remove=document.createElement('button');remove.textContent='Löschen';remove.className='danger';remove.setAttribute('aria-label','Spiel von '+nameA+' und '+nameB+' löschen');remove.onclick=()=>askDelete(r.id);td.append(remove);row.append(td);body.append(row)})}

function switchGame(id){if(id===library.activeId)return;const record=library.games.find(r=>r.id===id);if(!record)return;save();library.activeId=id;state=record.game;render()}
function newGame(){save();const game=fresh(state);const record=makeRecord(game);library.games.push(record);library.activeId=record.id;state=record.game;render()}

function player(p){return state[p?'nameB':'nameA'].trim()||'Spieler*in '+(p?'B':'A')}
function render(){
for(const id of ['nameA','nameB'])document.getElementById(id).value=state[id];
const container=document.getElementById('disciplines');
container.replaceChildren();
kinds.forEach((k,idx)=>{
const sec=document.createElement('section');
sec.innerHTML='<div class="section-head"><span class="num">0'+(idx+1)+'</span><h2>'+disciplineNames[idx]+'</h2><span class="hint">'+disciplineHints[idx]+'</span></div><details class="discipline-help"><summary>Ablauf &amp; Ziel</summary><p>'+disciplineExplanations[idx]+'</p></details><div class="scroll"><table><thead><tr><th>Spieler*in / Ziel</th></tr></thead><tbody></tbody></table></div>';
sec.querySelector('.discipline-help summary').tabIndex=kinds.indexOf(k)*20+1;
const head=sec.querySelector('tr');
(k==='scoring'?Array.from({length:10},(_,i)=>i+1):state[k]).forEach(n=>{
const th=document.createElement('th');
th.className='target';
th.textContent=n;
head.append(th);
});
const sum=document.createElement('th');
sum.textContent='Σ';
head.append(sum);
for(let p=0;p<2;p++){
const tr=document.createElement('tr'),th=document.createElement('th');
th.scope='row';
th.dataset.player=p;
th.textContent=player(p);
tr.append(th);
for(let i=0;i<10;i++){
const td=document.createElement('td'),input=document.createElement(k==='checkout'?'button':'input');
input.dataset.kind=k;
input.dataset.p=p;
input.dataset.i=i;
input.className='score-input';
input.tabIndex=kinds.indexOf(k)*20+i*2+p+1;
if(k==='checkout'){
input.type='button';
input.textContent='?';
input.dataset.status='undefined';
input.className='score-input checkout-symbol';
input.addEventListener('click',()=>{
const value=state.scores[k][p][i];
state.scores[k][p][i]=value===''?1:value===1?0:'';
update();
save();
});
input.addEventListener('keydown',e=>{
if(e.key==='Enter'&&!e.repeat){
e.preventDefault();
if(state.scores[k][p][i]!=='')focusNext(k,p,i);
}
});
}else{
input.type='number';
input.min=0;
input.max=k==='rtw'?3:9;
input.step=1;
input.inputMode='numeric';
input.value=state.scores[k][p][i];
input.placeholder='–';
input.addEventListener('input',()=>{
const raw=input.value,n=input.valueAsNumber,ok=raw!==''&&Number.isInteger(n)&&n>=0&&n<=Number(input.max);
input.setCustomValidity(raw===''||ok?'':'Bitte eine ganze Zahl von 0 bis '+input.max+' eingeben.');
state.scores[k][p][i]=ok?n:'';
update();
save();
});
input.addEventListener('keydown',e=>{
if(e.key==='Enter'&&!e.repeat){
e.preventDefault();
if(input.value!==''&&input.checkValidity())focusNext(k,p,i);
else input.reportValidity();
}
});
}
td.append(input);
tr.append(td);
}
const td=document.createElement('td');
td.className='total';
td.id=k+p;
tr.append(td);
sec.querySelector('tbody').append(tr);
}
container.append(sec);
});
update();
save();
}
function update(){refreshCells();const pts=[[],[]];let complete=0;kinds.forEach(k=>{const sums=state.scores[k].map(a=>a.reduce((s,n)=>s+(n===''?0:n),0));for(let p=0;p<2;p++)document.getElementById(k+p).textContent=sums[p];const done=state.scores[k].every(a=>a.every(v=>v!==''));if(done)complete++;for(let p=0;p<2;p++)pts[p].push(done?(sums[p]===sums[1-p]?1:sums[p]>sums[1-p]?2:0):null)});const tbody=document.getElementById('summary');tbody.replaceChildren();for(let p=0;p<2;p++){const tr=document.createElement('tr');[player(p),...pts[p].map(v=>v===null?'–':v),pts[p].reduce((a,b)=>a+(b||0),0)].forEach((v,i)=>{const cell=document.createElement(i===0?'th':'td');cell.textContent=v;tr.append(cell)});tbody.append(tr)}const totals=pts.map(a=>a.reduce((s,v)=>s+(v||0),0));document.getElementById('result').textContent=complete===3?(totals[0]===totals[1]?'Unentschieden – starkes Match!':player(totals[0]>totals[1]?0:1)+' gewinnt das Match!'):complete+' von 3 Disziplinen abgeschlossen';}
for(const id of ['nameA','nameB'])document.getElementById(id).addEventListener('input',e=>{state[id]=e.target.value;document.querySelectorAll('[data-player]').forEach(el=>el.textContent=player(Number(el.dataset.player)));update();save()});

function refreshCells(){document.querySelectorAll('.score-input').forEach(input=>{const k=input.dataset.kind,p=Number(input.dataset.p),i=Number(input.dataset.i),value=state.scores[k][p][i];let label=player(p)+', '+(k==='rtw'?'Singles':k==='scoring'?'Scoring':'Check?')+', '+(k==='scoring'?'Aufnahme '+(i+1):'Ziel '+state[k][i]);if(k==='checkout'){const status=value===''?'Nicht definiert':value===1?'Getroffen':'Nicht getroffen';input.textContent=value===''?'?':value===1?'✓':'✕';input.dataset.status=value===''?'undefined':value===1?'hit':'miss';label+=': '+status+'. Klicken zum Ändern';input.title=status+' · Klicken: ? → ✓ → ✕ → ?'}input.setAttribute('aria-label',label);})}
function nextEntry(k,p,i){if(p===0)return {k,p:1,i};if(i<9)return {k,p:0,i:i+1};const next=kinds[kinds.indexOf(k)+1];return next?{k:next,p:0,i:0}:null}
function focusNext(k,p,i){const n=nextEntry(k,p,i);if(!n)return;const input=Array.from(document.querySelectorAll('.score-input')).find(el=>el.dataset.kind===n.k&&Number(el.dataset.p)===n.p&&Number(el.dataset.i)===n.i);if(input){input.focus();if(input.type==='number')input.select()}}

let pendingDeleteId=null;
function askDelete(id){const r=library.games.find(r=>r.id===id);if(!r)return;pendingDeleteId=id;document.getElementById('delete-description').textContent=(r.game.nameA.trim()||'Spieler*in A')+' gegen '+(r.game.nameB.trim()||'Spieler*in B')+' · Start: '+formatTime(r.startedAt);document.getElementById('delete-error').textContent='';document.getElementById('delete-dialog').showModal();document.getElementById('delete-cancel').focus()}
function deleteGame(){const id=pendingDeleteId;if(!id||!library.games.some(r=>r.id===id))return;const games=library.games.filter(r=>r.id!==id);if(!games.length)games.push(makeRecord(fresh()));const activeId=games.some(r=>r.id===library.activeId)?library.activeId:games[0].id;const next={activeId,games};try{localStorage.setItem(LIBRARY_KEY,JSON.stringify(next));localStorage.removeItem(KEY)}catch{document.getElementById('delete-error').textContent='Löschen konnte nicht gespeichert werden. Bitte erneut versuchen.';return}library=next;state=games.find(r=>r.id===activeId).game;pendingDeleteId=null;document.getElementById('delete-dialog').close();render()}
document.getElementById('delete-cancel').onclick=()=>{pendingDeleteId=null;document.getElementById('delete-dialog').close()};
document.getElementById('delete-dialog').addEventListener('cancel',()=>{pendingDeleteId=null});
document.getElementById('delete-confirm').onclick=deleteGame;

document.getElementById('new').onclick=newGame;
document.getElementById('game-list').addEventListener('change',e=>switchGame(e.target.value));
document.getElementById('print').onclick=()=>{document.body.classList.remove('print-results');window.print()};
document.getElementById('print-results').onclick=()=>{
const cleanup=()=>document.body.classList.remove('print-results');
document.body.classList.add('print-results');
window.addEventListener('afterprint',cleanup,{once:true});
window.print();
};
render();
