import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
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
const db = getFirestore(firebaseApp);

// הגדרת משתמשים וסיסמאות קבועות
const USERS = [
  // --- צוערים (18 משתמשים) ---
  { u: 'צוער1',  p: '1001', d: 'אליה מוסיקנט',  r: 'c' },
  { u: 'צוער2',  p: '1002', d: 'נעה חדד',  r: 'c' },
  { u: 'צוער3',  p: '1003', d: 'עדן זהר הרמן',  r: 'c' },
  { u: 'צוער4',  p: '1004', d: 'גאיה סטפמן',  r: 'c' },
  { u: 'צוער5',  p: '1005', d: 'אביטל צימרין',  r: 'c' },
  { u: 'צוער6',  p: '1006', d: 'אלזה שיטרית',  r: 'c' },
  { u: 'צוער7',  p: '1007', d: 'דור בלום',  r: 'c' },
  { u: 'צוער8',  p: '1008', d: 'דני וברמן',  r: 'c' },
  { u: 'צוער9',  p: '1009', d: 'טלי לויטין',  r: 'c' },
  { u: 'צוער10', p: '1010', d: 'יאנה מוררי', r: 'c' },
  { u: 'צוער11', p: '1011', d: 'יעל זורע', r: 'c' },
  { u: 'צוער12', p: '1012', d: 'לייה מזרחי', r: 'c' },
  { u: 'צוער13', p: '1013', d: 'מאיה קהן', r: 'c' },
  { u: 'צוער14', p: '1014', d: 'מיקה רודריגז', r: 'c' },
  { u: 'צוער15', p: '1015', d: 'נועם רון', r: 'c' },
  { u: 'צוער16', p: '1016', d: 'נעה לוי', r: 'c' },
  { u: 'צוער17', p: '1017', d: 'נועם ברנדווין', r: 'c' },
  { u: 'צוער18', p: '1018', d: 'עידן מלול', r: 'c' },

  // --- קצינים (4 משתמשים) ---
  { u: 'קצין1',  p: '2001', d: 'גל גמרסני - מ"פ',  r: 'o' },
  { u: 'קצין2',  p: '2002', d: 'שחר רשף - סמ"פ',  r: 'o' },
  { u: 'קצין3',  p: '2003', d: 'מור גידו - מפק"ץ 1',  r: 'o' },
  { u: 'קצין4',  p: '2004', d: 'לי יהלום - מפק"ץ 2',  r: 'o' }
];

const CADETS = USERS.filter(x => x.r === 'c');
const OFFICERS = USERS.filter(x => x.r === 'o');
const ALL_USERS = USERS;

// חלוקה לצוותים (לפי שם תצוגה)
const TEAM1_NAMES = ['יעל זורע', 'נעה לוי', 'נועם ברנדווין', 'אליה מוסיקנט', 'דני וברמן', 'עידן מלול', 'נועם רון', 'גאיה סטפמן', 'טלי לויטין'];
const TEAM2_NAMES = ['אלזה שיטרית', 'לייה מזרחי', 'עדן זהר הרמן', 'מיקה רודריגז', 'אביטל צימרין', 'דור בלום', 'יאנה מוררי', 'מאיה קהן', 'נעה חדד'];
const TEAM1 = CADETS.filter(c => TEAM1_NAMES.includes(c.d)).map(c => c.u);
const TEAM2 = CADETS.filter(c => TEAM2_NAMES.includes(c.d)).map(c => c.u);

// אפשרויות "למי מגישים" (ניתן לבחור כמה)
const ROLES = ['מפק״ץ 1', 'מפק״ץ 2', 'סמ״פ', 'מ״פ', 'קב״ט', 'קחו״ד', 'ק׳ תיאום', 'קא״ג', 'ק׳ סימולציות', 'קה״ד'];

let user = null, view = 'all', tasks = [], guides = [], meets = [], schedules = [];
let unsubscribeTasks = null, unsubscribeGuides = null, unsubscribeMeets = null, unsubscribeSchedules = null;

// אלמנטים ב-DOM
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
const scheduleMainEl = document.getElementById('schedule-main');
const archiveMainEl = document.getElementById('archive-main');
const archiveBtn = document.getElementById('archive-btn');
const logoutBtn = document.getElementById('logout');
const tabs = document.querySelectorAll('.tab');
const formTask = document.getElementById('form-task');
const formGuide = document.getElementById('form-guide');
const formMeet = document.getElementById('form-meet');
const formMeetEdit = document.getElementById('form-meet-edit');
const formSchedule = document.getElementById('form-schedule');
const fabBtn = document.getElementById('fab-btn');
const fabMenu = document.getElementById('fab-menu');

// אכלוס הרשימות
USERS.forEach(x => {
  const o = document.createElement('option');
  o.value = x.u;
  o.textContent = x.d;
  userSel.appendChild(o);
});

ALL_USERS.forEach(u => {
  const l = document.createElement('label');
  l.className = 'aitem';
  l.innerHTML = `<input type="checkbox" value="${u.u}" /><span>${u.d}</span>`;
  document.getElementById('m-list').appendChild(l.cloneNode(true));
});

CADETS.forEach(c => {
  const l = document.createElement('label');
  l.className = 'aitem';
  l.innerHTML = `<input type="checkbox" value="${c.u}" /><span>${c.d}</span>`;
  document.getElementById('t-list').appendChild(l.cloneNode(true));
});

ROLES.forEach(role => {
  const l = document.createElement('label');
  l.className = 'aitem';
  l.innerHTML = `<input type="checkbox" value="${role}" /><span>${role}</span>`;
  document.getElementById('a-list').appendChild(l);
});

function getCbs(id) { return Array.from(document.getElementById(id).querySelectorAll('input[type="checkbox"]')); }
function esc(s) { const d = document.createElement('div'); d.textContent = s || ''; return d.innerHTML; }
function closeModal(m) { document.getElementById(`modal-${m}`).classList.add('hidden'); }
function closeFab() { fabMenu.classList.add('hidden'); fabBtn.classList.remove('open'); }

// script.js נטען כ-module, לכן פונקציות בתוכו אינן נגישות אוטומטית מתוך
// onclick="..." ב-HTML (זה רץ בהיקף הגלובלי). לכן חושפים כאן במפורש.
window.closeModal = closeModal;

function updateCounts() {
  if (!user) return;
  const guideCount = guides.filter(g => !g.archived && (!g.conf || !g.conf[user.u])).length;
  const meetCount = meets.filter(m => !m.archived && (m.ru === user.u || (m.part && m.part.includes(user.u))) && m.conf && !Object.values(m.conf).some(x => x)).length;

  document.getElementById('guide-count').textContent = guideCount;
  document.getElementById('meet-count').textContent = meetCount;
}

const tScopeRadios = document.querySelectorAll('input[name="t-scope"]');
tScopeRadios.forEach(r => r.addEventListener('change', e => {
  const perBox = document.getElementById('t-box');
  const squadBox = document.getElementById('t-squad-box');
  perBox.classList.toggle('hidden', e.target.value !== 'per');
  squadBox.classList.toggle('hidden', e.target.value !== 'squad');
}));

const taskLegendEl = document.getElementById('task-legend');

tabs.forEach(t => {
  t.addEventListener('click', () => {
    tabs.forEach(x => x.classList.remove('active'));
    t.classList.add('active');
    archiveBtn.classList.remove('active');
    view = t.dataset.v;
    [allMainEl, guideMainEl, taskMainEl, meetMainEl, scheduleMainEl, archiveMainEl].forEach(el => el.classList.add('hidden'));
    taskLegendEl.classList.add('hidden');

    if (view === 'all') allMainEl.classList.remove('hidden');
    else if (view === 'guide') guideMainEl.classList.remove('hidden');
    else if (view === 'task') { taskMainEl.classList.remove('hidden'); taskLegendEl.classList.remove('hidden'); }
    else if (view === 'meet') meetMainEl.classList.remove('hidden');
    else if (view === 'schedule') scheduleMainEl.classList.remove('hidden');
    render();
  });
});

archiveBtn.addEventListener('click', () => {
  closeFab();
  tabs.forEach(x => x.classList.remove('active'));
  archiveBtn.classList.add('active');
  [allMainEl, guideMainEl, taskMainEl, meetMainEl, scheduleMainEl].forEach(el => el.classList.add('hidden'));
  taskLegendEl.classList.add('hidden');
  archiveMainEl.classList.remove('hidden');
  view = 'archive';
  render();
});

// התחברות מקומית לפי סיסמה
document.getElementById('form-login').addEventListener('submit', e => {
  e.preventDefault();
  const selectedUsername = userSel.value;
  const enteredPassword = passSel.value.trim();

  const foundUser = USERS.find(x => x.u === selectedUsername);

  if (foundUser && foundUser.p === enteredPassword) {
    errSel.classList.add('hidden');
    loginUser(foundUser);
  } else {
    errSel.textContent = 'הסיסמה שגויה!';
    errSel.classList.remove('hidden');
  }
});

function loginUser(u) {
  user = u;
  unameEl.textContent = user.d;
  uroleEl.textContent = user.r === 'o' ? 'קצין' : 'צוער';
  uroleEl.classList.toggle('off', user.r === 'o');

  loginEl.classList.add('hidden');
  appEl.classList.remove('hidden');

  view = 'all';
  tabs.forEach(x => x.classList.toggle('active', x.dataset.v === 'all'));
  [allMainEl, guideMainEl, taskMainEl, meetMainEl, scheduleMainEl, archiveMainEl].forEach(el => el.classList.toggle('hidden', el !== allMainEl));

  startListeners();
}

logoutBtn.addEventListener('click', () => {
  stopListeners();
  user = null;
  tasks = []; guides = []; meets = []; schedules = [];
  passSel.value = '';
  appEl.classList.add('hidden');
  loginEl.classList.remove('hidden');
});

// כפתור פלוס צף
fabBtn.addEventListener('click', () => {
  fabMenu.classList.toggle('hidden');
  fabBtn.classList.toggle('open');
});

document.getElementById('fab-task').addEventListener('click', () => {
  closeFab();
  formTask.reset();
  document.getElementById('t-box').classList.add('hidden');
  document.getElementById('t-squad-box').classList.add('hidden');
  document.getElementById('modal-task').classList.remove('hidden');
});
document.getElementById('fab-guide').addEventListener('click', () => {
  closeFab();
  formGuide.reset();
  document.getElementById('modal-guide').classList.remove('hidden');
});
document.getElementById('fab-meet').addEventListener('click', () => {
  closeFab();
  formMeet.reset();
  getCbs('m-list').forEach(c => c.checked = false);
  document.getElementById('modal-meet').classList.remove('hidden');
});
document.getElementById('fab-schedule').addEventListener('click', () => {
  closeFab();
  formSchedule.reset();
  document.getElementById('modal-schedule').classList.remove('hidden');
});

document.getElementById('t-all').addEventListener('click', () => getCbs('t-list').forEach(c => c.checked = true));
document.getElementById('t-clear').addEventListener('click', () => getCbs('t-list').forEach(c => c.checked = false));
document.getElementById('m-all').addEventListener('click', () => getCbs('m-list').forEach(c => c.checked = true));
document.getElementById('m-clear').addEventListener('click', () => getCbs('m-list').forEach(c => c.checked = false));
document.getElementById('a-all').addEventListener('click', () => getCbs('a-list').forEach(c => c.checked = true));
document.getElementById('a-clear').addEventListener('click', () => getCbs('a-list').forEach(c => c.checked = false));

formTask.addEventListener('submit', async e => {
  e.preventDefault();
  const title = document.getElementById('t-title').value.trim();
  const desc = document.getElementById('t-desc').value.trim();
  const assign = getCbs('a-list').filter(c => c.checked).map(c => c.value);
  const due = document.getElementById('t-due').value;
  const scope = document.querySelector('input[name="t-scope"]:checked').value;

  let users;
  if (scope === 'all') users = CADETS.map(c => c.u);
  else if (scope === 'squad') {
    const squadNum = document.querySelector('input[name="t-squad"]:checked').value;
    users = squadNum === '1' ? TEAM1 : TEAM2;
  } else {
    users = getCbs('t-list').filter(c => c.checked).map(c => c.value);
  }

  if (!title || assign.length === 0 || users.length === 0) return alert('מלאו את כל השדות');

  const stat = {};
  users.forEach(u => stat[u] = false);

  await addDoc(collection(db, 'tasks'), {
    title, desc, assign, due, scope, by: user.d, bu: user.u, stat,
    t: Date.now(), createdAt: serverTimestamp()
  });
  formTask.reset();
  document.getElementById('t-box').classList.add('hidden');
  document.getElementById('t-squad-box').classList.add('hidden');
  document.getElementById('modal-task').classList.add('hidden');
});

formGuide.addEventListener('submit', async e => {
  e.preventDefault();
  const title = document.getElementById('g-title').value.trim();
  const text = document.getElementById('g-text').value.trim();
  const from = document.getElementById('g-from').value;
  const to = document.getElementById('g-to').value;

  if (!title || !text || !from || !to) return alert('מלאו את כל השדות');

  const conf = {};
  ALL_USERS.forEach(u => conf[u.u] = null);

  await addDoc(collection(db, 'guides'), {
    title, text, from, to, by: user.d, bu: user.u, conf,
    t: Date.now(), createdAt: serverTimestamp()
  });
  formGuide.reset();
  document.getElementById('modal-guide').classList.add('hidden');
});

formMeet.addEventListener('submit', async e => {
  e.preventDefault();
  const type = document.getElementById('m-type').value;
  const date = document.getElementById('m-date').value;
  const notes = document.getElementById('m-notes').value.trim();

  let part = getCbs('m-list').filter(c => c.checked).map(c => c.value);
  part.push(user.u);
  part = [...new Set(part)];

  if (!type || part.length === 0) return alert('מלאו את כל השדות');

  // רק צוערים שאינם מזמין הפגישה צריכים לאשר. קצינים לעולם לא נדרשים לאשר.
  const conf = {};
  part.forEach(u => {
    const p = ALL_USERS.find(x => x.u === u);
    if (p && p.r === 'c' && u !== user.u) conf[u] = null;
  });

  await addDoc(collection(db, 'meets'), {
    type, date, time: '', notes, part, req: user.d, ru: user.u, conf,
    t: Date.now(), createdAt: serverTimestamp()
  });
  formMeet.reset();
  document.getElementById('modal-meet').classList.add('hidden');
});

formMeetEdit.addEventListener('submit', async e => {
  e.preventDefault();
  const id = document.getElementById('me-id').value;
  const date = document.getElementById('me-date').value;
  const time = document.getElementById('me-time').value;
  if (!id) return;
  await updateDoc(doc(db, 'meets', id), { date, time });
  document.getElementById('modal-meet-edit').classList.add('hidden');
});

formSchedule.addEventListener('submit', async e => {
  e.preventDefault();
  const title = document.getElementById('s-title').value.trim();
  const type = document.getElementById('s-type').value;
  const durationValue = document.getElementById('s-duration').value;
  const durationUnit = document.getElementById('s-unit').value;

  if (!title || !type || !durationValue) return alert('מלאו את כל השדות');

  await addDoc(collection(db, 'schedule'), {
    title, type, durationValue: Number(durationValue), durationUnit,
    by: user.d, bu: user.u,
    t: Date.now(), createdAt: serverTimestamp()
  });
  formSchedule.reset();
  document.getElementById('modal-schedule').classList.add('hidden');
});

function urgency(due) {
  if (!due) return 'green';
  const d = new Date(due), now = new Date(); now.setHours(0, 0, 0, 0);
  const days = Math.floor((d - now) / (1000 * 60 * 60 * 24));
  if (days <= 1) return 'red';
  if (days <= 7) return 'org';
  return 'green';
}

// בולד כשנשאר שבוע להגשה, אדום כשחרגו מהדדליין
function dueDateClass(due) {
  if (!due) return '';
  const d = new Date(due), now = new Date(); now.setHours(0, 0, 0, 0);
  const days = Math.floor((d - now) / (1000 * 60 * 60 * 24));
  if (days < 0) return 'due-overdue';
  if (days <= 7) return 'due-soon';
  return '';
}

// מיון לפי דחיפות: הכי קרוב לדדליין קודם, ללא תאריך אחרון
function sortByDue(list) {
  return [...list].sort((a, b) => {
    const da = a.due ? new Date(a.due).getTime() : Infinity;
    const db_ = b.due ? new Date(b.due).getTime() : Infinity;
    return da - db_;
  });
}

// צוערים רואים רק משימות שהוקצו להם; קצינים רואים את כל המשימות לצורך מעקב. פריטים בארכיון לא מוצגים כאן.
function visibleTasksFor() {
  const active = tasks.filter(t => !t.archived);
  if (user.r === 'o') return active;
  return active.filter(t => t.stat && t.stat[user.u] !== undefined);
}

function meetStatus(m) {
  const keys = Object.keys(m.conf || {});
  if (keys.length === 0) return null;
  const allApproved = keys.every(u => m.conf[u]);
  return allApproved ? 'מאושר' : 'ממתין לאישור';
}

function renderAll() {
  allMainEl.innerHTML = '';
  const items = [];
  visibleTasksFor().forEach(t => items.push({ ty: 't', d: t, dt: t.due || '9999' }));
  guides.filter(g => !g.archived).forEach(g => items.push({ ty: 'g', d: g, dt: g.to || '9999' }));
  items.sort((a, b) => new Date(a.dt) - new Date(b.dt));
  if (items.length === 0) { allMainEl.innerHTML = '<p class="empty">אין משימות או הנחיות.</p>'; return; }
  items.forEach(i => allMainEl.appendChild(i.ty === 't' ? renderTask(i.d) : renderGuide(i.d)));
}

function renderTasks() {
  taskMainEl.innerHTML = '';
  const visible = sortByDue(visibleTasksFor());
  if (visible.length === 0) { taskMainEl.innerHTML = '<p class="empty">אין משימות.</p>'; return; }
  visible.forEach(t => taskMainEl.appendChild(renderTask(t)));
}

function renderGuides() {
  guideMainEl.innerHTML = '';
  const active = guides.filter(g => !g.archived);
  if (active.length === 0) { guideMainEl.innerHTML = '<p class="empty">אין הנחיות.</p>'; return; }
  active.forEach(g => guideMainEl.appendChild(renderGuide(g)));
}

function renderMeets() {
  meetMainEl.innerHTML = '';
  const rel = meets.filter(m => !m.archived && (m.ru === user.u || (m.part && m.part.includes(user.u))));
  if (rel.length === 0) { meetMainEl.innerHTML = '<p class="empty">אין פגישות.</p>'; return; }
  rel.forEach(m => meetMainEl.appendChild(renderMeet(m)));
}

function renderSchedules() {
  scheduleMainEl.innerHTML = '';
  const active = schedules.filter(s => !s.archived);
  if (active.length === 0) { scheduleMainEl.innerHTML = '<p class="empty">אין בקשות ללו״ז.</p>'; return; }
  active.forEach(s => scheduleMainEl.appendChild(renderSchedule(s)));
}

function render() {
  if (!user) return;
  updateCounts();
  if (view === 'all') renderAll();
  else if (view === 'guide') renderGuides();
  else if (view === 'task') renderTasks();
  else if (view === 'meet') renderMeets();
  else if (view === 'schedule') renderSchedules();
  else if (view === 'archive') renderArchive();
}

function renderTask(t) {
  const card = document.createElement('article');
  card.className = `tcard ${urgency(t.due)}`;
  const done = Object.values(t.stat || {}).filter(Boolean).length;
  const total = Object.keys(t.stat || {}).length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const my = t.stat ? t.stat[user.u] : false;

  const assignList = Array.isArray(t.assign) ? t.assign : (t.assign ? [t.assign] : []);
  const assignTags = assignList.map(a => `<span class="tag tagg">${esc(a)}</span>`).join('');
  const dueClass = dueDateClass(t.due);
  const canArchive = user.r === 'o' || t.bu === user.u;

  card.innerHTML = `<div class="tmain"><div class="tinfo"><div>${assignTags}</div><h3>${esc(t.title)}</h3>${t.desc ? `<div class="tdesc">${esc(t.desc)}</div>` : ''}<small class="due-label ${dueClass}">${t.due ? 'דד-ליין: ' + esc(t.due) : ''}</small></div><div class="prog" style="--pct:${pct}"><span>${done}/${total}</span></div></div><div class="act">${user.r === 'c' && t.stat && t.stat[user.u] !== undefined ? `<label class="chk"><input type="checkbox" ${my ? 'checked' : ''} data-id="${t.id}"/><span class="status-icon ${my ? 'status-done' : 'status-pending'}">${my ? '✔' : '✗'}</span><span>ביצעתי</span></label>` : ''}<button class="lbtn" data-detail="${t.id}" data-type="t">פירוט</button>${canArchive ? `<button class="trash-btn" data-archive title="העבר לארכיון">🗑️</button>` : ''}</div>`;

  const cb = card.querySelector('input');
  if (cb) cb.addEventListener('change', async e => {
    const i = tasks.find(x => x.id === e.target.dataset.id);
    if (i) {
      i.stat[user.u] = e.target.checked;
      await updateDoc(doc(db, 'tasks', i.id), { stat: i.stat });
    }
  });

  card.querySelector('[data-detail]').addEventListener('click', () => showDetail(t.id, 't'));
  const archBtn = card.querySelector('[data-archive]');
  if (archBtn) archBtn.addEventListener('click', () => archiveItem('tasks', t.id));
  return card;
}

function renderGuide(g) {
  const card = document.createElement('article');
  card.className = 'gcard';
  const conf = g.conf && g.conf[user.u] !== undefined && g.conf[user.u] !== null;
  const canArchive = user.r === 'o' || g.bu === user.u;

  card.innerHTML = `<h3 class="gtitle">${esc(g.title)}</h3><div class="gtext">${esc(g.text)}</div><div class="gdates"><span>מ: ${esc(g.from)}</span><span>עד: ${esc(g.to)}</span></div><div class="act">${user.r === 'c' || user.r === 'o' ? `<label class="chk"><input type="checkbox" ${conf ? 'checked' : ''} data-id="${g.id}"/><span class="status-icon ${conf ? 'status-done' : 'status-pending'}">${conf ? '✔' : '✗'}</span><span>אישרתי קריאה</span></label>` : ''}<button class="lbtn" data-detail="${g.id}" data-type="g">אישורים</button>${canArchive ? `<button class="trash-btn" data-archive title="העבר לארכיון">🗑️</button>` : ''}</div>`;

  const cb = card.querySelector('input');
  if (cb) cb.addEventListener('change', async e => {
    const i = guides.find(x => x.id === e.target.dataset.id);
    if (i) {
      i.conf[user.u] = e.target.checked ? new Date().toLocaleString('he') : null;
      await updateDoc(doc(db, 'guides', i.id), { conf: i.conf });
    }
  });

  card.querySelector('[data-detail]').addEventListener('click', () => showDetail(g.id, 'g'));
  const archBtn = card.querySelector('[data-archive]');
  if (archBtn) archBtn.addEventListener('click', () => archiveItem('guides', g.id));
  return card;
}

function renderMeet(m) {
  const card = document.createElement('article');
  card.className = 'mcard';

  // האם המשתמש הנוכחי צריך לאשר את הפגישה (צוער שהוזמן ואינו המזמין)
  const needsMyApproval = !!(m.conf && Object.prototype.hasOwnProperty.call(m.conf, user.u));
  const myApproved = needsMyApproval ? !!m.conf[user.u] : false;
  const status = meetStatus(m);

  // מזמין, קצינים וכל מוזמן יכולים להעביר לארכיון. עריכת מועד שמורה למזמין ולקצינים.
  const canArchive = user.r === 'o' || m.ru === user.u || (m.part && m.part.includes(user.u));
  const canEdit = user.r === 'o' || m.ru === user.u;

  let statusBadge = '';
  if (status === 'ממתין לאישור') statusBadge = `<span class="mbadge mbadge-pending">ממתין לאישור</span>`;
  else if (status === 'מאושר') statusBadge = `<span class="mbadge mbadge-approved">מאושר</span>`;

  card.innerHTML = `
    <span class="mbadge">${esc(m.type)}</span>${statusBadge}
    ${m.date ? `<div class="mdate">📅 ${esc(m.date)}${m.time ? ' · ' + esc(m.time) : ''}</div>` : ''}
    <div class="mreq">בקש: ${esc(m.req)}</div>
    ${m.notes ? `<div class="mnote">${esc(m.notes)}</div>` : ''}
    <div class="mact">
      ${needsMyApproval ? `<label class="chk"><input type="checkbox" ${myApproved ? 'checked' : ''} data-id="${m.id}"/><span class="status-icon ${myApproved ? 'status-done' : 'status-pending'}">${myApproved ? '✔' : '✗'}</span><span>מאשר/ת הגעה</span></label>` : ''}
      ${user.r === 'o' ? `<button class="lbtn" data-detail="${m.id}" data-type="m">אישורים</button>` : ''}
      ${canEdit ? `<button class="lbtn" data-edit="${m.id}">ערוך מועד</button>` : ''}
      ${canArchive ? `<button class="trash-btn" data-archive title="העבר לארכיון">🗑️</button>` : ''}
    </div>`;

  const cb = card.querySelector('input[type="checkbox"]');
  if (cb) cb.addEventListener('change', async e => {
    const i = meets.find(x => x.id === e.target.dataset.id);
    if (i) {
      i.conf[user.u] = e.target.checked ? true : null;
      await updateDoc(doc(db, 'meets', i.id), { conf: i.conf });
    }
  });

  const detailBtn = card.querySelector('[data-detail]');
  if (detailBtn) detailBtn.addEventListener('click', () => showDetail(m.id, 'm'));

  const editBtn = card.querySelector('[data-edit]');
  if (editBtn) editBtn.addEventListener('click', () => openMeetEdit(m.id));

  const archBtn = card.querySelector('[data-archive]');
  if (archBtn) archBtn.addEventListener('click', () => archiveItem('meets', m.id));

  return card;
}

function renderSchedule(s) {
  const card = document.createElement('article');
  card.className = 'scard';
  const canArchive = user.r === 'o' || s.bu === user.u;

  card.innerHTML = `
    <span class="mbadge">${esc(s.type)}</span>
    <h3 class="gtitle">${esc(s.title)}</h3>
    <div class="mreq">משך משוער: ${esc(String(s.durationValue))} ${esc(s.durationUnit)}</div>
    <div class="mreq">בקש: ${esc(s.by)}</div>
    <div class="mact">${canArchive ? `<button class="trash-btn" data-archive title="העבר לארכיון">🗑️</button>` : ''}</div>`;

  const archBtn = card.querySelector('[data-archive]');
  if (archBtn) archBtn.addEventListener('click', () => archiveItem('schedule', s.id));

  return card;
}

function openMeetEdit(id) {
  const m = meets.find(x => x.id === id);
  if (!m) return;
  document.getElementById('me-id').value = id;
  document.getElementById('me-date').value = m.date || '';
  document.getElementById('me-time').value = m.time || '';
  document.getElementById('modal-meet-edit').classList.remove('hidden');
}

// העברה לארכיון (לא מחיקה סופית) — עם אישור מראש
async function archiveItem(coll, id) {
  if (confirm('להעביר את הפריט לארכיון? ניתן יהיה לשחזר אותו משם.')) {
    await updateDoc(doc(db, coll, id), { archived: true, archivedAt: Date.now() });
  }
}

async function restoreItem(coll, id) {
  await updateDoc(doc(db, coll, id), { archived: false });
}

function archiveSectionTitle(text) {
  const h = document.createElement('div');
  h.className = 'asection-title';
  h.textContent = text;
  return h;
}

function renderArchiveItem(coll, id, titleText, subText) {
  const card = document.createElement('article');
  card.className = 'acard';
  card.innerHTML = `
    <div class="ainfo">
      <h3>${esc(titleText)}</h3>
      ${subText ? `<div class="tdesc">${esc(subText)}</div>` : ''}
    </div>
    <button class="lbtn" data-restore>שחזר</button>`;
  card.querySelector('[data-restore]').addEventListener('click', () => restoreItem(coll, id));
  return card;
}

function renderArchive() {
  archiveMainEl.innerHTML = '';
  const archTasks = tasks.filter(t => t.archived);
  const archGuides = guides.filter(g => g.archived);
  const archMeets = meets.filter(m => m.archived);
  const archSchedules = schedules.filter(s => s.archived);
  const total = archTasks.length + archGuides.length + archMeets.length + archSchedules.length;

  if (total === 0) { archiveMainEl.innerHTML = '<p class="empty">הארכיון ריק.</p>'; return; }

  if (archTasks.length) {
    archiveMainEl.appendChild(archiveSectionTitle('משימות'));
    archTasks.forEach(t => archiveMainEl.appendChild(renderArchiveItem('tasks', t.id, t.title, t.due ? 'דד-ליין: ' + t.due : '')));
  }
  if (archGuides.length) {
    archiveMainEl.appendChild(archiveSectionTitle('הנחיות'));
    archGuides.forEach(g => archiveMainEl.appendChild(renderArchiveItem('guides', g.id, g.title, g.text)));
  }
  if (archMeets.length) {
    archiveMainEl.appendChild(archiveSectionTitle('פגישות'));
    archMeets.forEach(m => archiveMainEl.appendChild(renderArchiveItem('meets', m.id, m.type, (m.date || '') + (m.notes ? ' · ' + m.notes : ''))));
  }
  if (archSchedules.length) {
    archiveMainEl.appendChild(archiveSectionTitle('לו״ז'));
    archSchedules.forEach(s => archiveMainEl.appendChild(renderArchiveItem('schedule', s.id, s.title, `${s.type} · ${s.durationValue} ${s.durationUnit}`)));
  }
}

function showDetail(id, ty) {
  const detail = document.getElementById('detail-content');
  if (ty === 't') {
    const t = tasks.find(x => x.id === id);
    const rows = Object.keys(t.stat || {}).map(u => { const c = CADETS.find(x => x.u === u); return `<li class="${t.stat[u] ? 'ok' : ''}">${esc(c ? c.d : u)} — <span class="status-icon ${t.stat[u] ? 'status-done' : 'status-pending'}">${t.stat[u] ? '✔' : '✗'}</span></li>`; }).join('');
    detail.innerHTML = `<h2>${esc(t.title)}</h2><ul class="dlist">${rows}</ul>`;
  } else if (ty === 'g') {
    const g = guides.find(x => x.id === id);
    const rows = Object.keys(g.conf || {}).map(u => { const c = ALL_USERS.find(x => x.u === u); return `<li class="${g.conf[u] ? 'ok' : ''}">${esc(c ? c.d : u)} — <span class="status-icon ${g.conf[u] ? 'status-done' : 'status-pending'}">${g.conf[u] ? '✔' : '✗'}</span></li>`; }).join('');
    detail.innerHTML = `<h2>אישורי קריאה</h2><ul class="dlist">${rows}</ul>`;
  } else if (ty === 'm') {
    const m = meets.find(x => x.id === id);
    const rows = Object.keys(m.conf || {}).map(u => { const c = ALL_USERS.find(x => x.u === u); return `<li class="${m.conf[u] ? 'ok' : ''}">${esc(c ? c.d : u)} — <span class="status-icon ${m.conf[u] ? 'status-done' : 'status-pending'}">${m.conf[u] ? '✔' : '✗'}</span></li>`; }).join('');
    detail.innerHTML = `<h2>אישורי הגעה</h2><ul class="dlist">${rows.length ? rows : '<li>אין צוערים הממתינים לאישור (רק קצינים הוזמנו)</li>'}</ul>`;
  }
  document.getElementById('modal-detail').classList.remove('hidden');
}

document.getElementById('modal-detail').addEventListener('click', e => { if (e.target.id === 'modal-detail') closeModal('detail'); });
['task', 'guide', 'meet', 'meet-edit', 'schedule'].forEach(m => { const md = document.getElementById(`modal-${m}`); md.addEventListener('click', e => { if (e.target === md) closeModal(m); }); });

function stopListeners() {
  [unsubscribeTasks, unsubscribeGuides, unsubscribeMeets, unsubscribeSchedules].forEach(fn => { if (fn) fn(); });
  unsubscribeTasks = unsubscribeGuides = unsubscribeMeets = unsubscribeSchedules = null;
}

function startListeners() {
  stopListeners();

  unsubscribeTasks = onSnapshot(query(collection(db, 'tasks'), orderBy('t', 'desc')), snap => {
    tasks = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    render();
  }, err => console.error('tasks', err));

  unsubscribeGuides = onSnapshot(query(collection(db, 'guides'), orderBy('t', 'desc')), snap => {
    guides = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    render();
  }, err => console.error('guides', err));

  unsubscribeMeets = onSnapshot(query(collection(db, 'meets'), orderBy('t', 'desc')), snap => {
    meets = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    render();
  }, err => console.error('meets', err));

  unsubscribeSchedules = onSnapshot(query(collection(db, 'schedule'), orderBy('t', 'desc')), snap => {
    schedules = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    render();
  }, err => console.error('schedule', err));
}
