// assets/quiz.js — multi-subject + topic filter + shuffle + local analytics + Firestore sync

import { auth, db } from './firebase.js';
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

const qs = new URLSearchParams(location.search);
const level   = qs.get('level')   || 'ATSWA1';
const subject = qs.get('subject') || 'Basic Accounting';
const mode    = qs.get('mode')    || 'practice';
const topicsFilter = (qs.get('topics') || '').split(',').map(s=>s.trim()).filter(Boolean);

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
let idx = 0, selected = null, score = 0, busy = false;

/* helpers */
function shuffle(a){ for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]];} return a; }
function lock(ms=300){ busy=true; setTimeout(()=>busy=false, ms); }
function getUserSlim(){
  try{ const u = JSON.parse(localStorage.getItem('ican.user')||'null'); return u||null; }catch{ return null; }
}

/* local analytics (mistake review & status) */
const RESULTS_KEY = `ican.results:${(getUserSlim()&&getUserSlim().uid)||'guest'}`;
function logAttemptSnapshot(q, chosenIndex){
  const rec = {
    ts: Date.now(), level, subject, topic: q.topic||'', subtopic: q.subtopic||'',
    id: q.id||'', stem: q.stem, options: q.options,
    correct_index: q.answer_index, chosen_index: chosenIndex,
    correct: chosenIndex === q.answer_index
  };
  try { const arr = JSON.parse(localStorage.getItem(RESULTS_KEY) || '[]'); arr.push(rec);
        localStorage.setItem(RESULTS_KEY, JSON.stringify(arr)); } catch {}
}

/* progress save/restore per subject+topic */
const SAVE_KEY = `ican.progress:${subject}:${topicsFilter.join('|')}`;
function saveProgress(){ try { localStorage.setItem(SAVE_KEY, JSON.stringify({ idx, score, selected, ids: questions.map(q=>q.id) })); } catch {} }
function loadProgress(){ try {
  const s = JSON.parse(localStorage.getItem(SAVE_KEY)||'null');
  if (s && Number.isInteger(s.idx) && Array.isArray(s.ids)) {
    const same = s.ids.length && s.ids.every((id,i)=> questions[i] && questions[i].id === id);
    if (same){ idx=s.idx; score=s.score||0; selected=s.selected??null; }
  }
} catch{} }
window.addEventListener('beforeunload', saveProgress);
document.addEventListener('visibilitychange', ()=>{ if (document.hidden) saveProgress(); });

/* load questions */
async function loadData(){
  const file = FILES[subject];
  if(!file){ qstem.innerHTML = `<div class="card muted">Unknown subject.</div>`; qwrap.querySelector('.row').style.display='none'; return; }
  try{
    const res = await fetch(`${file}?v=${Date.now()}`, {cache:'no-store'});
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    let data = await res.json();
    if(!Array.isArray(data)||!data.length) throw new Error('Empty set');
    if (topicsFilter.length){
      data = data.filter(q => topicsFilter.includes(q.topic));
      if (!data.length) throw new Error('No questions for selected topic(s).');
    }
    questions = shuffle(data.slice());
    loadProgress();
    render();
  }catch(err){
    qstem.innerHTML = `<div class="card"><b>Load error:</b> ${err.message}</div>`;
    console.error(err);
  }
}

/* render */
function render(){
  const q = questions[idx]; if(!q){ return finish(); }
  qstem.innerHTML = `
    <div class="pill mono">${idx+1}/${questions.length}</div>
    <h2>${q.stem}</h2>
    ${q.topic ? `<p class="muted small">${q.topic}${q.subtopic? ' • ' + q.subtopic : ''}</p>`:''}
  `;
  qopts.innerHTML = '';
  shuffle(q.options.map((text,i)=>({text,i}))).forEach(({text,i})=>{
    const d=document.createElement('div'); d.className='opt'; d.textContent=text;
    d.onclick=()=>{[...document.querySelectorAll('.opt')].forEach(o=>o.classList.remove('selected')); d.classList.add('selected'); selected=i; };
    qopts.appendChild(d);
  });
  selected=null;
}

nextBtn.onclick = ()=>{
  if (busy) return;
  if (selected==null) return alert('Select an option first');
  const q=questions[idx];
  logAttemptSnapshot(q, selected);           // local review log
  if (selected===q.answer_index) score++;
  idx++; lock(); saveProgress();
  if (idx<questions.length) render(); else finish();
};
submitBtn.onclick = ()=>{ if (!busy){ lock(); finish(); } };

/* finish: show result + sync to Firestore */
async function finish(){
  qwrap.style.display='none'; localStorage.removeItem(SAVE_KEY);
  const total = questions.length; const pct = Math.round((score/total)*100);
  result.style.display=''; result.innerHTML = `
    <h2>Result: ${pct}%</h2>
    <p>Score: ${score} / ${total}</p>
    <div class="muted small">Subject: ${subject}${topicsFilter.length ? ' — Focus: ' + topicsFilter.join(', ') : ''}</div>
    <div class="row" style="margin-top:10px;flex-wrap:wrap">
      <a class="btn" href="index.html">← Back Home</a>
      <a class="btn" href="quiz.html?level=${encodeURIComponent(level)}&subject=${encodeURIComponent(subject)}&mode=${encodeURIComponent(mode)}${topicsFilter.length ? '&topics='+encodeURIComponent(topicsFilter.join(',')) : ''}">Retry</a>
      <a class="btn" href="./status.html?v=1">View Status</a>
      <a class="btn primary" href="./review.html?v=1">Review mistakes</a>
    </div>
  `;

  // Firestore sync (best-effort)
  try {
    const u = auth.currentUser || getUserSlim(); // use live or cached
    if (u && (u.uid || u.email)) {
      await addDoc(collection(db, 'runs'), {
        uid: u.uid || 'unknown',
        email: u.email || null,
        displayName: u.displayName || null,
        level, subject,
        score, total, pct,
        topics: topicsFilter,
        ts: serverTimestamp()
      });
    }
  } catch (e) {
    console.warn('Sync failed:', e?.message || e);
  }
}

/* go */
loadData();