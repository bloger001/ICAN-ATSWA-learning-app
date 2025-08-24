// status.js — merges local + cloud attempts, shows analytics + weak topics with “Read this” + “Practice”
// Requires: assets/firebase.js (exports auth, db)

import { auth, db } from './firebase.js';
import {
  collection, query, where, orderBy, limit, getDocs
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

const summaryEl = document.getElementById('summary');
const topicsEl  = document.getElementById('topics');

// Map weak-topic → resources.html anchor (cards open topic PDFs)
const RESOURCE_MAP = {
  // BASIC ACCOUNTING
  'Accounting Concepts': 'resources.html#ba-concepts',
  'Double Entry': 'resources.html#ba-double-entry',
  'Trial Balance': 'resources.html#ba-trial-balance',
  'Financial Statements': 'resources.html#ba-fin-stmts',
  'Cash Book': 'resources.html#ba-cash-book',
  // BUSINESS LAW (placeholders for now)
  'Ethics & Law': 'resources.html#blaw-ethics',
  'Contracts': 'resources.html#blaw-contracts',
  // COMMUNICATION SKILLS
  'Communication Basics': 'resources.html#cs-basics',
  'Listening & Writing': 'resources.html#cs-writing',
  // ECONOMICS
  'Demand & Supply': 'resources.html#econ-demand-supply',
  'National Income': 'resources.html#econ-national-income'
};

function getUserSlim(){
  try { return JSON.parse(localStorage.getItem('ican.user')||'null'); } catch { return null; }
}
const localUid = (getUserSlim() && getUserSlim().uid) || 'guest';
const LOCAL_KEY = `ican.results:${localUid}`;

function loadLocal(){
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY)||'[]'); }
  catch { return []; }
}

async function loadCloud(uid){
  if (!uid) return [];
  try{
    const q = query(
      collection(db, 'attempts'),
      where('uid', '==', uid),
      orderBy('ts','desc'),
      limit(1000)
    );
    const snap = await getDocs(q);
    const rows = [];
    snap.forEach(doc=>{
      const d = doc.data(); if (!d) return;
      rows.push({
        ts: (d.ts && d.ts.toMillis) ? d.ts.toMillis() : Date.now(),
        level: d.level, subject: d.subject, topic: d.topic||'',
        subtopic: d.subtopic||'', id: d.qid || '',
        stem: d.stem, options: d.options||[],
        correct_index: d.correct_index, chosen_index: d.chosen_index,
        correct: !!d.correct
      });
    });
    return rows;
  }catch(e){
    console.warn('Cloud load failed:', e?.message || e);
    return [];
  }
}

function dedupeMerge(a, b){
  const key = r => `${(r.stem||'')}_${r.ts||0}`;
  const seen = new Set();
  const out = [];
  [...a, ...b].forEach(r=>{
    const k = key(r);
    if (!seen.has(k)){ seen.add(k); out.push(r); }
  });
  return out;
}

function renderSummary(rows){
  if (!rows.length){
    summaryEl.innerHTML = `<p class="muted">No attempts yet. Take a quiz to see your stats.</p>`;
    return;
  }
  const total = rows.length;
  const correct = rows.filter(r=>r.correct).length;
  const pct = Math.round((correct/total)*100);

  // Update Review button count if present
  const mistakes = rows.filter(r=>!r.correct).length;
  const reviewBtn = document.querySelector('a[href^="review.html"]');
  if (reviewBtn) reviewBtn.textContent = `Review mistakes (${mistakes})`;

  summaryEl.innerHTML = `
    <div class="space-between" style="align-items:center">
      <div>
        <h2>Overview</h2>
        <p class="muted small">Synced when signed in. Works offline too.</p>
      </div>
      <div class="pill mono">Total: ${total} • Correct: ${correct} • ${pct}%</div>
    </div>
  `;
}

function guessSubject(topic){
  const x = (topic||'').toLowerCase();
  if (x.includes('contract') || x.includes('ethic') || x.includes('law')) return 'Business Law';
  if (x.includes('communic') || x.includes('writing') || x.includes('listening')) return 'Communication Skills';
  if (x.includes('demand') || x.includes('supply') || x.includes('national income') || x.includes('market')) return 'Economics';
  return 'Basic Accounting';
}

function renderWeakTopics(rows){
  if (!rows.length){ topicsEl.innerHTML = `<p class="muted">No data yet.</p>`; return; }

  // Aggregate by topic
  const byTopic = new Map();
  for (const r of rows){
    const t = r.topic || 'General';
    if (!byTopic.has(t)) byTopic.set(t, {topic:t, total:0, correct:0});
    const a = byTopic.get(t);
    a.total += 1;
    if (r.correct) a.correct += 1;
  }

  // Keep topics with at least 5 attempts, weakest first
  const list = [...byTopic.values()]
    .filter(t => t.total >= 5)
    .map(t => ({...t, acc: Math.round((t.correct/t.total)*100)}))
    .sort((a,b)=> a.acc - b.acc)
    .slice(0, 6);

  if (!list.length){
    topicsEl.innerHTML = `<p class="muted">Keep practicing to unlock targeted topic recommendations.</p>`;
    return;
  }

  topicsEl.innerHTML = list.map(t=>{
    const readUrl = RESOURCE_MAP[t.topic] || 'resources.html';
    const practiceUrl = `quiz.html?level=ATSWA1&subject=${encodeURIComponent(guessSubject(t.topic))}&mode=practice&topics=${encodeURIComponent(t.topic)}`;
    return `
      <div class="card" style="margin:8px 0">
        <div class="space-between" style="align-items:center">
          <div>
            <b>${t.topic}</b>
            <div class="muted small">Accuracy: ${t.acc}% • Attempts: ${t.total}</div>
          </div>
          <div class="row">
            <a class="btn" href="${practiceUrl}">Practice this topic</a>
            <a class="btn primary" href="${readUrl}">Read this</a>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

async function main(){
  // Local first (instant)
  let rows = loadLocal();
  renderSummary(rows);
  renderWeakTopics(rows);

  // Cloud merge (if signed in)
  const u = auth.currentUser || getUserSlim();
  if (u && u.uid){
    const cloud = await loadCloud(u.uid);
    if (cloud.length){
      rows = dedupeMerge(rows, cloud);
      renderSummary(rows);
      renderWeakTopics(rows);
    }
  }
}
main();