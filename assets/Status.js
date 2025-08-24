// assets/status.js — aggregates attempts, shows strengths/weaknesses, suggests practice

// get user key (same as quiz.js)
function getUserKey(){
  try {
    const u = JSON.parse(localStorage.getItem('ican.user') || 'null');
    return u && u.uid ? u.uid : 'guest';
  } catch { return 'guest'; }
}
const RESULTS_KEY = `ican.results:${getUserKey()}`;

// Config thresholds
const MIN_ATTEMPTS_FOR_TOPIC = 4;   // need at least 4 attempts to judge a topic
const WEAK_THRESHOLD = 0.6;         // <60% = weak
const STRONG_THRESHOLD = 0.8;       // >=80% = strong

// Optional: map topics to reading resources (you can extend freely)
const RESOURCES = {
  "Economics": {
    "Elasticity": [
      { label: "Practice: Elasticity set", link: "quiz.html?level=ATSWA1&subject=Economics&mode=practice&topics=Elasticity" }
    ],
    "Inflation": [
      { label: "Practice: Inflation set", link: "quiz.html?level=ATSWA1&subject=Economics&mode=practice&topics=Inflation" }
    ],
    "GDP": [
      { label: "Practice: National Income set", link: "quiz.html?level=ATSWA1&subject=Economics&mode=practice&topics=GDP" }
    ]
  },
  "Business Law": {
    "Contract": [
      { label: "Practice: Contract set", link: "quiz.html?level=ATSWA1&subject=Business%20Law&mode=practice&topics=Contract" }
    ],
    "Company Law": [
      { label: "Practice: Company Law set", link: "quiz.html?level=ATSWA1&subject=Business%20Law&mode=practice&topics=Company%20Law" }
    ],
    "Sale of Goods": [
      { label: "Practice: Sale of Goods set", link: "quiz.html?level=ATSWA1&subject=Business%20Law&mode=practice&topics=Sale%20of%20Goods" }
    ]
  },
  "Communication Skills": {
    "Grammar": [
      { label: "Practice: Grammar set", link: "quiz.html?level=ATSWA1&subject=Communication%20Skills&mode=practice&topics=Grammar" }
    ],
    "Business Communication": [
      { label: "Practice: Business Communication set", link: "quiz.html?level=ATSWA1&subject=Communication%20Skills&mode=practice&topics=Business%20Communication" }
    ]
  },
  "Basic Accounting": {
    "Trial Balance": [
      { label: "Practice: Trial Balance set", link: "quiz.html?level=ATSWA1&subject=Basic%20Accounting&mode=practice&topics=Trial%20Balance" }
    ]
  }
};

// Load data
function loadResults(){
  try {
    return JSON.parse(localStorage.getItem(RESULTS_KEY) || '[]');
  } catch { return []; }
}

function percent(n,d){ return d ? Math.round((n/d)*100) : 0; }

function aggregate(results){
  const bySubject = {};
  const byTopic = {};
  const missed = [];

  for (const r of results){
    // subject summary
    const s = bySubject[r.subject] ||= { correct:0, total:0 };
    s.total++; if (r.correct) s.correct++;

    // topic summary
    const key = `${r.subject}||${r.topic||'General'}`;
    const t = byTopic[key] ||= { subject:r.subject, topic:r.topic || 'General', correct:0, total:0 };
    t.total++; if (r.correct) t.correct++;

    // missed list
    if (!r.correct){
      missed.push(r);
    }
  }
  missed.sort((a,b)=>b.ts - a.ts); // latest missed first
  return { bySubject, byTopic, missed };
}

function buildSummary(total, correct){
  const wrap = document.getElementById('summary');
  const pct = percent(correct, total);
  wrap.innerHTML = `
    <div class="space-between">
      <div>
        <h2>Overview</h2>
        <p class="muted">Tracks your attempts locally on this device. Sign-in sync coming soon.</p>
      </div>
      <div class="pill mono">Total: ${total} • Correct: ${correct} • ${pct}%</div>
    </div>
  `;
}

function buildSubjects(bySubject){
  const grid = document.getElementById('subjectGrid');
  grid.innerHTML = '';
  Object.entries(bySubject).forEach(([subject, s])=>{
    const tile = document.createElement('a');
    tile.className = 'tile';
    tile.innerHTML = `
      <div class="muted small">Subject</div>
      <div style="font-weight:700">${subject}</div>
      <div class="muted small">Score: ${percent(s.correct, s.total)}% (${s.correct}/${s.total})</div>
      <div class="row" style="margin-top:6px">
        <a class="btn" href="quiz.html?level=ATSWA1&subject=${encodeURIComponent(subject)}&mode=practice">Practice</a>
        <a class="btn" href="quiz.html?level=ATSWA1&subject=${encodeURIComponent(subject)}&mode=practice&topics=">Focus by topics</a>
      </div>
    `;
    grid.appendChild(tile);
  });
}

function buildFocus(byTopic){
  const list = document.getElementById('focusList');
  list.innerHTML = '';
  const topics = Object.values(byTopic)
    .filter(t => t.total >= MIN_ATTEMPTS_FOR_TOPIC)
    .sort((a,b)=> (a.correct/a.total) - (b.correct/b.total));

  if (!topics.length){
    list.innerHTML = `<p class="muted">Answer more questions to unlock focus analytics.</p>`;
    return;
  }

  const weak = topics.filter(t => (t.correct/t.total) < WEAK_THRESHOLD).slice(0, 8);
  if (!weak.length){
    list.innerHTML = `<p>Nice! No weak topics detected yet. Keep practicing.</p>`;
    return;
  }

  weak.forEach(t=>{
    const pct = percent(t.correct, t.total);
    const row = document.createElement('div');
    row.className = 'card';
    row.style.margin = '8px 0';
    row.innerHTML = `
      <div class="space-between" style="align-items:center">
        <div>
          <div class="muted small">${t.subject}</div>
          <div style="font-weight:700">${t.topic}</div>
          <div class="muted small">Accuracy: ${pct}% (${t.correct}/${t.total})</div>
        </div>
        <div class="row">
          <a class="btn primary" href="quiz.html?level=ATSWA1&subject=${encodeURIComponent(t.subject)}&mode=practice&topics=${encodeURIComponent(t.topic)}">Practice this topic</a>
        </div>
      </div>
    `;
    list.appendChild(row);
  });
}

function buildMissed(missed){
  const box = document.getElementById('missedList');
  box.innerHTML = '';
  if (!missed.length){
    box.innerHTML = `<p class="muted">You haven’t missed any questions yet — great job!</p>`;
    return;
  }
  missed.slice(0, 10).forEach(m=>{
    const row = document.createElement('div');
    row.className = 'card';
    row.style.margin = '8px 0';
    const when = new Date(m.ts).toLocaleString();
    row.innerHTML = `
      <div class="muted small">${m.subject} • ${m.topic || 'General'} • ${when}</div>
      <div style="margin:4px 0"><b>Missed Q:</b> <span class="muted">${m.id || '(no id)'}</span></div>
      <div class="row">
        <a class="btn" href="quiz.html?level=ATSWA1&subject=${encodeURIComponent(m.subject)}&mode=practice&topics=${encodeURIComponent(m.topic || '')}">Practice topic</a>
      </div>
    `;
    box.appendChild(row);
  });
}

function buildResources(byTopic){
  const box = document.getElementById('resourceList');
  box.innerHTML = '';
  // List top 6 topics with weakest performance that also have a resource mapping
  const topics = Object.values(byTopic).sort((a,b)=> (a.correct/a.total) - (b.correct/b.total));
  let added = 0;
  for (const t of topics){
    if (added >= 6) break;
    const subjectMap = RESOURCES[t.subject] || {};
    const links = subjectMap[t.topic];
    if (!links) continue;

    const wrap = document.createElement('div');
    wrap.className = 'card';
    wrap.style.margin = '8px 0';
    wrap.innerHTML = `
      <div class="muted small">${t.subject}</div>
      <div style="font-weight:700">${t.topic}</div>
      <div class="row" style="margin-top:6px">
        ${links.map(l=>`<a class="btn" href="${l.link}">${l.label}</a>`).join('')}
      </div>
      <div class="muted small" style="margin-top:6px">
        Tip: open “Resources” page for your PDFs and notes for this topic.
      </div>
    `;
    box.appendChild(wrap);
    added++;
  }
}

function main(){
  const results = loadResults();
  const total = results.length;
  const correct = results.filter(r=>r.correct).length;

  buildSummary(total, correct);

  const { bySubject, byTopic, missed } = aggregate(results);
  buildSubjects(bySubject);
  buildFocus(byTopic);
  buildMissed(missed);
  buildResources(byTopic);

  document.getElementById('resetBtn').onclick = ()=>{
    if (confirm('Reset all local stats for this user on this device?')){
      localStorage.removeItem(RESULTS_KEY);
      location.reload();
    }
  };
}

main();
