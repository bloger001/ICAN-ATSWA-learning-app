// Global app code (auth gate + SW registration + shared helpers)
(function(){
  const VER = '2025-08-26a';
  const $ = (q,el=document)=>el.querySelector(q);
  const $$ = (q,el=document)=>[...el.querySelectorAll(q)];
  const qs = new URLSearchParams(location.search);

  // Service worker (safe)
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./assets/sw.js?v='+VER).catch(()=>{});
    navigator.serviceWorker.addEventListener('controllerchange', ()=>location.reload());
  }

  function gateTiles(user){
    $$('.lockable').forEach(t=>{
      if (user) t.removeAttribute('data-locked');
      else t.setAttribute('data-locked','');
    });
    const signStatus = $('#signStatus');
    if (signStatus) signStatus.textContent = user ? 'Signed in' : 'Not signed in';
    const inBtn = $('#googleSignIn'), outBtn = $('#googleSignOut');
    if (inBtn) inBtn.style.display = user ? 'none' : 'inline-flex';
    if (outBtn) outBtn.style.display = user ? 'inline-flex' : 'none';
  }

  function wireAuthUI(){
    const inBtn = $('#googleSignIn');
    const outBtn = $('#googleSignOut');
    if (!window.ICAN || !window.ICAN.firebase) return;
    const { auth, signIn, signOut } = window.ICAN.firebase;
    if (inBtn) inBtn.onclick = ()=>signIn().catch(e=>alert(e.message||e));
    if (outBtn) outBtn.onclick = ()=>signOut().catch(()=>{});
    window.ICAN.firebase.auth.onAuthStateChanged(user=>gateTiles(user));
  }

  // Wait for firebase then wire UI
  if (window.ICAN && window.ICAN.firebase) wireAuthUI();
  else document.addEventListener('ican:firebaseReady', wireAuthUI);

  // Expose small helpers
  window.ICAN = window.ICAN || {};
  window.ICAN.util = {
    $, $$, VER,
    requireSignInOrRedirect(){
      const f = window.ICAN && window.ICAN.firebase;
      const user = f && f.auth.currentUser;
      if (!user) location.href = './index.html?needLogin=1';
      return !!user;
    }
  };
})();