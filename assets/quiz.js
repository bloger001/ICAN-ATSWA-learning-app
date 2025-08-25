/* /assets/quiz.js — v35 (safe replacement: loads questions, shuffles, saves leaderboard & mistakes) */
import { auth, db } from './firebase.js';
import {
  collection, addDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

/* -----------------------------
   URL params and data mapping
------------------------------*/
const params = new URLSearchParams(location.search);
const level = params.get('level') || 'ATSWA1';
const subject = decodeURIComponent(params.get('subject') || 'Basic Accounting');

const DATA_MAP = {
  ATSWA1: {
    'Basic Accounting': 'data/atswa1_basic_accounting.json',
    'Business Law': 'data/atswa1_business_law.json',
    'Economics': 'data/atswa1_economics.json',
    'Communication Skills': 'data/atswa1_comm_skills.json'
  }
};

// fallback if name variants appear
function resolveDataPath(level, subject) {
  const map = DATA_MAP[level] || {};
  // try exact
  if (map[subject]) return map[subject];
  // try loose keys
  const key = Object.keys(map).find(k => k.toLowerCase() === subject.toLowerCase());
  return key ? map[key] : null;
}

/* -----------------------------
   Small helpers
------------------------------*/
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const randInt = (n) => Math.floor(Math.random() * n);
function shuffleInPlace(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randInt(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function el(sel) { return document.querySelector(sel); }
function create(tag, attrs = {}, children = []) {
  const n = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === 'class') n.className = v;
    else if (k === 'html') n.innerHTML = v;
    else n.setAttribute(k, v);
  });
  children.forEach(c => n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c));
  return n;
}

/* -----------------------------
   Safe default UI (if none exists)
------------------------------*/
function ensureUI() {
  let root = el('#quiz-root');
  if (!root) {
    root = create('div', { id: 'quiz-root', class: 'wrap' });
    document.body.appendChild(root);
  }
  if (!root.dataset.built) {
    root.innerHTML = `
      <header class="space-between" style="align-items:center;margin:10px 0 16px">
        <h1 id="quizTitle">Quiz</h1>
        <a class="btn" href="index.html">← Home</a>
      </header>
      <section class="card" id="quizCard">
        <div id="progress" class="muted small">Loading…</div>
        <h2 id="questionText" style="margin:10px 0 8px"></h2>
        <div id="options" class="col"></div>
        <div class="row" style="margin-top:12px;gap:8px">
          <button id="nextBtn" class="btn">Next</button>
        </div>
      </section>
      <section class="card" id="resultCard" style="display:none">
        <h2>Result</h2>
        <p id="resultSummary" class="muted"></p>
        <div class="row" style="gap:8px;margin-top:10px">
          <a class="btn" href="review.html?v=35">Review Mistakes</a>
          <a class="btn ghost" href="status.html?v=35">View Status</a>
        </div>
      </section>
    `;
    root.dataset.built = '1';
  }
  return {
    title: el('#quizTitle'),
    progress: el('#progress'),
    qText: el('#questionText'),
    options: el('#options'),
    nextBtn: el('#nextBtn'),
    quizCard: el('#quizCard'),
    resultCard: el('#resultCard'),
    resultSummary: el('#resultSummary')
  };
}

/* -----------------------------
   Leaderboard: save a row
------------------------------*/
async function saveScoreToLeaderboard({ subject, level, total, correct, durationMs }) {
  const user = auth.currentUser;
  if (!user) return; // quiz page is gated by app.js, but keep guard
  try {
    await addDoc(collection(db, "leaderboard"), {
      uid: user.uid,
      name: user.displayName || user.email || "Anonymous",
      subject,
      level,
      total,
      correct,
      percent: Math.round((correct / Math.max(1,total)) * 100),
      durationMs: durationMs ?? null,
      createdAt: serverTimestamp()
    });
  } catch (e) {
    console.warn("Leaderboard write failed:", e);
  }
}

/* -----------------------------
   Mistakes & status storage
------------------------------*/
function getUserKeyPrefix() {
  const user = auth.currentUser;
  const uid = user?.uid || 'guest';
  return `ican.${uid}`;
}

function saveMistakes(subject, mistakes) {
  // mistakes: [{id, question, options, correctAnswer, userAnswer, topic}]
  const key = `${getUserKeyPrefix()}.mistakes.${subject}`;
  localStorage.setItem(key, JSON.stringify(mistakes.slice(0, 300))); // cap
}

function addSessionToHistory(subject, stats) {
  // stats: {total, correct, percent, ts, weakTopics: {topic: missCount}}
  const key = `${getUserKeyPrefix()}.history.${subject}`;
  const arr = JSON.parse(localStorage.getItem(key) || '[]');
  arr.unshift(stats);
  localStorage.setItem(key, JSON.stringify(arr.slice(0, 100))); // cap
}

/* -----------------------------
   Main quiz flow
------------------------------*/
let ui;
let QUESTIONS = [];
let order = [];
let current = 0;
let score = 0;
let startTimeMs = Date.now();
let mistakes = [];

function renderQuestion() {
  const q = QUESTIONS[order[current]];
  // Title/progress
  ui.title.textContent = `${subject} — ${level}`;
  ui.progress.textContent = `Question ${current + 1} of ${QUESTIONS.length}`;

  // Stem
  ui.qText.textContent = q.question;

  // Options (shuffle copy)
  const opts = q.options.map((text, i) => ({ text, i }));
  shuffleInPlace(opts);

  ui.options.innerHTML = '';
  opts.forEach(({ text, i }) => {
    const btn = create('button', { class: 'btn ghost', type: 'button' }, [text]);
    btn.addEventListener('click', () => {
      // disable all
      [...ui.options.querySelectorAll('button')].forEach(b => b.disabled = true);
      const correctText = q.answer;
      const chosenText = text;

      // mark colors
      [...ui.options.children].forEach(b => {
        const t = b.textContent;
        if (t === correctText) b.style.background = '#14532d'; // green
        if (t === chosenText && t !== correctText) b.style.background = '#5a1a1a'; // red
      });

      // score/mistakes
      if (chosenText === correctText) {
        score++;
      } else {
        mistakes.push({
          id: q.id ?? order[current] + 1,
          question: q.question,
          options: q.options,
          correctAnswer: correctText,
          userAnswer: chosenText,
          topic: q.topic || 'General'
        });
      }
    });
    ui.options.appendChild(btn);
  });
}

async function finishQuiz() {
  const total = QUESTIONS.length;
  const percent = Math.round((score / Math.max(1, total)) * 100);
  const durationMs = Date.now() - startTimeMs;

  // save mistakes locally (for review page)
  saveMistakes(subject, mistakes);

  // build weak topics summary
  const weak = {};
  mistakes.forEach(m => {
    const t = (m.topic || 'General').split('•')[0].trim();
    weak[t] = (weak[t] || 0) + 1;
  });

  // add to history (for status page)
  addSessionToHistory(subject, {
    total, correct: score, percent,
    ts: Date.now(),
    weakTopics: weak
  });

  // Leaderboard write
  await saveScoreToLeaderboard({ subject, level, total, correct: score, durationMs });

  // show result
  ui.quizCard.style.display = 'none';
  ui.resultCard.style.display = '';
  ui.resultSummary.textContent = `You scored ${score} / ${total} (${percent}%).`;
}

async function nextOrFinish() {
  // if no option was clicked, gently nudge
  const disabledCount = [...ui.options.querySelectorAll('button')].filter(b => b.disabled).length;
  if (disabledCount === 0) {
    ui.nextBtn.classList.add('shake');
    await sleep(120);
    ui.nextBtn.classList.remove('shake');
    return;
  }
  current++;
  if (current >= QUESTIONS.length) {
    await finishQuiz();
  } else {
    renderQuestion();
  }
}

/* -----------------------------
   Load questions
------------------------------*/
async function loadQuestions() {
  const path = resolveDataPath(level, subject);
  if (!path) throw new Error(`No data path for ${level} / ${subject}`);

  const url = `${path}?v=35`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load: ${url}`);
  const data = await res.json();
  if (!Array.isArray(data)) throw new Error('Data is not an array');

  // normalize & basic checks
  const normalized = data.map((q, idx) => ({
    id: q.id ?? (idx + 1),
    question: String(q.question || '').trim(),
    options: Array.isArray(q.options) ? q.options.map(String) : [],
    answer: String(q.answer || '').trim(),
    topic: String(q.topic || 'General')
  })).filter(q =>
    q.question && q.options.length === 4 && q.options.includes(q.answer)
  );

  return normalized;
}

/* -----------------------------
   Init
------------------------------*/
async function init() {
  ui = ensureUI();

  try {
    QUESTIONS = await loadQuestions();

    // Shuffle questions and also shuffle options per question (for fairness)
    order = [...Array(QUESTIONS.length).keys()];
    shuffleInPlace(order);

    // first render
    current = 0;
    score = 0;
    mistakes = [];
    startTimeMs = Date.now();
    renderQuestion();

    ui.nextBtn.onclick = () => nextOrFinish();
  } catch (e) {
    console.error(e);
    if (ui.progress) ui.progress.textContent = `Load error: ${e.message}`;
    if (ui.qText) ui.qText.textContent = '';
    if (ui.options) ui.options.innerHTML = '';
  }
}

init();