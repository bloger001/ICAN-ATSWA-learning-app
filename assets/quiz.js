// assets/quiz.js — multi-subject + topic filter + shuffle + analytics + review link

const qs = new URLSearchParams(location.search);
const level   = qs.get('level')   || 'ATSWA1';
const subject = qs.get('subject') || 'Basic Accounting';
const mode    = qs.get('mode')    || 'practice';

// Optional focus by topics: ?topics=Elasticity,Inflation
const topicsFilter = (qs.get('topics') || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

const FILES = {
  'Basic Accounting'    : 'data/atswa1_basic_accounting.json',
  'Economics'           : 'data/atswa1_economics.json',
  'Business Law'        : 'data/atswa1_business_law.json',
  'Communication Skills': 'data/atswa1_comm_skills.json'
};

// UI hooks
const meta      = document.getElementById('meta');
const qwrap     = document.getElementById('qwrap');
const qstem     = document.getElementById('qstem');
const qopts     = document.getElementById('qopts');
const nextBtn   = document.getElementById('nextBtn');
const submitBtn = document.getElementById('submitBtn');
const result    = document.getElementById('result');

meta.textContent = `Level: ${level} — Subject: ${subject} — Mode: ${mode}${topicsFilter.length ? ' — Focus: ' + topicsFilter.join(', ') : ''}`;

let questions = [];
let idx = 0;
let selected = null;
let score = 0;
let busy = false;

/* ---------- helpers ---------- */
function shuffle(arr){ for(let i=arr.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]] } return arr; }
function lock(ms=300){ busy = true; setTimeout(()=>busy=false, ms); }

function getUserKey(){
  try {
    const u = JSON.parse(localStorage.getItem('ican.user') || 'null');
    return u && u.uid ? u.uid : 'guest';
  } catch { return 'guest'; }
}
const RESULTS_KEY = `ican.results:${getUserKey()}`;

/* ---------- analytics logging (with snapshot) ---------- */
function logAttemptSnapshot(q, chosenIndex){
  const rec = {
    ts: Date.now(),
    level,
    subject,
    topic: q.topic || '',
    subtopic: q.subtopic || '',
    id: q.id || '',
    stem: q.stem,                 // snapshot
    options: q.options,           // snapshot
    correct_index: q.answer_index,
    chosen_index: chosenIndex,
    correct: chosenIndex === q.answer_index
  };
  try {
    const arr = JSON.parse(localStorage.getItem(RESULTS_KEY) || '[]');
    arr.push(rec);
    localStorage.setItem(RESULTS_KEY, JSON.stringify(arr));
  } catch {}
}

/* ---------- save/restore progress ---------- */
const SAVE_KEY = `ican.progress:${subject}:${topicsFilter.join('|')}`;
function saveProgress(){
  const state = { idx, score, selected, questions_ids: questions.map(q=>q.id) };
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(state)); } catch {}
}
function loadProgress(){
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
    if (s && Number.isInteger(s.idx) && Array.isArray(s.questions_ids)) {
      idx = s.idx; score = s.score||0; selected = s.selected??null;
      const same = s.questions_ids.length && s.questions_ids.every((id,i)=>questions[i] && questions[i].id === id);
      if (!same){ idx = 0; score = 0; selected = null; }
    }
  } catch {}
}
window.addEventListener('beforeunload', saveProgress);
document.addEventListener('visibilitychange', ()=>{ if (document.hidden) saveProgress(); });

/* ---------- load questions ---------- */
async function loadData(){
  const file = FILES[subject];
  if(!file){
    qstem.innerHTML = `<div class="card muted">Unknown subject. Go back and pick again.</div>`;
    qwrap.querySelector('.row').style.display = 'none';
    return;
  }
  try{
    const res = await fetch(`${file}?v=${Date.now()}`, {cache:'no-store'});
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    let data = await res.json();
    if(!Array.isArray(data) || data.length === 0) throw new Error('Empty set');

    if (topicsFilter.length){
      data = data.filter(q => topicsFilter.includes(q.topic));
      if (data.length === 0) throw new Error('No questions for selected topic(s).');
    }

    questions = shuffle(data.slice());
    loadProgress();
    render();
  }catch(err){
    qstem.innerHTML = `
      <div class="card">
        <b>Couldn’t load questions for ${subject}.</b><br>
        <span class="muted small">Expected file: <code>${file}</code></span><br>
        <span class="muted small">Error: ${err.message}</span>
      </div>`;
    console.error(err);
  }
}

/* ---------- render a question ---------- */
function render(){
  const q = questions[idx];
  if(!q){ return finish(); }

  qstem.innerHTML = `
    <div class="pill mono">${idx+1}/${questions.length}</div>
    <h2>${q.stem}</h2>
    ${q.topic ? `<p class="muted small">${q.topic}${q.subtopic? ' • ' + q.subtopic : ''}</p>` : '' }
  `;
  qopts.innerHTML = '';

  const opts = shuffle(q.options.map((text,i)=>({text,i})));
  opts.forEach(({text,i})=>{
    const d = document.createElement('div');
    d.className = 'opt';
    d.textContent = text;
    d.onclick = ()=> select(i,d);
    qopts.appendChild(d);
  });

  selected = null;
}

function select(i, el){
  [...document.querySelectorAll('.opt')].forEach(o=>o.classList.remove('selected'));
  el.classList.add('selected');
  selected = i;
}

nextBtn.onclick = ()=>{
  if (busy) return;
  if (selected == null) return alert('Select an option first');
  const q = questions[idx];
  logAttemptSnapshot(q, selected);
  if (selected === q.answer_index) score++;
  idx++; lock();
  saveProgress();
  if(idx < questions.length) render(); else finish();
};

submitBtn.onclick = ()=>{ if (!busy){ lock(); finish(); } };

/* ---------- finish screen ---------- */
function finish(){
  qwrap.style.display = 'none';
  localStorage.removeItem(SAVE_KEY);
  const pct = Math.round((score/questions.length)*100);
  result.style.display = '';
  result.innerHTML = `
    <h2>Result: ${pct}%</h2>
    <p>Score: ${score} / ${questions.length}</p>
    <div class="muted small">Subject: ${subject}${topicsFilter.length ? ' — Focus: ' + topicsFilter.join(', ') : ''}</div>
    <div class="row" style="margin-top:10px; flex-wrap:wrap">
      <a class="btn" href="index.html">← Back Home</a>
      <a class="btn" href="quiz.html?level=${encodeURIComponent(level)}&subject=${encodeURIComponent(subject)}&mode=${encodeURIComponent(mode)}${topicsFilter.length ? '&topics='+encodeURIComponent(topicsFilter.join(',')) : ''}">Retry</a>
      <a class="btn" href="./status.html?v=1">View Status</a>
      <a class="btn primary" href="./review.html?v=1">Review mistakes</a>
    </div>
  `;
}

/* ---------- go ---------- */
loadData();