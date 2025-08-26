// quiz.js — loads JSON, runs quiz, saves mistakes + leaderboard

const SUBJECT_FILES = {
  "basic_accounting": "./data/atswa1_basic_accounting.json",
  "business_law": "./data/atswa1_business_law.json",
  "economics": "./data/atswa1_economics.json",
  "comm_skills": "./data/atswa1_comm_skills.json"
};

function shuffle(a){ for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; }

const quizMeta = document.getElementById("quizMeta");
const quizBody = document.getElementById("quizBody");

let questions = [];
let idx = 0;
let answers = {}; // idx -> choice index

function renderQuestion() {
  if (!questions.length) return;
  const q = questions[idx];

  quizMeta.textContent = `${idx+1}/${questions.length} • ${q.topic || ""}`;
  const opts = q.options.map((o,i)=>`
    <label class="opt">
      <input type="radio" name="opt" value="${i}" ${answers[idx]===i?"checked":""}/>
      <span>${o}</span>
    </label>`).join("");

  quizBody.innerHTML = `
    <h2 style="margin:0 0 8px 0">${q.question}</h2>
    <div>${opts}</div>
  `;

  quizBody.querySelectorAll('input[name="opt"]').forEach(r=>{
    r.addEventListener('change', ()=>{ answers[idx]=Number(r.value); });
  });
}

function showResult() {
  let correct = 0;
  const mistakes = [];
  questions.forEach((q,i)=>{
    const chosen = answers[i];
    const ok = chosen === q.answer;
    if (ok) correct++; else mistakes.push({
      at: Date.now(), subject: qp.subject, topic: q.topic || "",
      question: q.question, options: q.options, correct: q.answer, chosen
    });
  });

  const pct = Math.round((correct / questions.length) * 100);
  quizBody.innerHTML = `
    <div class="card">
      <h2>Result: ${pct}%</h2>
      <p class="muted">Score: ${correct} / ${questions.length} • Subject: ${qp.subject.replace("_"," ")}</p>
      <div style="margin-top:12px">
        <a class="btn" href="./index.html">← Back Home</a>
        <a class="btn" href="./status.html">View Status</a>
      </div>
    </div>
  `;

  // Save mistakes locally
  const key = `mistakes_${qp.subject}`;
  const prev = JSON.parse(localStorage.getItem(key) || "[]");
  localStorage.setItem(key, JSON.stringify(prev.concat(mistakes)));

  // Save leaderboard (best-effort)
  if (currentUser) {
    const db = window.firebaseDB;
    db.collection("leaderboard").add({
      ts: firebase.firestore.FieldValue.serverTimestamp(),
      level: qp.level || "atswa1",
      subject: qp.subject,
      total: questions.length,
      correct, pct,
      user: { uid: currentUser.uid, email: currentUser.email, name: currentUser.displayName || "" }
    }).catch(e=>console.warn("Leaderboard save failed:", e.message));
  }
}

async function boot() {
  // Gate
  if (!window.requireAuth()) { 
    document.getElementById("quizCard").classList.add("card");
    quizBody.innerHTML = `<div class="card"><h3>Sign-in required</h3><p>Please sign in on the home page to unlock quizzes.</p></div>`;
    return;
  }

  const file = SUBJECT_FILES[qp.subject];
  if (!file) {
    quizBody.textContent = "Unknown subject file.";
    return;
  }

  quizMeta.textContent = `Loading ${qp.subject.replace("_"," ")}…`;
  try {
    const res = await fetch(file, { cache: "no-store" });
    const raw = await res.json();
    // Accept either {id, question, options, answer, topic}[] OR {question,...}[]
    questions = raw.map((r,i)=>({
      id: r.id ?? (i+1),
      question: r.question,
      options: shuffle([...r.options]),
      answer: r.answer, // index will still match the option after shuffle? -> fix below
      topic: r.topic || ""
    }));
    // Fix answer index after shuffling options
    questions = questions.map(q=>{
      const correctText = raw.find(r=>r.question===q.question).options[raw.find(r=>r.question===q.question).answer];
      q.answer = q.options.findIndex(o=>o===correctText);
      return q;
    });

    shuffle(questions);
    renderQuestion();
  } catch (e) {
    quizBody.innerHTML = `<div class="card error">Load error: ${e.message}</div>`;
  }

  document.getElementById("btnPrev").onclick = ()=>{ if(idx>0){idx--; renderQuestion();} };
  document.getElementById("btnNext").onclick = ()=>{ if(idx<questions.length-1){idx++; renderQuestion();} };
  document.getElementById("btnSubmit").onclick = ()=> showResult();
}

document.addEventListener("DOMContentLoaded", ()=> firebaseReady.then(boot));