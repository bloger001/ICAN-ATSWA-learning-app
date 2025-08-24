// assets/review.js — Review missed questions with green (correct) / red (your wrong choice)

function getUserSlim(){
  try { return JSON.parse(localStorage.getItem('ican.user') || 'null'); }
  catch { return null; }
}
const u   = getUserSlim();
const KEY = `ican.results:${(u && u.uid) || 'guest'}`;

const RESOURCE_MAP = {
  'Accounting Concepts': 'resources.html#ba-concepts',
  'Double Entry': 'resources.html#ba-double-entry',
  'Trial Balance': 'resources.html#ba-trial-balance',
  'Financial Statements': 'resources.html#ba-fin-stmts',
  'Cash Book': 'resources.html#ba-cash-book',
  'Contracts': 'resources.html#blaw-contracts',
  'Ethics & Law': 'resources.html#blaw-ethics',
  'Communication Basics': 'resources.html#cs-basics',
  'Listening & Writing': 'resources.html#cs-writing',
  'Demand & Supply': 'resources.html#econ-demand-supply',
  'National Income': 'resources.html#econ-national-income'
};

function loadAll(){
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); }
  catch { return []; }
}
function saveAll(rows){
  try { localStorage.setItem(KEY, JSON.stringify(rows)); } catch {}
}

const root = document.getElementById('mistakes');

function render(){
  const rows = loadAll();
  const mistakes = rows.filter(r => r && r.correct === false).reverse(); // newest first

  if (!mistakes.length){
    root.innerHTML = `
      <p class="muted">No mistakes to review 🎉</p>
      <div class="row" style="margin-top:10px">
        <a class="btn primary" href="index.html">Start a quiz</a>
      </div>`;
    return;
  }

  const clearBtn = `<button id="clearBtn" class="btn danger">Clear review</button>`;
  const count    = `<span class="pill mono">Total to review: ${mistakes.length}</span>`;

  let html = `
    <div class="space-between" style="align-items:center;margin-bottom:8px">
      <div>${count}</div>
      <div class="row">${clearBtn}</div>
    </div>
  `;

  html += mistakes.map(m => {
    const when = new Date(m.ts || Date.now()).toLocaleString();
    const practiceUrl = `quiz.html?level=${encodeURIComponent(m.level||'ATSWA1')}` +
                        `&subject=${encodeURIComponent(m.subject||'Basic Accounting')}` +
                        `&mode=practice` +
                        (m.topic ? `&topics=${encodeURIComponent(m.topic)}` : '');
    const readUrl = RESOURCE_MAP[m.topic] || 'resources.html';

    const opts = (m.options || []).map((txt, idx) => {
      const isCorrect = idx === m.correct_index;
      const isChosen  = idx === m.chosen_index;

      // classes to match CSS (green = good, red = bad)
      const cls = [
        'opt',
        isCorrect ? 'good' : '',
        (isChosen && !isCorrect) ? 'bad' : '',
        isChosen ? 'selected' : ''
      ].join(' ').trim();

      return `
        <div class="${cls}">
          ${txt}
          ${isCorrect ? `<span class="pill small mono" style="margin-left:8px">Correct</span>` : ``}
          ${isChosen && !isCorrect ? `<span class="pill small mono" style="margin-left:8px">Your answer</span>` : ``}
        </div>`;
    }).join('');

    return `
      <div class="card" style="margin:10px 0">
        <div class="muted small">${when} • ${m.subject || 'Subject'}${m.topic ? ' • ' + m.topic : ''}${m.subtopic ? ' • ' + m.subtopic : ''}</div>
        <h3 style="margin:6px 0">${m.stem || 'Question'}</h3>
        <div>${opts}</div>
        <div class="row" style="margin-top:10px">
          <a class="btn" href="${practiceUrl}">Practice this topic</a>
          <a class="btn primary" href="${readUrl}">Read this</a>
          <button class="btn" data-remove="${m.ts}" title="Remove this from review">Mark as learned</button>
        </div>
      </div>`;
  }).join('');

  root.innerHTML = html;

  document.getElementById('clearBtn').onclick = () => {
    const kept = rows.filter(r => r && r.correct === true); // drop mistakes only
    saveAll(kept);
    render();
  };
  root.querySelectorAll('button[data-remove]').forEach(btn => {
    btn.onclick = () => {
      const ts = Number(btn.getAttribute('data-remove'));
      const remaining = rows.filter(r => r.ts !== ts);
      saveAll(remaining);
      render();
    };
  });
}

render();