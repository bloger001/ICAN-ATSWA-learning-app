// assets/quiz.js — multi-subject with shuffle

const qs = new URLSearchParams(location.search);
const level   = qs.get('level')   || 'ATSWA1';
const subject = qs.get('subject') || 'Basic Accounting';
const mode    = qs.get('mode')    || 'practice';

const FILES = {
  'Basic Accounting'    : 'data/atswa1_basic_accounting.json',
  'Economics'           : 'data/atswa1_economics.json',
  'Business Law'        : 'data/atswa1_business_law.json',
  'Communication Skills': 'data/atswa1_comm_skills.json'
};

// DOM hooks
const meta   = document.getElementById('meta');
const qwrap  = document.getElementById('qwrap');
const qstem  = document.getElementById('qstem');
const qopts  = document.getElementById('qopts');
const nextBtn   = document.getElementById('nextBtn');
const submitBtn = document.getElementById('submitBtn');
const result    = document.getElementById('result');

meta.textContent = `Level: ${level} — Subject: ${subject} — Mode: ${mode}`;

let questions = []; 
let idx = 0; 
let selected = null; 
let score = 0;

// ----------------- shuffle helper -----------------
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ----------------- load data -----------------
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
    const data = await res.json();
    if(!Array.isArray(data) || data.length === 0) throw new Error('Empty set');
    questions = shuffle(data.slice());   // shuffle question order
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

// ----------------- render a question -----------------
function render(){
  const q = questions[idx];
  if(!q){ return finish(); }

  qstem.innerHTML = `
    <div class="pill mono">${idx+1}/${questions.length}</div>
    <h2>${q.stem}</h2>
    ${q.topic ? `<p class="muted small">${q.topic}${q.subtopic? ' • ' + q.subtopic : ''}</p>` : '' }
  `;
  qopts.innerHTML = '';

  // shuffle options
  const opts = shuffle(q.options.map((text, i)=>({text, i})));
  opts.forEach(({text,i})=>{
    const d = document.createElement('div');
    d.className = 'opt';
    d.textContent = text;
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
      <a class="btn" href="index.html">← Back Home</a>
      <a class="btn" href="quiz.html?level=${encodeURIComponent(level)}&subject=${encodeURIComponent(subject)}&mode=${encodeURIComponent(mode)}">Retry</a>
    </div>
  `;
}

// ----------------- start -----------------
loadData();