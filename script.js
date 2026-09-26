
import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCGuqPOzcJhPatlqne_JUKk5zRmJMuVnNc",
  authDomain: "ez-morag.firebaseapp.com",
  projectId: "ez-morag",
  storageBucket: "ez-morag.firebasestorage.app",
  messagingSenderId: "319574296576",
  appId: "1:319574296576:web:58aba9c1eedcec032470e5",
  measurementId: "G-ESV16DEQP5"
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

const USERS = [];
for (let i=1;i<=18;i++) USERS.push({u:`צוער${i}`, p:`100${i}`.slice(-4), d:`צוער ${i}`, r:'c'});
for (let i=1;i<=4;i++) USERS.push({u:`קצין${i}`, p:`200${i}`.slice(-4), d:`קצין ${i}`, r:'o'});
const CADETS = USERS.filter(x=>x.r==='c');
const OFFICERS = USERS.filter(x=>x.r==='o');
const ALL_USERS = USERS;
let user = null, view = 'all', tasks = [], guides = [], meets = [];
let unsubscribeTasks = null, unsubscribeGuides = null, unsubscribeMeets = null;
let firebaseReady = false;
const emailForUser = (u) => `${u.toLowerCase()}@morag108.local`;

const loginEl = document.getElementById('login');
const appEl = document.getElementById('app');
const userSel = document.getElementById('user');
const passSel = document.getElementById('pass');
const errSel = document.getElementById('err');
const unameEl = document.getElementById('uname');
const uroleEl = document.getElementById('urole');
const allMainEl = document.getElementById('all-main');
const guideMainEl = document.getElementById('guide-main');
const taskMainEl = document.getElementById('task-main');
const meetMainEl = document.getElementById('meet-main');
const logoutBtn = document.getElementById('logout');
const tabs = document.querySelectorAll('.tab');
const btnTask = document.getElementById('btn-task');
const btnGuide = document.getElementById('btn-guide');
const btnMeet = document.getElementById('btn-meet');
const formTask = document.getElementById('form-task');
const formGuide = document.getElementById('form-guide');
const formMeet = document.getElementById('form-meet');

USERS.forEach(x=>{
  const o = document.createElement('option');
  o.value = x.u;
  o.textContent = x.d;
  userSel.appendChild(o);
});

ALL_USERS.forEach(u=>{
  const l = document.createElement('label');
  l.className = 'aitem';
  l.innerHTML = `<input type="checkbox" value="${u.u}" /><span>${u.d}</span>`;
  document.getElementById('m-list').appendChild(l.cloneNode(true));
});

CADETS.forEach(c=>{
  const l = document.createElement('label');
  l.className = 'aitem';
  l.innerHTML = `<input type="checkbox" value="${c.u}" /><span>${c.d}</span>`;
  document.getElementById('t-list').appendChild(l.cloneNode(true));
});

function getCbs(id){ return Array.from(document.getElementById(id).querySelectorAll('input[type="checkbox"]')); }
function esc(s){ const d=document.createElement('div'); d.textContent=s||''; return d.innerHTML; }
function closeModal(m){ document.getElementById(`modal-${m}`).classList.add('hidden'); }
function updateCounts(){
  const guideCount = guides.filter(g=>!g.conf[user.u]).length;
  const meetCount = meets.filter(m=>(m.ru===user.u || m.part.includes(user.u)) && m.conf && !Object.values(m.conf).some(x=>x!==null)).length;
  
  document.getElementById('guide-count').textContent = guideCount;
  document.getElementById('meet-count').textContent = meetCount;
}

const tScopeRadios = document.querySelectorAll('input[name="t-scope"]');
tScopeRadios.forEach(r => r.addEventListener('change', e => {
  const box = document.getElementById('t-box');
  if(e.target.value === 'per') box.classList.remove('hidden');
  else box.classList.add('hidden');
}));

tabs.forEach(t=>{
  t.addEventListener('click', ()=>{
    tabs.forEach(x=>x.classList.remove('active'));
    t.classList.add('active');
    view = t.dataset.v;
    [allMainEl, guideMainEl, taskMainEl, meetMainEl].forEach(el=>el.classList.add('hidden'));
    [btnTask, btnGuide, btnMeet].forEach(b=>b.style.display='none');
    
    if(view==='all') allMainEl.classList.remove('hidden');
    else if(view==='guide'){ guideMainEl.classList.remove('hidden'); btnGuide.style.display='inline-flex'; }
    else if(view==='task'){ taskMainEl.classList.remove('hidden'); btnTask.style.display='inline-flex'; }
    else if(view==='meet'){ meetMainEl.classList.remove('hidden'); btnMeet.style.display='inline-flex'; }
    render();
  });
});

document.getElementById('form-login').addEventListener('submit', async e=>{
  e.preventDefault();
  const m = USERS.find(x=>x.u===userSel.value);
  if(!m) return;
  errSel.classList.add('hidden');
  try {
  } catch (err) {
    console.error(err);
    errSel.textContent = 'פרטי הכניסה שגויים או שהמשתמש עדיין לא הוגדר ב-Firebase.';
    errSel.classList.remove('hidden');
  }
});

logoutBtn.addEventListener('click', async ()=>{
  await signOut(auth);
});

btnTask.addEventListener('click', ()=>{ formTask.reset(); document.getElementById('t-box').classList.add('hidden'); document.getElementById('modal-task').classList.remove('hidden'); });
btnGuide.addEventListener('click', ()=>{ formGuide.reset(); document.getElementById('modal-guide').classList.remove('hidden'); });
btnMeet.addEventListener('click', ()=>{ formMeet.reset(); getCbs('m-list').forEach(c=>c.checked=false); document.getElementById('modal-meet').classList.remove('hidden'); });

document.getElementById('t-all').addEventListener('click', ()=>getCbs('t-list').forEach(c=>c.checked=true));
document.getElementById('t-clear').addEventListener('click', ()=>getCbs('t-list').forEach(c=>c.checked=false));
document.getElementById('m-all').addEventListener('click', ()=>getCbs('m-list').forEach(c=>c.checked=true));
document.getElementById('m-clear').addEventListener('click', ()=>getCbs('m-list').forEach(c=>c.checked=false));

formTask.addEventListener('submit', async e=>{
  e.preventDefault();
  const title = document.getElementById('t-title').value.trim();
  const desc = document.getElementById('t-desc').value.trim();
  const assign = document.getElementById('t-assign').value;
  const due = document.getElementById('t-due').value;
  const scope = document.querySelector('input[name="t-scope"]:checked').value;
  
  let users = scope==='team' ? CADETS.map(c=>c.u) : getCbs('t-list').filter(c=>c.checked).map(c=>c.value);
  if(!title||!assign||users.length===0) return alert('מלאו את כל השדות');
  
  const stat = {};
  users.forEach(u=>stat[u]=false);
  
  await addDoc(collection(db, 'tasks'), {
    title, desc, assign, due, scope, by:user.d, bu:user.u, stat,
    t: Date.now(), createdAt: serverTimestamp()
  });
  formTask.reset();
  document.getElementById('t-box').classList.add('hidden');
  document.getElementById('modal-task').classList.add('hidden');
  render();
});

formGuide.addEventListener('submit', async e=>{
  e.preventDefault();
  const title = document.getElementById('g-title').value.trim();
  const text = document.getElementById('g-text').value.trim();
  const from = document.getElementById('g-from').value;
  const to = document.getElementById('g-to').value;
  
  if(!title||!text||!from||!to) return alert('מלאו את כל השדות');
  
  const conf = {};
  ALL_USERS.forEach(u=>conf[u.u]=null);
  
  await addDoc(collection(db, 'guides'), {
    title, text, from, to, by:user.d, bu:user.u, conf,
    t: Date.now(), createdAt: serverTimestamp()
  });
  formGuide.reset();
  document.getElementById('modal-guide').classList.add('hidden');
  render();
});

formMeet.addEventListener('submit', async e=>{
  e.preventDefault();
  const type = document.getElementById('m-type').value;
  const date = document.getElementById('m-date').value;
  const notes = document.getElementById('m-notes').value.trim();
  
  let part = getCbs('m-list').filter(c=>c.checked).map(c=>c.value);
  part.push(user.u);
  
  if(!type||part.length===0) return alert('מלאו את כל השדות');
  
  const conf = user.r==='o' ? {} : null;
  if(conf) part.forEach(u=>conf[u]=null);
  
  await addDoc(collection(db, 'meets'), {
    type, date, notes, part, req:user.d, ru:user.u, conf,
    t: Date.now(), createdAt: serverTimestamp()
  });
  formMeet.reset();
  document.getElementById('modal-meet').classList.add('hidden');
  render();
});

function urgency(due){
  if(!due) return 'green';
  const d = new Date(due), now = new Date(); now.setHours(0,0,0,0);
  const days = Math.floor((d-now)/(1000*60*60*24));
  if(days<=1) return 'red';
  if(days<=7) return 'org';
  return 'green';
}

function renderAll(){
  allMainEl.innerHTML = '';
  const items = [];
  tasks.forEach(t=>{ if(t.stat[user.u]!==undefined) items.push({ty:'t', d:t, dt:t.due||'9999'}); });
  guides.forEach(g=>items.push({ty:'g', d:g, dt:g.to||'9999'}));
  items.sort((a,b)=>new Date(a.dt)-new Date(b.dt));
  if(items.length===0){ allMainEl.innerHTML='<p class="empty">אין משימות או הנחיות.</p>'; return; }
  items.forEach(i=>allMainEl.appendChild(i.ty==='t'?renderTask(i.d):renderGuide(i.d)));
}

function renderTasks(){
  taskMainEl.innerHTML = '';
  if(tasks.length===0){ taskMainEl.innerHTML='<p class="empty">אין משימות.</p>'; return; }
  tasks.forEach(t=>taskMainEl.appendChild(renderTask(t)));
}

function renderGuides(){
  guideMainEl.innerHTML = '';
  if(guides.length===0){ guideMainEl.innerHTML='<p class="empty">אין הנחיות.</p>'; return; }
  guides.forEach(g=>guideMainEl.appendChild(renderGuide(g)));
}

function renderMeets(){
  meetMainEl.innerHTML = '';
  const rel = meets.filter(m=>m.ru===user.u || m.part.includes(user.u));
  if(rel.length===0){ meetMainEl.innerHTML='<p class="empty">אין פגישות.</p>'; return; }
  rel.forEach(m=>meetMainEl.appendChild(renderMeet(m)));
}

function render(){
  updateCounts();
  if(view==='all') renderAll();
  else if(view==='guide') renderGuides();
  else if(view==='task') renderTasks();
  else if(view==='meet') renderMeets();
}

function renderTask(t){
  const card = document.createElement('article');
  card.className = `tcard ${urgency(t.due)}`;
  const done = Object.values(t.stat).filter(Boolean).length;
  const total = Object.keys(t.stat).length;
  const pct = total?Math.round((done/total)*100):0;
  const my = t.stat[user.u];
  
  card.innerHTML = `<div class="tmain"><div class="tinfo"><div><span class="tag tagg">${esc(t.assign)}</span></div><h3>${esc(t.title)}</h3>${t.desc?`<div class="tdesc">${esc(t.desc)}</div>`:''}<small>${t.due?'דד-ליין: '+esc(t.due):''}</small></div><div class="prog" style="--pct:${pct}"><span>${done}/${total}</span></div></div><div class="act">${user.r==='c'&&t.stat[user.u]!==undefined?`<label class="chk"><input type="checkbox" ${my?'checked':''} data-id="${t.id}"/><span class="status-icon ${my?'status-done':'status-pending'}">${my?'✔':'✗'}</span><span>ביצעתי</span></label>`:''}<button class="lbtn" onclick="showDetail('${t.id}','t')">פירוט</button></div>`;
  
  const cb = card.querySelector('input');
  if(cb) cb.addEventListener('change', async e=>{ const i = tasks.find(x=>x.id===e.target.dataset.id); if(i) {
      i.stat[user.u]=e.target.checked;
      await updateDoc(doc(db, 'tasks', i.id), {stat:i.stat});
    }
    render(); });
  
  return card;
}

function renderGuide(g){
  const card = document.createElement('article');
  card.className = 'gcard';
  const conf = g.conf[user.u]!==undefined && g.conf[user.u]!==null;
  
  card.innerHTML = `<h3 class="gtitle">${esc(g.title)}</h3><div class="gtext">${esc(g.text)}</div><div class="gdates"><span>מ: ${esc(g.from)}</span><span>עד: ${esc(g.to)}</span></div><div class="act">${user.r==='c'||user.r==='o'?`<label class="chk"><input type="checkbox" ${conf?'checked':''} data-id="${g.id}"/><span class="status-icon ${conf?'status-done':'status-pending'}">${conf?'✔':'✗'}</span><span>אישרתי קריאה</span></label>`:''}<button class="lbtn" onclick="showDetail('${g.id}','g')">אישורים</button></div>`;
  
  const cb = card.querySelector('input');
  if(cb) cb.addEventListener('change', async e=>{ const i = guides.find(x=>x.id===e.target.dataset.id); if(i) {
      i.conf[user.u]=e.target.checked?new Date().toLocaleString('he'):null;
      await updateDoc(doc(db, 'guides', i.id), {conf:i.conf});
    }
    render(); });
  
  return card;
}

function renderMeet(m){
  const card = document.createElement('article');
  card.className = 'mcard';
  
  const canDelete = user.r==='o' || m.ru===user.u;
  
  card.innerHTML = `<span class="mbadge">${esc(m.type)}</span>${m.date?`<div class="mdate">📅 ${esc(m.date)}</div>`:''}<div class="mreq">בקש: ${esc(m.req)}</div>${m.notes?`<div>${esc(m.notes)}</div>`:''}<div class="mact">${user.r==='o'?`<button class="lbtn" onclick="showDetail('${m.id}','m')">אישורים</button>`:''}${canDelete?`<button class="lbtn lbtn-bad" onclick="deleteMeet('${m.id}')">מחק</button>`:''}</div>`;
  
  return card;
}

async function deleteMeet(id){
  if(confirm('בטוח שברצונך למחוק?')) {
    await deleteDoc(doc(db, 'meets', id));
  }
}

function showDetail(id, ty){
  const detail = document.getElementById('detail-content');
  if(ty==='t'){
    const t = tasks.find(x=>x.id===id);
    const rows = Object.keys(t.stat).map(u=>{ const c=CADETS.find(x=>x.u===u); return `<li class="${t.stat[u]?'ok':''}">${esc(c?c.d:u)} — <span class="status-icon ${t.stat[u]?'status-done':'status-pending'}">${t.stat[u]?'✔':'✗'}</span></li>`; }).join('');
    detail.innerHTML = `<h2>${esc(t.title)}</h2><ul class="dlist">${rows}</ul>`;
  } else if(ty==='g'){
    const g = guides.find(x=>x.id===id);
    const rows = Object.keys(g.conf).map(u=>{ const c=ALL_USERS.find(x=>x.u===u); return `<li class="${g.conf[u]?'ok':''}">${esc(c?c.d:u)} — <span class="status-icon ${g.conf[u]?'status-done':'status-pending'}">${g.conf[u]?'✔':'✗'}</span></li>`; }).join('');
    detail.innerHTML = `<h2>אישורי קריאה</h2><ul class="dlist">${rows}</ul>`;
  } else if(ty==='m'){
    const m = meets.find(x=>x.id===id);
    const rows = Object.keys(m.conf||{}).map(u=>{ const c=ALL_USERS.find(x=>x.u===u); return `<li class="${m.conf[u]?'ok':''}">${esc(c?c.d:u)} — <span class="status-icon ${m.conf[u]?'status-done':'status-pending'}">${m.conf[u]?'✔':'✗'}</span></li>`; }).join('');
    detail.innerHTML = `<h2>אישורי קריאה</h2><ul class="dlist">${rows}</ul>`;
  }
  document.getElementById('modal-detail').classList.remove('hidden');
}

document.getElementById('modal-detail').addEventListener('click', e=>{ if(e.target.id==='modal-detail') closeModal('detail'); });
['task','guide','meet'].forEach(m=>{ const md=document.getElementById(`modal-${m}`); md.addEventListener('click', e=>{ if(e.target===md) closeModal(m); }); });

function stopListeners(){
  [unsubscribeTasks, unsubscribeGuides, unsubscribeMeets].forEach(fn=>{ if(fn) fn(); });
  unsubscribeTasks = unsubscribeGuides = unsubscribeMeets = null;
}

function startListeners(){
  stopListeners();

  unsubscribeTasks = onSnapshot(query(collection(db,'tasks'), orderBy('t','desc')), snap=>{
    tasks = snap.docs.map(d=>({id:d.id, ...d.data()}));
    render();
  }, err=>console.error('tasks', err));

  unsubscribeGuides = onSnapshot(query(collection(db,'guides'), orderBy('t','desc')), snap=>{
    guides = snap.docs.map(d=>({id:d.id, ...d.data()}));
    render();
  }, err=>console.error('guides', err));

  unsubscribeMeets = onSnapshot(query(collection(db,'meets'), orderBy('t','desc')), snap=>{
    meets = snap.docs.map(d=>({id:d.id, ...d.data()}));
    render();
  }, err=>console.error('meets', err));
}

onAuthStateChanged(auth, async currentUser=>{
  if(!currentUser){
    stopListeners();
    user = null;
    tasks = []; guides = []; meets = [];
    loginEl.classList.remove('hidden');
    appEl.classList.add('hidden');
    return;
  }

  const username = currentUser.email.split('@')[0];
  const m = USERS.find(x=>x.u.toLowerCase()===username.toLowerCase());
  if(!m){
    await signOut(auth);
    errSel.textContent='המשתמש אינו מוגדר במערכת.';
    errSel.classList.remove('hidden');
    return;
  }

  user = m;
  firebaseReady = true;
  errSel.classList.add('hidden');
  unameEl.textContent = m.d;
  uroleEl.textContent = m.r==='o'?'קצין':'צוער';
  uroleEl.classList.toggle('off', m.r==='o');

  loginEl.classList.add('hidden');
  appEl.classList.remove('hidden');
  view = 'all';
  tabs.forEach(x=>x.classList.toggle('active', x.dataset.v==='all'));
  [allMainEl, guideMainEl, taskMainEl, meetMainEl].forEach(el=>el.classList.toggle('hidden', el!==allMainEl));
  [btnTask, btnGuide, btnMeet].forEach(b=>b.style.display='none');

  startListeners();
  render();
});
