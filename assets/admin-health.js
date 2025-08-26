// --- CONFIG ---
const ADMIN_EMAIL = 'offixcialbloger@gmail.com';
const APP_VERSION = '1.0.3'; // bump this anytime you deploy
const REQUIRED_KEYS = [
  'aiHub.health',         // health snapshot object
  'quiz.localResults',    // array
  'quiz.mistakes',        // array
  'user.slim',            // object
  'app.version'           // string (cached version)
];

// --- HELPERS ---
const $ = (sel) => document.querySelector(sel);
const resultsEl = $('#results');
const rawEl = $('#rawSnapshot');
const overallBox = $('#overall');
const overallText = $('#overallText');
const overallSub = $('#overallSub');
const adminUser = $('#adminUser');
const guard = $('#adminGuard');
const btnRun = $('#btnRunChecks');
const btnExport = $('#btnExportJSON');
const btnClear = $('#btnClearCache');

function badge(ok, warn=false){
  if(warn) return `<span class="badge warn">WARN</span>`;
  return ok ? `<span class="badge good">OK</span>` : `<span class="badge bad">ISSUE</span>`;
}

function row({name, ok, detail, updated, warn=false}){
  const html = `
    <div class="row">
      <div>${name}</div>
      <div>${badge(ok, warn)}</div>
      <div>${detail || ''}</div>
      <div class="muted">${new Date(updated).toLocaleString()}</div>
    </div>
  `;
  resultsEl.insertAdjacentHTML('beforeend', html);
}

function setOverall(state, text, sub=''){
  overallBox.classList.remove('good','bad','warn');
  overallBox.classList.add(state); // 'good' | 'bad' | 'warn'
  overallText.textContent = text;
  overallSub.textContent = sub;
}

function getLocalJSON(key, fallback){
  try{
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  }catch(e){ return fallback; }
}

function bytesUsed(){
  // rough localStorage size calc
  let total = 0;
  for(let i=0;i<localStorage.length;i++){
    const k = localStorage.key(i);
    const v = localStorage.getItem(k) || '';
    total += k.length + v.length;
  }
  return total;
}

function kb(n){ return `${(n/1024).toFixed(1)} KB`; }

// --- CORE HEALTH CHECK ---
async function runChecks(firebaseReady){
  resultsEl.innerHTML = '';

  // Compose snapshot
  const snapshot = {
    ts: Date.now(),
    app: {
      versionExpected: APP_VERSION,
      versionCached: localStorage.getItem('app.version') || null,
      cdnLoaded: {
        app: !!window.firebase?.app,
        auth: !!window.firebase?.auth,
        firestore: !!window.firebase?.firestore,
      }
    },
    auth: {
      signedIn: !!firebase.auth().currentUser,
      email: firebase.auth().currentUser?.email || null,
      isAdmin: firebase.auth().currentUser?.email === ADMIN_EMAIL
    },
    storage: {
      keysPresent: REQUIRED_KEYS.map(k => [k, !!localStorage.getItem(k)]),
      bytes: bytesUsed()
    },
    quiz: {
      localResultsCount: (getLocalJSON('quiz.localResults', []) || []).length,
      mistakesCount: (getLocalJSON('quiz.mistakes', []) || []).length,
    },
    lastError: getLocalJSON('app.lastError', null), // set this in your global error handler
  };

  // --- Checks ---
  // 1) Firebase ready
  const c1 = snapshot.app.cdnLoaded.app && snapshot.app.cdnLoaded.auth && snapshot.app.cdnLoaded.firestore;
  row({
    name: 'Firebase SDKs Loaded',
    ok: c1,
    detail: c1 ? 'Compat SDKs present' : 'One or more Firebase compat SDKs missing or misordered',
    updated: snapshot.ts
  });

  // 2) Auth status
  const c2 = snapshot.auth.signedIn;
  row({
    name: 'Authentication',
    ok: c2,
    detail: c2 ? `Signed in as ${snapshot.auth.email}` : 'No user signed in',
    updated: snapshot.ts
  });

  // 3) Admin gate
  const c3 = snapshot.auth.isAdmin;
  row({
    name: 'Admin Privilege',
    ok: c3,
    detail: c3 ? 'Admin features unlocked' : `User is not admin (${snapshot.auth.email || 'unknown'})`,
    updated: snapshot.ts,
    warn: c2 && !c3 // warn if signed in but not admin
  });

  // 4) Version match
  const c4 = (snapshot.app.versionCached === APP_VERSION);
  row({
    name: 'App Version',
    ok: c4,
    detail: c4 ? `v${APP_VERSION}` : `Mismatch: cached=${snapshot.app.versionCached || 'none'} expected=${APP_VERSION}. Hard refresh recommended.`,
    updated: snapshot.ts,
    warn: !c4
  });

  // 5) Required keys present
  const missing = snapshot.storage.keysPresent.filter(([,present])=>!present).map(([k])=>k);
  const c5 = missing.length === 0;
  row({
    name: 'LocalStorage Keys',
    ok: c5,
    detail: c5 ? 'All required keys present' : `Missing: ${missing.join(', ')}`,
    updated: snapshot.ts,
    warn: !c5
  });

  // 6) LocalStorage usage
  const limitSoft = 4 * 1024 * 1024; // 4MB typical soft limit
  const warnThreshold = 0.8 * limitSoft;
  const c6 = snapshot.storage.bytes < warnThreshold;
  row({
    name: 'LocalStorage Usage',
    ok: c6,
    detail: `${kb(snapshot.storage.bytes)} used (soft cap ~${(limitSoft/1024/1024).toFixed(1)} MB)`,
    updated: snapshot.ts,
    warn: snapshot.storage.bytes >= warnThreshold
  });

  // 7) Quiz bank integrity (basic)
  const results = getLocalJSON('quiz.localResults', []);
  const mistakes = getLocalJSON('quiz.mistakes', []);
  const c7 = Array.isArray(results) && Array.isArray(mistakes);
  row({
    name: 'Quiz Data Structures',
    ok: c7,
    detail: c7 ? `results=${results.length}, mistakes=${mistakes.length}` : 'Non-array structures detected.',
    updated: snapshot.ts
  });

  // 8) Firestore write test (admin only) — dry run marker
  let c8 = false, c8Detail = 'Skipped (not admin or no auth)';
  if (snapshot.auth.isAdmin) {
    try {
      const db = firebase.firestore();
      await db.collection('diagnostics').doc('health_probe').set({
        ts: firebase.firestore.FieldValue.serverTimestamp(),
        by: snapshot.auth.email,
        appVersion: APP_VERSION
      }, { merge: true });
      c8 = true; c8Detail = 'Probe write OK (collection: diagnostics/health_probe)';
    } catch (e) {
      c8 = false; c8Detail = 'Write failed: ' + (e?.message || e);
    }
  }
  row({
    name: 'Firestore Write Probe',
    ok: c8,
    detail: c8Detail,
    updated: snapshot.ts,
    warn: !c8 && snapshot.auth.isAdmin
  });

  // 9) Last error presence
  const hasErr = !!snapshot.lastError;
  row({
    name: 'Last Runtime Error',
    ok: !hasErr,
    detail: hasErr ? JSON.stringify(snapshot.lastError).slice(0, 300) : 'No recent errors recorded',
    updated: snapshot.ts,
    warn: hasErr
  });

  // Overall state
  const anyBad = [...document.querySelectorAll('.badge.bad')].length > 0;
  const anyWarn = [...document.querySelectorAll('.badge.warn')].length > 0;
  if (anyBad) setOverall('bad', 'Issues Found', 'Resolve the red items below.');
  else if (anyWarn) setOverall('warn', 'Warnings Present', 'Things work, but some items need attention.');
  else setOverall('good', 'All Good', 'System is healthy.');

  rawEl.textContent = JSON.stringify(snapshot, null, 2);
  return snapshot;
}

// --- EXPORT / CLEAR ---
function exportJSON(text, filename='health_snapshot.json'){
  const blob = new Blob([text], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function clearAppCache(){
  // keep auth; clear app keys (safe default)
  const keep = new Set([]);
  const removed = [];
  for(let i=localStorage.length-1;i>=0;i--){
    const k = localStorage.key(i);
    if (!keep.has(k)) { removed.push(k); localStorage.removeItem(k); }
  }
  return removed;
}

// --- BOOTSTRAP (wait for firebase + auth) ---
document.addEventListener('DOMContentLoaded', () => {
  // Guard: show admin gate only to non-admin
  firebase.auth().onAuthStateChanged(async (user) => {
    const isAdmin = !!user && user.email === ADMIN_EMAIL;
    adminUser.textContent = user ? `Signed in: ${user.email}` : 'Not signed in';

    if (!user || !isAdmin) {
      guard.classList.remove('hide');
    }

    // Button wires
    btnRun.addEventListener('click', () => runChecks(!!window.firebase));
    btnExport.addEventListener('click', () => exportJSON(rawEl.textContent));
    btnClear.addEventListener('click', () => {
      const removed = clearAppCache();
      alert(`Cleared ${removed.length} keys from localStorage.`);
      runChecks(!!window.firebase);
    });

    // Auto-run once if admin signed in
    if (isAdmin) {
      // ensure cache version persisted to compare
      if (!localStorage.getItem('app.version')) {
        localStorage.setItem('app.version', APP_VERSION);
      }
      runChecks(!!window.firebase);
    }
  });

  // Global error hook (optional but recommended)
  window.addEventListener('error', (e) => {
    const payload = {
      ts: Date.now(),
      message: e?.message || 'Unknown error',
      source: e?.filename,
      line: e?.lineno,
      col: e?.colno
    };
    localStorage.setItem('app.lastError', JSON.stringify(payload));
  });
  window.addEventListener('unhandledrejection', (e) => {
    const payload = {
      ts: Date.now(),
      message: (e?.reason && (e.reason.message || String(e.reason))) || 'Unhandled rejection',
    };
    localStorage.setItem('app.lastError', JSON.stringify(payload));
  });
});
