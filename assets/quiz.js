(function(){
  const msg = document.querySelector('[data-quiz-msg]') || document.querySelector('.card');
  const host = document.querySelector('[data-quiz-host]') || document.body;
  const btnNext = document.getElementById('btnNext');
  const btnBack = document.getElementById('btnBack');
  const btnSubmit = document.getElementById('btnSubmit');

  // ---- helpers ----
  function getUserSlim(){
    try{
      const u = (window.AppAuth && window.AppAuth.currentUser) || null;
      if (!u) return null;
      return { uid: u.uid, email: u.email || "", name: u.displayName || "" };
    }catch{ return null; }
  }
  function localKey(){
    const u = getUserSlim();
    return `ican.results:${(u && u.uid) || 'guest'}`;
  }
  function saveAttempt(row){
    try{
      const KEY = localKey();
      const rows = JSON.parse(localStorage.getItem(KEY) || "[]");
      rows.unshift(row);
      if (rows.length > 50) rows.length = 50;
      localStorage.setItem(KEY, JSON.stringify(rows));
    }catch{}
  }
  function shuffle(arr){
    for (let i=arr.length-1;i>0;i--){
      const j = Math.floor(Math.random()*(i+1));
      [arr[i],arr[j]]=[arr[j],arr[i]];
    }
    return arr;
  }

  // ---- load data ----
  const url = new URL(location.href);
  const level   = url.searchParams.get('level') || 'atswa1';
  const subject = url.searchParams.get('subject') || 'basic_accounting';
  const dataPath = `./data/${level}_${subject}.json`;

  let QUESTIONS = [];
  let PAGE = 0;
  const ANSWERS = new Map(); // idx -> chosen_index

  function renderCurrent(){
    if (!QUESTIONS.length){ return; }
    const q = QUESTIONS[PAGE];
    const choices = q.options.map((o, idx) => {
      const chosen = ANSWERS.get(PAGE) === idx ? ' style="outline:2px solid #2e7cf0;border-radius:8px;padding:6px"' : '';
      return `<div class="row" data-idx="${idx}"${chosen}>${o}</div>`;
    }).join("");

    host.innerHTML = `
      <section class="card">
        <div class="muted small">${level.toUpperCase()} • ${subject.replace('_',' ')}</div>
        <h2 style="margin:.35rem 0">${PAGE+1}. ${q.stem || q.question}</h2>
        <div id="choices">${choices}</div>
      </section>
    `;

    document.querySelectorAll('#choices .row').forEach(el=>{
      el.addEventListener('click', ()=>{
        const idx = Number(el.getAttribute('data-idx'));
        ANSWERS.set(PAGE, idx);
        renderCurrent();
      });
    });

    btnBack.disabled = (PAGE===0);
    btnNext.disabled = (PAGE===QUESTIONS.length-1);
  }

  async function start(){
    try{
      const res = await fetch(dataPath, {cache:'no-store'});
      const raw = await res.json();

      // normalize & dedupe by id+stem
      const seen = new Set();
      QUESTIONS = raw.filter(item=>{
        const id = (item.id || item.qid || '') + '|' + (item.stem || item.question || '');
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      }).map(x=>({
        id: x.id || x.qid || '',
        topic: x.topic || '',
        subtopic: x.subtopic || '',
        stem: x.stem || x.question || '',
        options: x.options || x.choices || [],
        answer_index: (typeof x.answer_index==='number') ? x.answer_index :
                      (typeof x.correctIndex==='number') ? x.correctIndex : 0
      }));

      shuffle(QUESTIONS);               // shuffle
      QUESTIONS = QUESTIONS.slice(0,40); // cap (optional)

      msg && (msg.textContent = "");    // clear "Loading…"
      renderCurrent();
    }catch(e){
      console.error(e);
      msg && (msg.textContent = "Failed to load questions.");
    }
  }

  btnNext?.addEventListener('click', ()=>{ if (PAGE<QUESTIONS.length-1){ PAGE++; renderCurrent(); }});
  btnBack?.addEventListener('click', ()=>{ if (PAGE>0){ PAGE--; renderCurrent(); }});
  btnSubmit?.addEventListener('click', submit);

  async function submit(){
    if (!QUESTIONS.length) return;

    let correct = 0;
    const mistakes = [];
    QUESTIONS.forEach((q, idx)=>{
      const chosen = ANSWERS.get(idx);
      if (chosen === q.answer_index) correct++;
      else {
        mistakes.push({
          topic: q.topic, subtopic: q.subtopic,
          stem: q.stem, options: q.options,
          answer_index: q.answer_index, chosen_index: (typeof chosen==='number'?chosen:-1)
        });
      }
    });
    const total = QUESTIONS.length;
    const pct = Math.round((correct*100)/total);
    const attempt = {
      ts: new Date().toISOString(),
      level, subject, correct, total, pct,
      mistakes
    };
    saveAttempt(attempt);

    // Try to send to Firestore for leaderboard
    try{
      if (window.__fbReady) await window.__fbReady;
      const db = window.AppDB || window.firebaseDB;
      const auth = window.AppAuth || window.firebaseAuth;
      const u = auth && auth.currentUser;
      if (db && u){
        await db.collection('leaderboard').add({
          uid: u.uid,
          user: { email: u.email || "", name: u.displayName || "" },
          level, subject, correct, total, pct,
          ts: window.firebase?.firestore?.FieldValue?.serverTimestamp?.() || new Date()
        });
      }
    }catch(e){ console.warn("Could not post to leaderboard:", e); }

    // results banner
    host.innerHTML = `
      <section class="card">
        <h2>Result</h2>
        <p><strong>${pct}%</strong> (${correct}/${total})</p>
        <div style="margin-top:10px">
          <a class="btn" href="./index.html">← Home</a>
          <a class="btn" href="./status.html" style="margin-left:6px">Status</a>
          <a class="btn primary" href="./review.html" style="margin-left:6px">Review mistakes</a>
        </div>
      </section>
    `;
  }

  document.addEventListener('DOMContentLoaded', start);
})();