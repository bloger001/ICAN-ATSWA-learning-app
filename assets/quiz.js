// --- read params ---
const qs = new URLSearchParams(location.search);
const level   = qs.get('level')   || 'ATSWA1';
const subject = qs.get('subject') || 'Basic Accounting';
const mode    = qs.get('mode')    || 'practice';

// --- map subjects to files (edit paths here if needed) ---
const FILES = {
  'Basic Accounting'    : 'data/atswa1_basic_accounting.json',
  'Economics'           : 'data/atswa1_economics.json',
  'Business Law'        : 'data/atswa1_business_law.json',
  'Communication Skills': 'data/atswa1_comm_skills.json'
};

// --- UI elements ---
const meta   = document.getElementById('meta');
const qwrap  = document.getElementById('qwrap');
const qstem  = document.getElementById('qstem');
const qopts  = document.getElementById('qopts');
const nextBtn   = document.getElementById('nextBtn');
const submitBtn = document.getElementById('submitBtn');
const result    = document.getElementById('result');

// show header meta
meta.textContent = `Level: ${level} — Subject: ${subject} — Mode: ${mode}`;

// --- state ---
let questions = [];
let idx = 0, selected = null, score = 0;

// --- load questions for subject ---
async function loadData(){
  const file = FILES[subject];
  if(!file){
    qstem.innerHTML = `<p class="muted">Subject not recognized. Choose a subject from the home page.</p>`;
    qwrap.querySelector('.row').style.display = 'none';
    return;
  }
  try{
    const res = await fetch(file, {cache: 'no-store'});
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    questions = await res.json();
    if(!Array.isArray(questions) || questions.length === 0) throw new Error('Empty set');
    render();
  }catch(err){
    qstem.innerHTML = `
      <div class="card muted">
        Error loading questions for <b>${subject}</b>.<br>
        <span class="small">Missing file? Expected: <code>${file}</code></span>
      </div>`;
  }
}

// --- render one question ---
function render(){
  const q = questions[idx];
  if(!q){ finish(); return; }

  qstem.innerHTML = `
    <div class="pill mono">${idx+1}/${questions.length}</div>
    <h2>${q.stem}</h2>
    ${q.topic ? `<p class="muted small">${q.topic}${q.subtopic? ' • ' + q.subtopic : ''}</p>` : '' }
  `;

  qopts.innerHTML = '';
  q.options.forEach((opt,i)=>{
    const d = document.createElement('div');
    d.className = 'opt';
    d.textContent = opt;
    d.onclick = ()=> select(i, d);
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
  if(selected == null) return alert('Select an option first');
  if(selected === questions[idx].answer_index) score++;
  idx++;
  if(idx < questions.length) render(); else finish();
};

submitBtn.onclick = finish;

function finish(){
  qwrap.style.display = 'none';
  const pct = Math.round((score/questions.length)*100);
  result.style.display = '';
  result.innerHTML = `
    <h2>Result: ${pct}%</h2>
    <p>Score: ${score} / ${questions.length}</p>
    <div class="muted small">Subject: ${subject}</div>
    <div class="row" style="margin-top:10px">
      <a class="btn" href="./">← Back Home</a>
      <a class="btn" href="quiz.html?level=${encodeURIComponent(level)}&subject=${encodeURIComponent(subject)}&mode=${encodeURIComponent(mode)}">Retry</a>
    </div>
  `;
}

// go!
loadData();