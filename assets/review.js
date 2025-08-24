// assets/review.js — shows missed questions with correct answers

function getUserKey(){
  try {
    const u = JSON.parse(localStorage.getItem('ican.user') || 'null');
    return u && u.uid ? u.uid : 'guest';
  } catch { return 'guest'; }
}
const RESULTS_KEY = `ican.results:${getUserKey()}`;

function loadResults(){
  try { return JSON.parse(localStorage.getItem(RESULTS_KEY) || '[]'); }
  catch { return []; }
}

function render(){
  const listEl = document.getElementById('list');
  const results = loadResults().filter(r => r.correct === false); // only missed
  if (!results.length){
    listEl.innerHTML = `<p class="muted">No mistakes yet. Do a practice set and come back.</p>`;
    return;
  }

  // latest first, cap at 50 to keep page light
  results.sort((a,b)=> b.ts - a.ts);
  const items = results.slice(0, 50);

  items.forEach((r, idx)=>{
    const card = document.createElement('div');
    card.className = 'card';
    card.style.margin = '10px 0';

    const when = new Date(r.ts).toLocaleString();

    // options markup with highlighting
    const opts = (r.options || []).map((text, i)=>{
      const isCorrect = (i === r.correct_index);
      const isChosen  = (i === r.chosen_index);
      let cls = 'opt';
      let badge = '';
      if (isCorrect) { cls += ' correct'; badge = '<span class="pill" style="margin-left:8px">Correct</span>'; }
      if (isChosen && !isCorrect) { cls += ' chosen'; badge = '<span class="pill" style="margin-left:8px">Your choice</span>'; }

      return `<div class="${cls}" style="pointer-events:none">${text} ${badge}</div>`;
    }).join('');

    card.innerHTML = `
      <div class="muted small">${r.subject} • ${r.topic || 'General'} • ${when}</div>
      <h3 style="margin:6px 0">${r.stem || 'Question'}</h3>
      <div>${opts}</div>
      <div class="row" style="margin-top:8px">
        <a class="btn" href="quiz.html?level=${encodeURIComponent(r.level||'ATSWA1')}&subject=${encodeURIComponent(r.subject)}&mode=practice&topics=${encodeURIComponent(r.topic||'')}">Practice this topic</a>
      </div>
    `;
    listEl.appendChild(card);
  });
}

render();
