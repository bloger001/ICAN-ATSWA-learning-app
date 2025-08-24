const qs = new URLSearchParams(location.search);
const level = qs.get('level')||'ATSWA1';
const subject = qs.get('subject')||'Basic Accounting';
const mode = qs.get('mode')||'practice';

document.getElementById('meta').textContent = `Level: ${level} — Subject: ${subject} — Mode: ${mode}`;

let questions = [];
let idx = 0, selected = null, score = 0;

const qstem = document.getElementById('qstem');
const qopts = document.getElementById('qopts');
const nextBtn = document.getElementById('nextBtn');
const submitBtn = document.getElementById('submitBtn');
const result = document.getElementById('result');
const qwrap = document.getElementById('qwrap');

async function loadData(){
  try {
    const res = await fetch('data/atswa1_basic_accounting.sample.json');
    questions = await res.json();
    render();
  } catch(e){
    qstem.innerHTML = "<p class='muted'>Error loading questions. Check data file path.</p>";
  }
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
  const pct = Math.round((score/questions.length)*100);
  result.style.display='';
  result.innerHTML = `
    <h2>Result: ${pct}%</h2>
    <p>Score: ${score} / ${questions.length}</p>
    <a class="btn" href="./">Back Home</a>
  `;
}

loadData();
