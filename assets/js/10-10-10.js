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
function fresh(names={}){return {checkoutStateVersion:2,nameA:names.nameA||'',nameB:names.nameB||'',scoringTargets:[20,20],rtw:draw(1,20,10),checkout:draw(41,60,10),lifecycle:{status:'setup',activeKind:null},scores:Object.fromEntries(kinds.map(k=>[k,[Array(10).fill(''),Array(10).fill('')]]))}}
function valid(s){return s&&['rtw','checkout'].every(k=>Array.isArray(s[k])&&s[k].length===10&&new Set(s[k]).size===10&&s[k].every(n=>Number.isInteger(n)&&n>=(k==='rtw'?1:41)&&n<=(k==='rtw'?20:60)))&&kinds.every(k=>Array.isArray(s.scores?.[k])&&s.scores[k].length===2&&s.scores[k].every(a=>Array.isArray(a)&&a.length===10&&a.every(v=>v===''||Number.isInteger(v)&&v>=0&&v<=999)))&&['nameA','nameB'].every(k=>typeof s[k]==='string')&&(s.scoringTargets===undefined||Array.isArray(s.scoringTargets)&&s.scoringTargets.length===2&&s.scoringTargets.every(v=>v===null||[18,19,20].includes(v)))&&(s.scoringTarget===undefined||s.scoringTarget===null||[18,19,20].includes(s.scoringTarget))}

function isComplete(game){return kinds.every(k=>game.scores[k].every(row=>row.every(v=>v!=='')))}
function lifecycleFor(game){const lifecycle=game.lifecycle;if(!lifecycle||!['setup','active','completed'].includes(lifecycle.status)||(lifecycle.status==='active'&&!kinds.includes(lifecycle.activeKind))||(lifecycle.status!=='active'&&lifecycle.activeKind!==null))return {status:'legacy',activeKind:null};return lifecycle}
function disciplineComplete(kind){return state.scores[kind].every(row=>row.every(value=>value!==''))}
function canEditCell(kind,p,index){
if(correctionSession)return correctionSession.kind===kind;
if(playerDataEditing)return false;
const lifecycle=lifecycleFor(state);
if(lifecycle.status==='setup')return kind==='rtw';
return lifecycle.status==='active'&&lifecycle.activeKind===kind;
}
function ensureMatchStarted(kind){
if(lifecycleFor(state).status==='setup'&&kind==='rtw'){
state.lifecycle={status:'active',activeKind:'rtw'};
}
}
function makeRecord(game){return {startedAt:new Date().toISOString(),endedAt:null,wasComplete:false,id:globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+'-'+Math.random().toString(36).slice(2),createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),game}}
function normalizeScoringTargets(game){
if(Array.isArray(game.scoringTargets)&&game.scoringTargets.length===2&&game.scoringTargets.every(v=>[18,19,20].includes(v)))return;
const legacy=[18,19,20].includes(game.scoringTarget)?game.scoringTarget:20;
game.scoringTargets=[legacy,legacy];
}
function loadLibrary(){try{const data=JSON.parse(localStorage.getItem(LIBRARY_KEY));if(data&&Array.isArray(data.games)){const games=data.games.filter(r=>r&&typeof r.id==='string'&&typeof r.createdAt==='string'&&typeof r.updatedAt==='string'&&valid(r.game));if(games.length){games.forEach(r=>normalizeScoringTargets(r.game));return {activeId:games.some(r=>r.id===data.activeId)?data.activeId:games[0].id,games}}}}catch{}let old;try{old=JSON.parse(localStorage.getItem(KEY))}catch{}const oldGame=valid(old)?old:fresh();normalizeScoringTargets(oldGame);const record=makeRecord(oldGame);return {activeId:record.id,games:[record]}}
let library=loadLibrary(),state=library.games.find(r=>r.id===library.activeId).game,correctionSession=null,playerDataEditing=false,guidedStep=null;
for(const r of library.games){r.startedAt=r.startedAt||r.createdAt;if(typeof r.wasComplete!=='boolean')r.wasComplete=isComplete(r.game);r.endedAt=r.endedAt||null;}
function save(){if(correctionSession)return;const record=library.games.find(r=>r.id===library.activeId);record.game=state;record.updatedAt=new Date().toISOString();const done=isComplete(state);if(done&&!record.wasComplete)record.endedAt=record.updatedAt;if(!done)record.endedAt=null;record.wasComplete=done;try{localStorage.setItem(LIBRARY_KEY,JSON.stringify(library));document.getElementById('status').textContent='✓ '+library.games.length+' Spiel'+(library.games.length===1?'':'e')+' lokal gespeichert'}catch{document.getElementById('status').textContent='Speichern fehlgeschlagen – Ergebnisse bitte drucken'}renderGameList();renderResults()}
function renderGameList(){const list=document.getElementById('game-list');list.replaceChildren();library.games.forEach((r,index)=>{const g=r.game,done=kinds.every(k=>g.scores[k].every(row=>row.every(v=>v!==''))),option=document.createElement('option');option.value=r.id;option.textContent='Spiel '+(index+1)+' · '+(g.nameA.trim()||'Spieler*in A')+' gegen '+(g.nameB.trim()||'Spieler*in B')+' · '+new Date(r.createdAt).toLocaleDateString('de-DE')+' · '+(done?'Abgeschlossen':'In Bearbeitung');list.append(option)});list.value=library.activeId;const current=library.games.find(r=>r.id===library.activeId);document.getElementById('game-info').textContent='Start: '+formatTime(current.startedAt)+' · Ende: '+(current.endedAt?formatTime(current.endedAt):isComplete(current.game)?'Nicht erfasst':'Noch offen')+' · '+library.games.length+' gespeicherte Spiele'}

function formatTime(value){return value&&Number.isFinite(Date.parse(value))?new Date(value).toLocaleString('de-DE',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit'}):'Nicht erfasst'}
function resultFor(game){const disciplines=kinds.map(k=>{const done=game.scores[k].every(row=>row.every(v=>v!==''));const sums=game.scores[k].map(row=>row.reduce((a,v)=>a+(v===''?0:v),0));return {done,sums,points:done?(sums[0]===sums[1]?[1,1]:sums[0]>sums[1]?[2,0]:[0,2]):[0,0]}});return {disciplines,done:disciplines.every(d=>d.done),totals:[0,1].map(p=>disciplines.reduce((a,d)=>a+d.points[p],0))}}
function renderResults(){const body=document.getElementById('results-body');body.replaceChildren();library.games.forEach((r,index)=>{const g=r.game,result=resultFor(g),nameA=g.nameA.trim()||'Spieler*in A',nameB=g.nameB.trim()||'Spieler*in B';const row=document.createElement('tr');const winner=!result.done?'In Bearbeitung':result.totals[0]===result.totals[1]?'Unentschieden':(result.totals[0]>result.totals[1]?nameA:nameB)+' gewinnt';const values=['Spiel '+(index+1)+' · '+nameA+' / '+nameB,formatTime(r.startedAt),r.endedAt?formatTime(r.endedAt):result.done?'Nicht erfasst':'Noch offen',...result.disciplines.map(d=>d.done?d.sums.join(' : '):'–'),result.done?result.totals.join(' : '):'–',winner];values.forEach(value=>{const td=document.createElement('td');td.textContent=value;row.append(td)});const td=document.createElement('td'),button=document.createElement('button');button.textContent=r.id===library.activeId?'Aktuell':'Anzeigen';button.disabled=r.id===library.activeId;button.onclick=()=>{switchGame(r.id);document.getElementById('game-list').focus()};td.append(button);const remove=document.createElement('button');remove.textContent='Löschen';remove.className='danger';remove.setAttribute('aria-label','Spiel von '+nameA+' und '+nameB+' löschen');remove.onclick=()=>askDelete(r.id);td.append(remove);row.append(td);body.append(row)})}

function switchGame(id){if(correctionSession||playerDataEditing||id===library.activeId)return;const record=library.games.find(r=>r.id===id);if(!record)return;save();library.activeId=id;state=record.game;render()}
function newGame(){if(correctionSession||playerDataEditing)return;save();const game=fresh(state);const record=makeRecord(game);library.games.push(record);library.activeId=record.id;state=record.game;render()}

function player(p){return state[p?'nameB':'nameA'].trim()||'Spieler*in '+(p?'B':'A')}
function scoringTargetsFor(game){
if(Array.isArray(game.scoringTargets)&&game.scoringTargets.length===2&&game.scoringTargets.every(v=>[18,19,20].includes(v)))return game.scoringTargets;
if([18,19,20].includes(game.scoringTarget))return [game.scoringTarget,game.scoringTarget];
return [20,20];
}
function render(){
for(const id of ['nameA','nameB'])document.getElementById(id).value=state[id];
refreshScoringTarget();
const container=document.getElementById('disciplines');
container.replaceChildren();
kinds.forEach((k,idx)=>{
const sec=document.createElement('section');
sec.innerHTML='<div class="section-head"><span class="num">0'+(idx+1)+'</span><h2>'+disciplineNames[idx]+'</h2><span class="hint">'+disciplineHints[idx]+'</span></div><details class="discipline-help"><summary>Ablauf &amp; Ziel</summary><p>'+disciplineExplanations[idx]+'</p></details><div class="discipline-actions" data-actions-for="'+k+'"></div><div class="scroll"><table><thead><tr><th>Spieler*in / '+(k==='scoring'?'Aufnahme':'Ziel')+'</th></tr></thead><tbody></tbody></table></div>';
if(k==='scoring'){
const targets=scoringTargetsFor(state);
sec.querySelector('.hint').textContent='A: '+(targets[0]??'–')+' · B: '+(targets[1]??'–')+' · 0–9 Punkte';
}
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
input.className='score-input checkout-symbol';
input.addEventListener('click',()=>cycleCheckout(k,p,i,false));
input.addEventListener('contextmenu',e=>{e.preventDefault();cycleCheckout(k,p,i,true)});
}else{
input.type='number';
input.min=0;
input.max=k==='rtw'?3:9;
input.step=1;
input.inputMode='numeric';
input.value=state.scores[k][p][i];
input.placeholder='–';
input.addEventListener('input',()=>{
if(!canEditCell(k,p,i)){input.value=state.scores[k][p][i];return}
const raw=input.value,n=input.valueAsNumber,ok=raw!==''&&Number.isInteger(n)&&n>=0&&n<=Number(input.max);
input.setCustomValidity(raw===''||ok?'':'Bitte eine ganze Zahl von 0 bis '+input.max+' eingeben.');
ensureMatchStarted(k);
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
function update(){
const lifecycle=lifecycleFor(state);
if(lifecycle.status==='active'){
const index=kinds.indexOf(lifecycle.activeKind);
if(disciplineComplete(lifecycle.activeKind)){
const next=kinds[index+1];
if(next){state.lifecycle={status:'active',activeKind:next};queueMicrotask(()=>focusFirstEntry(next))}
else state.lifecycle={status:'completed',activeKind:null};
}
}
refreshScoringTarget();refreshNames();refreshCells();renderLifecycleControls();renderDisciplineActions();
const pts=[[],[]];let complete=0;kinds.forEach(k=>{
const sums=state.scores[k].map(a=>a.reduce((s,n)=>s+(n===''?0:n),0));
for(let p=0;p<2;p++)document.getElementById(k+p).textContent=sums[p];
const done=disciplineComplete(k);if(done)complete++;
for(let p=0;p<2;p++)pts[p].push(done?(sums[p]===sums[1-p]?1:sums[p]>sums[1-p]?2:0):null);
});
const tbody=document.getElementById('summary');tbody.replaceChildren();
for(let p=0;p<2;p++){
const tr=document.createElement('tr');
[player(p),...pts[p].map(v=>v===null?'–':v),pts[p].reduce((a,b)=>a+(b||0),0)].forEach((v,i)=>{
const cell=document.createElement(i===0?'th':'td');cell.textContent=v;tr.append(cell);
});
tbody.append(tr);
}
const totals=pts.map(a=>a.reduce((s,v)=>s+(v||0),0));
document.getElementById('result').textContent=complete===3?(totals[0]===totals[1]?'Unentschieden – starkes Match!':player(totals[0]>totals[1]?0:1)+' gewinnt das Match!'):complete+' von 3 Disziplinen abgeschlossen';
const editing=Boolean(correctionSession||playerDataEditing);
document.getElementById('new').disabled=editing;document.getElementById('game-list').disabled=editing;document.getElementById('print').disabled=editing;document.getElementById('print-results').disabled=editing;
refreshGuidedEntryButton();
if(document.getElementById('guided-dialog').open)renderGuidedEntry();
}
for(let p=0;p<2;p++){
const id=p?'nameB':'nameA';
document.getElementById(id).addEventListener('input',e=>{
if(lifecycleFor(state).status==='setup'){
state[id]=e.target.value;
document.querySelectorAll('[data-player]').forEach(el=>el.textContent=player(Number(el.dataset.player)));
update();save();
}
});
}

function refreshScoringTarget(){
const lifecycle=lifecycleFor(state);
const targets=playerDataEditing?[0,1].map(p=>Number(document.getElementById('scoring-target-'+(p?'B':'A')).value)):scoringTargetsFor(state);
for(let p=0;p<2;p++){
const suffix=p?'B':'A',select=document.getElementById('scoring-target-'+suffix);
if(!playerDataEditing)select.value=targets[p]===null||targets[p]===undefined?'':String(targets[p]);
select.disabled=!(lifecycle.status==='setup'||playerDataEditing);
}
const scoringHint=Array.from(document.querySelectorAll('#disciplines section')).find(section=>section.querySelector('h2')?.textContent==='Scoring')?.querySelector('.hint');
if(scoringHint){
scoringHint.textContent='A: '+(targets[0]??'–')+' · B: '+(targets[1]??'–')+' · 0–9 Punkte';
}
}
for(let p=0;p<2;p++){
const suffix=p?'B':'A';
document.getElementById('scoring-target-'+suffix).addEventListener('change',e=>{
if(lifecycleFor(state).status==='setup'){
const value=e.target.value;
if(!Array.isArray(state.scoringTargets))state.scoringTargets=[20,20];
state.scoringTargets[p]=['18','19','20'].includes(value)?Number(value):20;
save();
update();
}else if(playerDataEditing){
update();
}
});
}

function refreshNames(){
const lifecycle=lifecycleFor(state);
for(let p=0;p<2;p++){
const suffix=p?'B':'A',input=document.getElementById('name'+suffix);
const card=input.closest('.player-card'),editable=lifecycle.status==='setup'||playerDataEditing;
if(!playerDataEditing)input.value=state['name'+suffix];
input.readOnly=!editable;
card.classList.toggle('is-player-data-editing',playerDataEditing);
}
document.querySelectorAll('[data-player]').forEach(el=>{el.textContent=player(Number(el.dataset.player))});
const actionBar=document.getElementById('player-data-actions');
const available=lifecycle.status!=='setup'&&lifecycle.status!=='legacy';
actionBar.hidden=!available;
document.getElementById('player-data-edit').hidden=!available||playerDataEditing;
document.getElementById('player-data-save').hidden=!playerDataEditing;
document.getElementById('player-data-cancel').hidden=!playerDataEditing;
}
function refreshCells(){document.querySelectorAll('.score-input').forEach(input=>{
const k=input.dataset.kind,p=Number(input.dataset.p),i=Number(input.dataset.i),value=state.scores[k][p][i];
const editable=canEditCell(k,p,i);
let label=player(p)+', '+(k==='rtw'?'Singles':k==='scoring'?'Scoring':'Checkouts')+', '+(k==='scoring'?'Aufnahme '+(i+1):'Ziel '+state[k][i]);
if(k==='checkout'){
const status=value===''?'Nicht definiert':value===1?'Getroffen':'Nicht getroffen';
input.textContent=value===''?'?':value===1?'✓':'✕';
input.dataset.status=value===''?'undefined':value===1?'hit':'miss';
input.disabled=!editable;
label+=': '+status;
}else{
const displayValue=value===''?'':String(value);
if(input.value!==displayValue)input.value=displayValue;
input.readOnly=!editable;
}
input.classList.toggle('locked',!editable);
input.setAttribute('aria-label',label);
})}
function renderLifecycleControls(){
const host=document.getElementById('lifecycle-controls');host.replaceChildren();
const panel=document.createElement('div'),message=document.createElement('p'),actions=document.createElement('div');
panel.className='lifecycle-panel';actions.className='lifecycle-actions';panel.append(message,actions);host.append(panel);
if(correctionSession){message.textContent='Korrektur aktiv – bitte in der Disziplin speichern oder abbrechen.';return}
if(playerDataEditing){message.textContent='Spielerdaten bearbeiten – bitte speichern oder abbrechen, bevor du fortfährst.';return}
const lifecycle=lifecycleFor(state);
if(lifecycle.status==='legacy'){
message.textContent='Für dieses ältere Spiel ist der Spielstatus unbekannt. Bitte einmal festlegen, bevor du fortfährst.';
const select=document.createElement('select');select.setAttribute('aria-label','Status des älteren Spiels festlegen');
select.innerHTML='<option value="">Status auswählen</option><option value="setup">Vorbereitung – noch nicht gestartet</option><option value="rtw">Fortsetzen ab Singles</option><option value="scoring">Fortsetzen ab Scoring</option><option value="checkout">Fortsetzen ab Checkouts</option><option value="completed">Als abgeschlossen markieren</option>';
select.querySelector('[value="scoring"]').disabled=!disciplineComplete('rtw');
select.querySelector('[value="checkout"]').disabled=!(disciplineComplete('rtw')&&disciplineComplete('scoring'));
select.querySelector('[value="completed"]').disabled=!isComplete(state);
const apply=document.createElement('button');apply.textContent='Status festlegen';apply.disabled=true;
select.addEventListener('change',()=>{apply.disabled=!select.value});
apply.onclick=()=>{
if(!select.value)return;
state.lifecycle=select.value==='setup'?{status:'setup',activeKind:null}:select.value==='completed'?{status:'completed',activeKind:null}:{status:'active',activeKind:select.value};
save();update();
};
actions.append(select,apply);return;
}
if(lifecycle.status==='setup'){
message.textContent='Bereit für Singles – die erste Eingabe startet das Match automatisch.';
return;
}
if(lifecycle.status==='completed'){
message.textContent='Match abgeschlossen – der Spielbogen ist schreibgeschützt. Korrekturen sind je Disziplin möglich.';return;
}
const index=kinds.indexOf(lifecycle.activeKind);
message.textContent='Aktive Disziplin: '+disciplineNames[index]+'. '+(disciplineComplete(lifecycle.activeKind)?'':'Erfasse alle Werte; Fehlversuche zählen als 0.');
const next=kinds[index+1];
if(next&&disciplineComplete(lifecycle.activeKind)){
const startNext=document.createElement('button');startNext.className='primary';
startNext.textContent=disciplineNames[kinds.indexOf(next)]+' starten';
startNext.onclick=()=>{
if(correctionSession||playerDataEditing||!disciplineComplete(lifecycle.activeKind))return;
state.lifecycle={status:'active',activeKind:next};save();update();queueMicrotask(()=>focusFirstEntry(next));
};
actions.append(startNext);
}
}
function renderDisciplineActions(){kinds.forEach(kind=>{const host=document.querySelector('[data-actions-for="'+kind+'"]');if(!host)return;host.replaceChildren();const lifecycle=lifecycleFor(state),activeIndex=lifecycle.status==='active'?kinds.indexOf(lifecycle.activeKind):-1,kindIndex=kinds.indexOf(kind),status=document.createElement('span');status.className='lifecycle-readonly';if(lifecycle.status==='setup')status.textContent='Noch nicht gestartet';else if(lifecycle.status==='completed')status.textContent='Read-only';else if(lifecycle.status==='active')status.textContent=kindIndex===activeIndex?'Aktiv':kindIndex<activeIndex?'Read-only':'Noch nicht begonnen';else status.textContent='Status festlegen';host.append(status);if(correctionSession){if(correctionSession.kind!==kind)return;const saveButton=document.createElement('button');saveButton.className='primary';saveButton.textContent='Korrektur speichern';saveButton.onclick=saveCorrection;const cancelButton=document.createElement('button');cancelButton.textContent='Abbrechen';cancelButton.onclick=cancelCorrection;host.append(saveButton,cancelButton);return}if(playerDataEditing)return;const lockedPast=lifecycle.status==='completed'||lifecycle.status==='active'&&kindIndex<=activeIndex,hasValues=state.scores[kind].some(row=>row.some(value=>value!==''));if(!lockedPast||!hasValues)return;const edit=document.createElement('button');edit.textContent='✎ Korrigieren';edit.setAttribute('aria-label',disciplineNames[kindIndex]+' korrigieren');edit.onclick=()=>beginCorrection(kind);host.append(edit)})}
function beginCorrection(kind){if(correctionSession||playerDataEditing)return;correctionSession={kind,snapshot:state.scores[kind].map(row=>row.slice()),lifecycle:{...lifecycleFor(state)}};update()}
function reconcileLifecycleAfterCorrection(){
if(lifecycleFor(state).status==='completed'||isComplete(state)){
if(isComplete(state)){state.lifecycle={status:'completed',activeKind:null};return}
const nextIncomplete=kinds.find(kind=>!disciplineComplete(kind));
if(nextIncomplete)state.lifecycle={status:'active',activeKind:nextIncomplete};
}
}
function saveCorrection(){
if(!correctionSession)return false;
const {kind,snapshot}=correctionSession;
for(let p=0;p<2;p++){
for(let i=0;i<10;i++){
if(snapshot[p][i]!==''&&state.scores[kind][p][i]===''){
document.getElementById('status').textContent='Korrektur nicht gespeichert: vorhandene Werte dürfen nicht leer bleiben.';
return false;
}
}
}
correctionSession=null;
reconcileLifecycleAfterCorrection();
save();
update();
return true;
}
function cancelCorrection(){if(!correctionSession)return;state.scores[correctionSession.kind]=correctionSession.snapshot;state.lifecycle=correctionSession.lifecycle;correctionSession=null;update()}
function beginPlayerDataEdit(){
if(playerDataEditing||correctionSession||lifecycleFor(state).status==='setup'||lifecycleFor(state).status==='legacy')return;
playerDataEditing=true;
update();
const input=document.getElementById('nameA');
input.focus();input.select();
}
function savePlayerData(){
if(!playerDataEditing)return;
const targets=['A','B'].map(suffix=>document.getElementById('scoring-target-'+suffix).value);
if(!targets.every(value=>['18','19','20'].includes(value)))return;
state.nameA=document.getElementById('nameA').value;
state.nameB=document.getElementById('nameB').value;
state.scoringTargets=targets.map(Number);
playerDataEditing=false;
update();save();document.getElementById('player-data-edit').focus();
}
function cancelPlayerDataEdit(){
if(!playerDataEditing)return;
playerDataEditing=false;
update();document.getElementById('player-data-edit').focus();
}
function nextEntry(k,p,i){if(p===0)return {k,p:1,i};if(i<9)return {k,p:0,i:i+1};const next=kinds[kinds.indexOf(k)+1];return next?{k:next,p:0,i:0}:null}
function allGuidedSteps(){return kinds.flatMap(k=>Array.from({length:10},(_,i)=>[0,1].map(p=>({k,p,i}))).flat())}
function guidedSteps(){
if(correctionSession)return allGuidedSteps().filter(step=>step.k===correctionSession.kind);
const lifecycle=lifecycleFor(state);
const kind=lifecycle.status==='setup'?'rtw':lifecycle.status==='active'?lifecycle.activeKind:null;
return kind?allGuidedSteps().filter(step=>step.k===kind):[];
}
function guidedValue(step){return state.scores[step.k][step.p][step.i]}
function firstGuidedStep(steps){
if(correctionSession)return steps.find(step=>guidedValue(step)!=='')||steps[0]||null;
return steps.find(step=>guidedValue(step)==='')||steps[0]||null;
}
function refreshGuidedEntryButton(){
const button=document.getElementById('guided-open'),lifecycle=lifecycleFor(state);
button.disabled=playerDataEditing||lifecycle.status==='legacy'||(lifecycle.status==='completed'&&!correctionSession);
button.textContent=correctionSession?'Geführt korrigieren':'Geführt spielen';
}
function openGuidedEntry(){
if(playerDataEditing||lifecycleFor(state).status==='legacy'||(lifecycleFor(state).status==='completed'&&!correctionSession))return;
const steps=guidedSteps();
if(!steps.length)return;
guidedStep=firstGuidedStep(steps);
document.getElementById('guided-feedback').textContent='';
const dialog=document.getElementById('guided-dialog');
if(!dialog.open)dialog.showModal();
renderGuidedEntry();
const firstChoice=document.querySelector('#guided-choices button:not(:disabled)');
(firstChoice||document.getElementById('guided-close')).focus();
}
function renderGuidedEntry(){
const dialog=document.getElementById('guided-dialog');
if(!dialog.open)return;
const title=document.getElementById('guided-title'),context=document.getElementById('guided-context'),choices=document.getElementById('guided-choices');
const steps=guidedSteps(),stepIndex=steps.findIndex(step=>step.k===guidedStep?.k&&step.p===guidedStep?.p&&step.i===guidedStep?.i);
const globalSteps=allGuidedSteps(),globalIndex=globalSteps.findIndex(step=>step.k===guidedStep?.k&&step.p===guidedStep?.p&&step.i===guidedStep?.i);
const complete=lifecycleFor(state).status==='completed'&&!correctionSession;
const feedback=document.getElementById('guided-feedback');
document.getElementById('guided-back').disabled=stepIndex<=0;
document.getElementById('guided-next').hidden=false;
document.getElementById('guided-correction-save').hidden=!correctionSession;
document.getElementById('guided-correction-cancel').hidden=!correctionSession;
const progressTotal=correctionSession?steps.length:globalSteps.length,progressIndex=correctionSession?stepIndex:globalIndex;
document.getElementById('guided-progress').max=progressTotal;
document.getElementById('guided-progress').value=progressIndex<0?0:progressIndex+1;
document.getElementById('guided-progress-label').textContent=progressIndex<0?'':(correctionSession?'Korrektur · ':'')+'Aufgabe '+(progressIndex+1)+' von '+progressTotal;
choices.replaceChildren();
if(complete){
title.textContent='Match abgeschlossen';
context.textContent='Alle Aufgaben sind erfasst. Die Matchwertung und Ergebnisse wurden gespeichert.';
feedback.textContent='';
choices.hidden=true;
document.getElementById('guided-back').hidden=true;
document.getElementById('guided-next').hidden=true;
return;
}
document.getElementById('guided-back').hidden=false;
if(stepIndex<0){
title.textContent='Keine bearbeitbare Aufgabe';
context.textContent=correctionSession?'In dieser Disziplin ist keine Aufgabe verfügbar.':'Bitte zuerst den Status dieses älteren Spiels festlegen.';
choices.hidden=true;
document.getElementById('guided-back').hidden=true;
document.getElementById('guided-next').hidden=true;
return;
}
const step=steps[stepIndex],names=['Singles','Scoring','Checkouts'],task=step.k==='scoring'?'Aufnahme '+(step.i+1):'Ziel '+state[step.k][step.i];
title.textContent=names[kinds.indexOf(step.k)]+' · '+task;
context.textContent=player(step.p)+(step.k==='scoring'?' · Zielzahl '+scoringTargetsFor(state)[step.p]:'')+' · '+(correctionSession?'Korrekturmodus':'Eingabe');
document.getElementById('guided-name-a').textContent=player(0);
document.getElementById('guided-name-b').textContent=player(1);
document.getElementById('guided-score-a').textContent=state.scores[step.k][0].reduce((sum,value)=>sum+(value===''?0:value),0);
document.getElementById('guided-score-b').textContent=state.scores[step.k][1].reduce((sum,value)=>sum+(value===''?0:value),0);
choices.hidden=false;
choices.className='guided-choices '+step.k;
choices.setAttribute('aria-label',step.k==='checkout'?'Checkout-Ergebnis wählen':names[kinds.indexOf(step.k)]+'-Punktzahl wählen');
const values=step.k==='rtw'?[0,1,2,3]:step.k==='scoring'?[0,1,2,3,4,5,6,7,8,9]:[1,0];
values.forEach(value=>{
const button=document.createElement('button');
button.type='button';
button.dataset.value=String(value);
button.setAttribute('aria-pressed',String(guidedValue(step)===value));
button.setAttribute('aria-label',step.k==='checkout'?(value===1?'Ja, Checkout getroffen':'Nein, Checkout nicht getroffen'):String(value)+' Punkte');
button.textContent=step.k==='checkout'?(value===1?'✓ Getroffen':'✕ Nicht getroffen'):String(value);
button.disabled=!canEditCell(step.k,step.p,step.i);
button.addEventListener('click',()=>recordGuidedValue(value));
choices.append(button);
});
const currentValue=guidedValue(step);
document.getElementById('guided-next').disabled=currentValue===''||stepIndex>=steps.length-1;
document.getElementById('guided-back').disabled=stepIndex<=0;
feedback.textContent=correctionSession?'Änderungen werden erst mit „Korrektur speichern“ übernommen.':'Eingabe wird sofort im Match gespeichert.';
}
function recordGuidedValue(value){
if(!guidedStep||!canEditCell(guidedStep.k,guidedStep.p,guidedStep.i))return;
const step=guidedStep,kind=step.k;
if(!Number.isInteger(value)||(kind==='rtw'&&(value<0||value>3))||(kind==='scoring'&&(value<0||value>9))||(kind==='checkout'&&value!==0&&value!==1))return;
const currentSteps=guidedSteps(),stepIndex=currentSteps.findIndex(entry=>entry.k===step.k&&entry.p===step.p&&entry.i===step.i);
let next=correctionSession?currentSteps[stepIndex+1]:allGuidedSteps()[allGuidedSteps().findIndex(entry=>entry.k===step.k&&entry.p===step.p&&entry.i===step.i)+1];
ensureMatchStarted(kind);
state.scores[kind][step.p][step.i]=value;
update();
save();
if(next&&canEditCell(next.k,next.p,next.i))guidedStep=next;
renderGuidedEntry();
const firstChoice=document.querySelector('#guided-choices button:not(:disabled)');
(firstChoice||document.getElementById('guided-close')).focus();
}
function moveGuided(direction){
if(!guidedStep)return;
const steps=guidedSteps(),index=steps.findIndex(step=>step.k===guidedStep.k&&step.p===guidedStep.p&&step.i===guidedStep.i),next=steps[index+direction];
if(!next||!canEditCell(next.k,next.p,next.i))return;
if(direction>0&&guidedValue(guidedStep)==='')return;
guidedStep=next;
document.getElementById('guided-feedback').textContent='';
renderGuidedEntry();
const firstChoice=document.querySelector('#guided-choices button:not(:disabled)');
if(firstChoice)firstChoice.focus();
}
function focusNext(k,p,i){const n=nextEntry(k,p,i);if(!n)return;const input=Array.from(document.querySelectorAll('.score-input')).find(el=>el.dataset.kind===n.k&&Number(el.dataset.p)===n.p&&Number(el.dataset.i)===n.i);if(input&&(input.disabled||input.readOnly))return;if(input){input.focus();if(input.type==='number')input.select()}}
function focusFirstEntry(kind){
const input=Array.from(document.querySelectorAll('.score-input')).find(el=>el.dataset.kind===kind&&Number(el.dataset.p)===0&&el.dataset.i==='0');
if(input&&!input.disabled&&!input.readOnly){input.focus();if(input.type==='number')input.select()}
}
function cycleCheckout(kind,p,index,rightClick){
if(!canEditCell(kind,p,index))return;
const current=state.scores[kind][p][index];
const next=rightClick?(current===''?0:current):current===''?1:current===1?0:'';
ensureMatchStarted(kind);
state.scores[kind][p][index]=next;
update();
save();
focusNext(kind,p,index);
}

let pendingDeleteId=null;
function askDelete(id){if(correctionSession||playerDataEditing)return;const r=library.games.find(r=>r.id===id);if(!r)return;pendingDeleteId=id;document.getElementById('delete-description').textContent=(r.game.nameA.trim()||'Spieler*in A')+' gegen '+(r.game.nameB.trim()||'Spieler*in B')+' · Start: '+formatTime(r.startedAt);document.getElementById('delete-error').textContent='';document.getElementById('delete-dialog').showModal();document.getElementById('delete-cancel').focus()}
function deleteGame(){if(correctionSession||playerDataEditing)return;const id=pendingDeleteId;if(!id||!library.games.some(r=>r.id===id))return;const games=library.games.filter(r=>r.id!==id);if(!games.length)games.push(makeRecord(fresh()));const activeId=games.some(r=>r.id===library.activeId)?library.activeId:games[0].id;const next={activeId,games};try{localStorage.setItem(LIBRARY_KEY,JSON.stringify(next));localStorage.removeItem(KEY)}catch{document.getElementById('delete-error').textContent='Löschen konnte nicht gespeichert werden. Bitte erneut versuchen.';return}library=next;state=games.find(r=>r.id===activeId).game;pendingDeleteId=null;document.getElementById('delete-dialog').close();render()}
document.getElementById('delete-cancel').onclick=()=>{pendingDeleteId=null;document.getElementById('delete-dialog').close()};
document.getElementById('delete-dialog').addEventListener('cancel',()=>{pendingDeleteId=null});
document.getElementById('delete-confirm').onclick=deleteGame;
for(const id of ['nameA','nameB'])document.getElementById(id).addEventListener('keydown',e=>{
if(!playerDataEditing)return;
if(e.key==='Enter'){e.preventDefault();savePlayerData()}
if(e.key==='Escape'){e.preventDefault();cancelPlayerDataEdit()}
});

document.getElementById('player-data-edit').onclick=beginPlayerDataEdit;
document.getElementById('player-data-save').onclick=savePlayerData;
document.getElementById('player-data-cancel').onclick=cancelPlayerDataEdit;
const guidedDialog=document.getElementById('guided-dialog');
document.getElementById('guided-open').onclick=openGuidedEntry;
document.getElementById('guided-close').onclick=()=>guidedDialog.close();
document.getElementById('guided-back').onclick=()=>moveGuided(-1);
document.getElementById('guided-next').onclick=()=>moveGuided(1);
document.getElementById('guided-correction-cancel').onclick=()=>guidedDialog.close();
document.getElementById('guided-correction-save').onclick=()=>{
if(saveCorrection())guidedDialog.close();
else document.getElementById('guided-feedback').textContent='Korrektur konnte nicht gespeichert werden. Bitte leere vorhandene Werte nicht.';
};
guidedDialog.addEventListener('close',()=>{
if(correctionSession)cancelCorrection();
guidedStep=null;
});
guidedDialog.addEventListener('cancel',()=>{
if(correctionSession)cancelCorrection();
});
guidedDialog.addEventListener('keydown',event=>{
if(!guidedDialog.open)return;
if(event.key==='Escape'){event.preventDefault();if(correctionSession)cancelCorrection();guidedDialog.close();return}
if(event.key==='ArrowLeft'){event.preventDefault();moveGuided(-1);return}
if(event.key==='ArrowRight'){event.preventDefault();moveGuided(1);return}
if(/^\d$/.test(event.key)){
const choice=Array.from(document.querySelectorAll('#guided-choices button')).find(button=>button.dataset.value===event.key&&!button.disabled);
if(choice){event.preventDefault();choice.click()}
}
});
document.getElementById('new').onclick=newGame;
document.getElementById('game-list').addEventListener('change',e=>switchGame(e.target.value));
document.getElementById('print').onclick=()=>{if(correctionSession||playerDataEditing)return;document.body.classList.remove('print-results');window.print()};
document.getElementById('print-results').onclick=()=>{
if(correctionSession||playerDataEditing)return;
const cleanup=()=>document.body.classList.remove('print-results');
document.body.classList.add('print-results');
window.addEventListener('afterprint',cleanup,{once:true});
window.print();
};
render();
