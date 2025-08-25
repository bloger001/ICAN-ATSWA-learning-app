(function(){
  const { $, VER, requireSignInOrRedirect } = window.ICAN.util;
  const { auth, db } = window.ICAN.firebase;

  const params = new URLSearchParams(location.search);
  const level = params.get('level') || 'ATSWA1';
  const subject = params.get('subject') || 'Basic Accounting';

  const fileMap = {
    'Basic Accounting': './data/atswa1_basic_accounting.json',
    'Business Law': './data/atswa1_business_law.json',
    'Economics': './data/atswa1_economics.json',
    'Communication Skills': './data/atswa1_comm_skills.json'
  };
  const url = fileMap[subject];

  $('#quizMeta').textContent = `Level: ${level} — Subject: ${subject} — Mode: practice`;

  if (!requireSignInOrRedirect()) return;

  const state = { i:0, q:[], answers:{}, done:false };

  const pick = (n)=>Math.floor(Math.random()*n);
  function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=pick(i+1); [a[i],a[j]]=[a[j],a[i]];} return a; }

  async function load(){
    const st = $('#quizStatus');
    try{
      const res = await fetch(url+'?v='+VER);
      if(!res.ok) throw new Error(`HTTP ${res.status}`);
      const rows = await res.json();
      if(!Array.isArray(rows) || rows.length===0) throw new Error('Empty JSON');
      // normalize and shuffle questions + options
      state.q = rows.map((r,idx)=>({
        id: r.id || ('q'+(idx+1)),
        topic: r.topic || 'General',
        question: r.question,
        options: shuffle([...(r.options||[])]),
        answer: r.answer
      }));
      state.q = shuffle(state.q);
      st.textContent = '';
      $('#qWrap').style.display = 'block';
      render();
    }catch(e){
      console.error(e);
      st.innerHTML = `<div class="bad">Load error: ${e.message}<br/>Expected: ${url}</div>`;
    }
  }

  function render(){
    const qw = $('#qWrap'); const q = state.q[state.i];
    qw.innerHTML = `
      <div class="muted small">${state.i+1}/${state.q.length} • ${subject} • ${q.topic}</div>
      <h2 style="margin:10px 0 6px">${q.question}</h2>
      ${q.options.map(opt=>{
        const s = state.answers[q.id]===opt ? ' selected' : '';
        return `<button class="option${s}" data-opt="${encodeURIComponent(opt)}">${opt}</button>`;
      }).join('')}
    `;
    qw.querySelectorAll('.option').forEach(btn=>{
      btn.onclick = ()=>{
        qw.querySelectorAll('.option').forEach(b=>b.classList.remove('selected'));
        btn.classList.add('selected');
        state.answers[q.id] = decodeURIComponent(btn.dataset.opt);
      };
    });
  }

  $('#btnNext').onclick = ()=>{
    if (state.i < state.q.length-1){ state.i++; render(); }
  };

  $('#btnSubmit').onclick = doSubmit;

  function scoreIt(){
    let correct = 0, mistakes = [];
    state.q.forEach(q=>{
      const choice = state.answers[q.id];
      if (choice === q.answer) correct++;
      else mistakes.push({
        ts: Date.now(),
        subject, topic:q.topic, id:q.id,
        question:q.question, options:q.options,
        correct:q.answer, your:choice
      });
    });
    return { correct, total: state.q.length, mistakes };
  }

  async function doSubmit(){
    if (state.done) return;
    state.done = true;
    const { correct, total, mistakes } = scoreIt();

    // save locally for Status/Review
    try{
      const key = 'ican_mistakes';
      const bag = JSON.parse(localStorage.getItem(key)||'[]');
      bag.push(...mistakes);
      localStorage.setItem(key, JSON.stringify(bag));
      const aKey = 'ican_attempts';
      const aBag = JSON.parse(localStorage.getItem(aKey)||'[]');
      aBag.push({ ts:Date.now(), subject, level, correct, total });
      localStorage.setItem(aKey, JSON.stringify(aBag));
    }catch{}

    // write to leaderboard (ignore failures)
    try{
      const user = auth.currentUser;
      if (user) {
        await db.collection('leaderboard').add({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || '',
          subject, level, mode:'practice',
          score: correct, total,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      }
    }catch(e){ console.warn('leaderboard write fail', e.code||e.message); }

    // show result
    const qw = $('#qWrap');
    const pct = Math.round((correct/total)*100);
    qw.innerHTML = `
      <div class="good"><b>Result: ${pct}%</b><br/>Score: ${correct} / ${total}<br/>Subject: ${subject}</div>
      <div class="row" style="gap:8px;margin-top:10px">
        <a class="btn" href="./index.html">← Back Home</a>
        <a class="btn" href="${location.pathname+location.search}">Retry</a>
        <a class="btn" href="./status.html">View Status</a>
      </div>
    `;
  }

  load();
})();