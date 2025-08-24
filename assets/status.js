// assets/status.js — analytics + weak topics with resource links

const summaryEl = document.getElementById('summary');
const topicsEl  = document.getElementById('topics');

// map topics -> resources anchors (edit to match your resources.html sections)
const RESOURCE_MAP = {
  'Accounting Concepts': 'resources.html#ba-concepts',
  'Double Entry': 'resources.html#ba-double-entry',
  'Trial Balance': 'resources.html#ba-trial-balance',
  'Financial Statements': 'resources.html#ba-fin-stmts',
  'Cash Book': 'resources.html#ba-cash-book',
  'Ethics & Law': 'resources.html#blaw-ethics',
  'Contracts': 'resources.html#blaw-contracts',
  'Communication Basics': 'resources.html#cs-basics',
  'Listening & Writing': 'resources.html#cs-writing',
  'Demand & Supply': 'resources.html#econ-demand-supply',
  'National Income': 'resources.html#econ-national-income'
};

// get current user (for per-user localStorage key)
function getUserSlim(){
  try { return JSON.parse(localStorage.getItem('ican.user')||'null'); } catch { return null; }
}
const uid = (getUserSlim() && getUserSlim().uid) || 'guest';
const KEY = `ican.results:${uid}`;

function loadAll(){
  try { return JSON.parse(localStorage.getItem(KEY)||'[]'); }
  catch { return []; }
}

function renderSummary(rows){
  if (!rows.length){
    summaryEl.innerHTML = `<p class="muted">No attempts yet. Take a quiz to see your stats.</p>`;
    return;
  }
  const total = rows.length;
  const correct = rows.filter(r=>r.correct).length;
  const pct = Math.round((correct/total)*100);

  // mistakes count for Review button (status.html has a link to review.html)
  const mistakes = rows.filter(r=>!r.correct).length;
  const reviewBtn = document.querySelector('a[href^="review.html"]');
  if (reviewBtn) reviewBtn.textContent = `Review mistakes (${mistakes})`;

  summaryEl.innerHTML = `
    <div class="space-between" style="align-items:center">
      <div>
        <h2>Overview</h2>
        <p class="muted">Tracks your attempts locally on this device. (Leaderboard uses cloud sync.)</p>
      </div>
      <div class="pill mono">Total: ${total} • Correct: ${correct} • ${pct}%</div>
    </div>
  `;
}

function renderWeakTopics(rows){
  if (!rows.length){
    topicsEl.innerHTML = `<p class="muted">No data yet.</p>`;
    return;
  }

  // per-topic stats
  const byTopic = new Map();
  for (const r of rows){
    const t = r.topic || 'General';
    if (!byTopic.has(t)) byTopic.set(t, {topic:t, total:0, correct:0});
    const a = byTopic.get(t);
    a.total += 1;
    if (r.correct) a.correct += 1;
  }

  // compute accuracy & keep topics with >=5 attempts
  const list = [...byTopic.values()]
    .filter(t => t.total >= 5)
    .map(t => ({...t, acc: Math.round((t.correct/t.total)*100)}))
    .sort((a,b)=> a.acc - b.acc) // weakest first
    .slice(0, 6);

  if (!list.length){
    topicsEl.innerHTML = `<p class="muted">Keep practicing to unlock targeted topic recommendations.</p>`;
    return;
  }

  const cards = list.map(t=>{
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

  topicsEl.innerHTML = cards;
}

// naive subject guesser (tune if you want)
function guessSubject(topic){
  const x = topic.toLowerCase();
  if (x.includes('contract') || x.includes('ethic') || x.includes('law')) return 'Business Law';
  if (x.includes('communic') || x.includes('writing') || x.includes('listening')) return 'Communication Skills';
  if (x.includes('demand') || x.includes('supply') || x.includes('national income') || x.includes('market')) return 'Economics';
  return 'Basic Accounting';
}

(function init(){
  const rows = loadAll();
  renderSummary(rows);
  renderWeakTopics(rows);
})();