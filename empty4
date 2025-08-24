const qs = new URLSearchParams(location.search);
const level = qs.get('level')||'ATSWA1';
const subject = qs.get('subject')||'Basic Accounting';
const mode = qs.get('mode')||'practice';

document.getElementById('title').textContent = `${subject} — ${mode.toUpperCase()}`;
document.getElementById('meta').textContent = `Level: ${level}`;

const TIMER_SECONDS = mode === 'exam' ? 600 : 0; // 10 min demo
let questions = [];
let idx = 0, selected = null, score = 0;

const qstem = document.getElementById('qstem');
const qopts = document.getElementById('qopts');
const nextBtn = document.getElementById('nextBtn');
const submitBtn = document.getElementById('submitBtn');
const result = document.getElementById('result');
const qwrap = document.getElementById('qwrap');
const timerEl = document.getElementById('timer');

function fmtTime(s){const m=Math.floor(s/60),r=s%60;return `${String(m).padStart(2,'0')}:${String(r).padStart(2,'0')}`}

let t = TIMER_SECONDS; let tickId = null;
function startTimer(){
  if (!t) { timerEl.textContent = '—'; return; }
  timerEl.textContent = fmtTime(t);
  tickId = setInterval(()=>{ t--; timerEl.textContent = fmtTime(t); if (t<=0){ clearInterval(tickId); finish(); } },1000);
}

async function loadData(){
  const res = await fetch('data/atswa1_basic_accounting.sample.json');
  questions = await res.json();
  render(); startTimer();
}

function render(){
  const q = questions[idx]; if (!q){ finish(); return; }
  qstem.innerHTML = `<div class="pill mono">${idx+1}/${questions.length}</div><h2>${q.stem}</h2>`;
  qopts.innerHTML = '';
  q.options.forEach((opt,i)=>{
    const d = document.createElement('div');
    d.className='opt';
    d.textContent = opt;
    d.onclick=()=>select(i,d);
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
  if (selected==null) return alert('Select an option');
  const q = questions[idx];
  if (selected === q.answer_index) score++;
  idx++;
  if (idx < questions.length) render(); else finish();
};
submitBtn.onclick = finish;

function finish(){
  qwrap.style.display='none';
  clearInterval(tickId);
  const pct = Math.round((score/questions.length)*100);
  const passmark = 60;
  result.style.display='';
  result.innerHTML = `
    <h2>Result: ${pct}% ${pct>=passmark? '✅ Pass':'❌ Fail'}</h2>
    <p>Score: ${score} / ${questions.length}</p>
    <h3>What to focus on next</h3>
    <ul>
      <li>If you missed <strong>Trial Balance / Errors</strong>, try the remedial pack next.</li>
    </ul>
    <a class="btn" href="./">Back Home</a>
  `;
  // TODO: Save attempts to Firestore in a later step
}

loadData().catch(()=>alert('Could not load questions'));
