// Leonida Platinum — GTA VI trophy guide & tracker.
// Offline static app: loads only data/trophies.json from its own folder.
// Progress (earned ticks + notes + spoiler setting) is saved in localStorage.
const KEY = 'gta6-trophy-guide-v1';
const listEl = document.getElementById('list');
const detailEl = document.getElementById('detail');
const searchEl = document.getElementById('search');
const gradeEl = document.getElementById('gradeFilter');
const kindEl = document.getElementById('kindFilter');
const statusEl = document.getElementById('statusFilter');
const spoilerEl = document.getElementById('spoiler');

const data = await (await fetch('data/trophies.json')).json();
const trophies = data.trophies;
const byName = new Map(trophies.map((t) => [t.name, t]));

let saved = { earned: [], notes: {}, spoiler: false };
try { saved = { ...saved, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') }; } catch { /* fresh start */ }
const earned = new Set((saved.earned ?? []).filter((n) => byName.has(n)));
const notes = saved.notes ?? {};
spoilerEl.checked = !!saved.spoiler;
let selected = null;

const KIND_LABEL = { story: 'Story & completion', mission: 'Story mission', strand: 'Side strand', activity: 'Activity', collectible: 'Collectible', combat: 'Combat & crime', exploration: 'Exploration', misc: 'Moment & misc', platinum: 'Platinum' };
const GRADE_LABEL = { platinum: 'Platinum', gold: 'Gold', silver: 'Silver', bronze: 'Bronze' };

function save() {
  localStorage.setItem(KEY, JSON.stringify({ earned: [...earned], notes, spoiler: spoilerEl.checked }));
}

function spoilerHidden(t) {
  return spoilerEl.checked && !earned.has(t.name) && (t.kind === 'story' || t.kind === 'mission' || t.hidden);
}

function visible(t) {
  const q = searchEl.value.trim().toLowerCase();
  if (q && !(t.name + ' ' + t.description + ' ' + t.guide).toLowerCase().includes(q)) return false;
  if (gradeEl.value !== 'all' && t.grade !== gradeEl.value) return false;
  if (kindEl.value !== 'all' && t.kind !== kindEl.value) return false;
  if (statusEl.value === 'earned' && !earned.has(t.name)) return false;
  if (statusEl.value === 'remaining' && earned.has(t.name)) return false;
  if (statusEl.value === 'missable' && !t.missable) return false;
  return true;
}

function renderProgress() {
  const n = earned.size;
  const total = trophies.length;
  document.getElementById('earnedCount').textContent = String(n);
  document.getElementById('barFill').style.width = `${(100 * n) / total}%`;
  document.getElementById('progressText').textContent =
    n === total ? 'Platinum earned — Leonida Legend!' : `${Math.round((100 * n) / total)}% to the platinum — ${total - n} to go`;
}

function renderList() {
  const shown = trophies.filter(visible);
  document.getElementById('resultCount').textContent =
    `${shown.length} of ${trophies.length} trophies shown · ${earned.size} earned`;
  listEl.replaceChildren();
  for (const t of shown) {
    const li = document.createElement('li');
    li.className = 'item' + (earned.has(t.name) ? ' earned' : '') + (selected === t.name ? ' selected' : '');
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = earned.has(t.name);
    box.setAttribute('aria-label', `Earned: ${t.name}`);
    box.addEventListener('change', (e) => {
      e.stopPropagation();
      if (box.checked) earned.add(t.name); else earned.delete(t.name);
      save(); renderProgress(); renderList(); renderRoadmap(); renderNextUp();
      if (selected === t.name) renderDetail(t);
    });
    const dot = document.createElement('span');
    dot.className = `dot ${t.grade}`;
    const body = document.createElement('div');
    body.className = 'itemBody';
    const name = document.createElement('div');
    name.className = 'itemName';
    name.textContent = spoilerHidden(t) ? 'Hidden story trophy — earn it to reveal' : t.name;
    if (t.missable) {
      const flag = document.createElement('span');
      flag.className = 'flag';
      flag.textContent = 'Missable';
      name.append(flag);
    }
    const desc = document.createElement('div');
    desc.className = 'itemDesc';
    desc.textContent = spoilerHidden(t) ? 'Hidden on PlayStation until earned.' : t.description;
    const meta = document.createElement('div');
    meta.className = 'itemMeta';
    const g = document.createElement('span');
    g.className = `tag grade-${t.grade}`;
    g.textContent = GRADE_LABEL[t.grade];
    const k = document.createElement('span');
    k.className = 'tag';
    k.textContent = KIND_LABEL[t.kind] ?? t.kind;
    meta.append(g, k);
    if (t.target) {
      const tg = document.createElement('span');
      tg.className = 'tag';
      tg.textContent = `PSN target: ${t.target}`;
      meta.append(tg);
    }
    if (notes[t.name]) {
      const nt = document.createElement('span');
      nt.className = 'tag';
      nt.textContent = 'Has a note';
      meta.append(nt);
    }
    body.append(name, desc, meta);
    li.append(box, dot, body);
    li.addEventListener('click', () => { selected = t.name; renderList(); renderDetail(t); });
    listEl.append(li);
  }
  if (!shown.length) {
    const li = document.createElement('li');
    li.className = 'muted';
    li.textContent = 'No trophies match these filters — clear the search or widen the filters.';
    listEl.append(li);
  }
}

function sourceList() {
  const ul = document.createElement('ul');
  ul.className = 'srcList';
  for (const s of data.sources) {
    const li = document.createElement('li');
    if (s.url) {
      const a = document.createElement('a');
      a.href = s.url; a.target = '_blank'; a.rel = 'noopener';
      a.textContent = s.label;
      li.append(a, document.createTextNode(` — ${s.covers}`));
    } else {
      li.textContent = `${s.label} — ${s.covers}`;
    }
    ul.append(li);
  }
  return ul;
}

function renderDetail(t) {
  detailEl.replaceChildren();
  const h = document.createElement('h2');
  h.textContent = spoilerHidden(t) ? 'Hidden story trophy' : t.name;
  const off = document.createElement('p');
  off.className = 'official';
  off.textContent = spoilerHidden(t)
    ? 'Hidden on PlayStation until earned. Its name and description stay hidden here too while the spoiler setting is on.'
    : `Official description: “${t.description}”`;
  const meta = document.createElement('p');
  meta.textContent = `${GRADE_LABEL[t.grade]} · ${KIND_LABEL[t.kind] ?? t.kind}${t.target ? ` · PSN target: ${t.target}` : ''}${t.hidden ? ' · Hidden on PSN' : ''}`;
  detailEl.append(h, off, meta);
  if (t.missable) {
    const w = document.createElement('p');
    w.className = 'warn';
    w.textContent = 'Missable — flagged from the official description. Do it when the chance appears; the game may or may not let you replay it, and that is not yet confirmed in-game.';
    detailEl.append(w);
  }
  if (!spoilerHidden(t)) {
    const gh = document.createElement('h3');
    gh.textContent = 'How to get it';
    const g = document.createElement('p');
    g.textContent = t.guide;
    detailEl.append(gh, g);
    const sh = document.createElement('h3');
    sh.textContent = 'Sources';
    detailEl.append(sh, sourceList());
  }
  const nh = document.createElement('h3');
  nh.textContent = 'Your note';
  const ta = document.createElement('textarea');
  ta.value = notes[t.name] ?? '';
  ta.placeholder = 'e.g. “Found the 3rd card set near the marina — 2 cards left.”';
  ta.setAttribute('aria-label', 'Your note for this trophy');
  ta.addEventListener('input', () => { notes[t.name] = ta.value; save(); });
  const actions = document.createElement('div');
  actions.className = 'actions';
  const mark = document.createElement('button');
  mark.type = 'button';
  mark.textContent = earned.has(t.name) ? 'Mark as not earned' : 'Mark as earned';
  mark.addEventListener('click', () => {
    if (earned.has(t.name)) earned.delete(t.name); else earned.add(t.name);
    save(); renderProgress(); renderList(); renderRoadmap(); renderNextUp(); renderDetail(t);
  });
  actions.append(mark);
  detailEl.append(nh, ta, actions);
}

// Roadmap: five stages in play order, each naming the trophies it covers.
const STAGES = [
  { title: 'Stage 1 — Play the story', text: 'Chapters 1–4 and the finale. Every chapter and mission trophy lands here; nothing else is required.', ids: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13] },
  { title: 'Stage 2 — Side strands & one-time moments', text: 'Stranger strands as they open, plus the flagged missables — do each when its chance appears, before the finale.', ids: [22, 23, 24, 25, 26, 27, 29, 33, 34, 36, 37, 39, 44, 45, 46, 47, 48, 49, 50, 51] },
  { title: 'Stage 3 — Activities & skills', text: 'Races, shooting range, stunts, fishing, arcade and bowling. Gold medals and wins take practice — save the hardest for after the story.', ids: [15, 16, 17, 18, 19, 20, 21, 32] },
  { title: 'Stage 4 — Collectibles & exploring Leonida', text: 'Cards, WAiNK spots, meditation, garages, vehicles and the full map. Best done on road trips that cover several lists at once.', ids: [28, 30, 31, 35, 40, 41, 42, 43, 54, 55] },
  { title: 'Stage 5 — Cleanup & the platinum', text: 'Money goals, bank vaults, tanks and 100% completion — then the platinum pops on its own.', ids: [1, 14, 38, 52, 53] },
];
const stageTrophies = (s) => s.ids.map((id) => trophies.find((t) => t.id === id)).filter(Boolean);

function renderRoadmap() {
  const host = document.getElementById('roadmap');
  host.replaceChildren();
  for (const s of STAGES) {
    const ts = stageTrophies(s);
    const done = ts.filter((t) => earned.has(t.name)).length;
    const div = document.createElement('div');
    div.className = 'stage';
    const h = document.createElement('h3');
    h.textContent = `${s.title} — ${done}/${ts.length}`;
    const bar = document.createElement('div');
    bar.className = 'bar';
    const fill = document.createElement('div');
    fill.className = 'fill';
    fill.style.width = `${(100 * done) / ts.length}%`;
    bar.append(fill);
    const p = document.createElement('p');
    p.textContent = s.text;
    const names = document.createElement('p');
    names.className = 'muted';
    names.textContent = ts.map((t) => `${earned.has(t.name) ? '✓ ' : ''}${spoilerHidden(t) ? 'Hidden story trophy' : t.name}`).join(' · ');
    div.append(h, bar, p, names);
    host.append(div);
  }
}

function renderMissables() {
  const host = document.getElementById('missableList');
  host.replaceChildren();
  document.getElementById('missCount').textContent = String(trophies.filter((t) => t.missable).length);
  for (const t of trophies.filter((x) => x.missable)) {
    const div = document.createElement('div');
    div.className = 'missCard';
    const h = document.createElement('h3');
    h.textContent = `${earned.has(t.name) ? '✓ ' : ''}${t.name} — ${GRADE_LABEL[t.grade]}`;
    const p = document.createElement('p');
    p.textContent = t.guide;
    const jump = document.createElement('button');
    jump.type = 'button';
    jump.textContent = 'Open in checklist';
    jump.addEventListener('click', () => {
      selected = t.name;
      searchEl.value = ''; gradeEl.value = 'all'; kindEl.value = 'all'; statusEl.value = 'all';
      switchView('checklist'); renderList(); renderDetail(t);
      document.getElementById('detail').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
    div.append(h, p, jump);
    host.append(div);
  }
}

function renderNextUp() {
  const host = document.getElementById('nextList');
  host.replaceChildren();
  const rest = trophies.filter((t) => !earned.has(t.name));
  const rank = (t) => (t.missable ? 0 : t.kind === 'story' || t.kind === 'mission' ? 1 : t.kind === 'strand' ? 2 : t.grade === 'bronze' ? 3 : 4);
  rest.sort((a, b) => rank(a) - rank(b) || a.id - b.id);
  for (const t of rest.slice(0, 12)) {
    const li = document.createElement('li');
    const b = document.createElement('strong');
    b.textContent = spoilerHidden(t) ? 'Hidden story trophy' : t.name;
    const why = document.createElement('span');
    why.className = 'why';
    why.textContent = t.missable ? ' — missable: do it when the chance appears'
      : t.kind === 'story' || t.kind === 'mission' ? ' — next in the story'
      : t.kind === 'strand' ? ' — finish this strand while it is open'
      : ` — ${GRADE_LABEL[t.grade].toLowerCase()} grind, fits between missions`;
    li.append(b, why);
    li.addEventListener('click', () => { selected = t.name; switchView('checklist'); renderList(); renderDetail(t); });
    host.append(li);
  }
  if (!rest.length) {
    const li = document.createElement('li');
    li.textContent = 'Everything is earned — Leonida Legend. The platinum is yours.';
    host.append(li);
  }
}

function switchView(name) {
  for (const btn of document.querySelectorAll('.tab')) {
    const on = btn.dataset.view === name;
    btn.classList.toggle('active', on);
    btn.setAttribute('aria-selected', String(on));
  }
  for (const v of document.querySelectorAll('.view')) v.classList.toggle('hidden', v.id !== `view-${name}`);
}
for (const btn of document.querySelectorAll('.tab')) btn.addEventListener('click', () => switchView(btn.dataset.view));

for (const el of [searchEl, gradeEl, kindEl, statusEl]) el.addEventListener('input', renderList);
spoilerEl.addEventListener('change', () => { save(); renderList(); if (selected) renderDetail(byName.get(selected)); });

document.getElementById('exportBtn').addEventListener('click', () => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify({ game: 'Grand Theft Auto VI', earned: [...earned], notes }, null, 2)], { type: 'application/json' }));
  a.download = 'gta6-trophy-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
});
document.getElementById('importFile').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const imported = JSON.parse(await file.text());
    const names = Array.isArray(imported) ? imported : imported.earned;
    const valid = (names ?? []).filter((n) => byName.has(n));
    if (!valid.length) throw new Error('no known trophy names');
    earned.clear();
    for (const n of valid) earned.add(n);
    if (imported.notes) Object.assign(notes, imported.notes);
    save(); renderProgress(); renderList(); renderRoadmap(); renderNextUp();
    if (selected) renderDetail(byName.get(selected));
  } catch {
    alert('That file is not a trophy progress export from this guide.');
  }
  e.target.value = '';
});
document.getElementById('resetBtn').addEventListener('click', () => {
  if (!confirm('Clear all earned ticks and notes?')) return;
  earned.clear();
  for (const k of Object.keys(notes)) delete notes[k];
  save(); renderProgress(); renderList(); renderRoadmap(); renderNextUp();
  detailEl.replaceChildren();
  const p = document.createElement('p');
  p.className = 'muted';
  p.textContent = 'Select a trophy to see its full guide, sources and your note.';
  detailEl.append(p);
});

renderProgress();
renderList();
renderRoadmap();
renderMissables();
renderNextUp();
