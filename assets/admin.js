(function(){
  const $ = (q,el=document)=>el.querySelector(q);
  const REQUIRED = [
    './assets/app.js','./assets/firebase.js','./assets/app.css',
    './data/atswa1_basic_accounting.json',
    './data/atswa1_business_law.json',
    './data/atswa1_economics.json',
    './data/atswa1_comm_skills.json',
    './leaderboard.html','./quiz.html','./status.html','./review.html'
  ];
  const ADMIN_EMAIL = 'offixcialbloger@gmail.com';
  const ACCESS_CODE = 'FT24ACC245';

  const { auth, signIn, signOut, db } = window.ICAN.firebase;

  const code = $('#adminCode');
  const stateEl = $('#adminState');
  const diagCard = $('#diagCard');

  function setState(msg){ stateEl.textContent = msg; }

  $('#btnAdminSignIn').onclick = ()=>signIn().catch(e=>alert(e.message||e));
  $('#btnAdminSignOut').onclick = ()=>signOut().catch(()=>{});

  $('#btnVerify').onclick = ()=>{
    const ok = code.value.trim()===ACCESS_CODE;
    if (!ok) { alert('Wrong code'); return; }
    diagCard.style.display = 'block';
  };

  auth.onAuthStateChanged(user=>{
    const isAdmin = !!user && user.email===ADMIN_EMAIL;
    setState(user ? `Signed in — ${user.email}` : 'Not signed in');
    $('#btnAdminSignOut').style.display = user ? 'inline-flex' : 'none';
    $('#btnAdminSignIn').style.display = user ? 'none' : 'inline-flex';
    if (!isAdmin) diagCard.style.display = 'none';
  });

  async function headOk(u){
    try{ const r = await fetch(u,{method:'GET',cache:'no-store'}); return r.ok; }
    catch{ return false; }
  }

  $('#btnRunHealth').onclick = async ()=>{
    const out = [];
    const ok = (x)=>`✅ ${x}`;
    const bad = (x)=>`⚠️ ${x}`;
    out.push(ok('firebaseConfig present'));

    // files
    for (const u of REQUIRED){
      out.push( (await headOk(u)) ? ok(`200 ${u}`) : bad(`missing ${u}`) );
    }

    // firestore read test
    try{
      await db.collection('leaderboard').limit(1).get();
      out.push(ok('Firestore read ok'));
    }catch(e){
      out.push(bad(`Firestore read failed (rules or network): ${e.code||e.message}`));
    }

    // cache info
    out.push(ok('Diagnostics complete'));
    $('#diagLog').textContent = out.join('\n');

    // show local error log
    $('#localLog').textContent = localStorage.getItem('ican_last_error') || '(empty)';
  };

  $('#btnClearLocal').onclick = ()=>{
    localStorage.removeItem('ican_last_error');
    $('#localLog').textContent = '(empty)';
  };

  $('#btnForceUpdate').onclick = async ()=>{
    if ('serviceWorker' in navigator){
      const r = await navigator.serviceWorker.getRegistration();
      if (r) { await r.update(); alert('Update requested. Page will reload if new SW activates.'); }
      else { alert('No service worker registration found.'); }
    } else alert('Service worker not supported.');
  };
})();