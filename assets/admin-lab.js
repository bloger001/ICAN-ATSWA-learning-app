const ADMIN_EMAIL = 'offixcialbloger@gmail.com';
const APP_VERSION = '1.0.4';
const LEADERBOARD = 'leaderboard';
const DIAGNOSTICS = 'diagnostics';
const HUB_CHANNEL = 'aihub';
const REQUIRED_KEYS = ['aiHub.health','quiz.localResults','quiz.mistakes','user.slim','app.version'];

const $ = s => document.querySelector(s);
const rows = $('#rows'), snapPre = $('#snapshot');
const authBadge = $('#authState'), roleBadge = $('#roleState'), appVerChip = $('#appVer');
const overallBox = $('#overall'), overallTitle = $('#overallTitle'), overallSub = $('#overallSub');
const hub = new BroadcastChannel(HUB_CHANNEL);

function badge(ok,warn=false){ if(warn) return `<span class="badge warn">WARN</span>`; return ok?`<span class="badge good">OK</span>`:`<span class="badge bad">ISSUE</span>`}
function addRow({name,ok,detail,warn=false}){ rows.insertAdjacentHTML('beforeend', `<div class="row"><div>${name}</div><div>${badge(ok,warn)}</div><div>${detail||''}</div><div class="muted">${new Date().toLocaleString()}</div></div>`); }
function setOverall(kind,title,sub){ overallBox.classList.remove('good','bad','warn'); overallBox.classList.add(kind); overallTitle.textContent=title; overallSub.textContent=sub||''; }
function getJSON(k,f){ try{ const v=localStorage.getItem(k); return v?JSON.parse(v):f }catch(_){ return f } }
function setJSON(k,v){ localStorage.setItem(k, JSON.stringify(v)) }
function bytesUsed(){ let t=0; for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i), v=localStorage.getItem(k)||''; t+=k.length+v.length } return t }
function kb(n){ return `${(n/1024).toFixed(1)} KB` }

async function buildSnapshot(){
  const user = firebase?.auth?.().currentUser || null;
  const cdn = { app:!!window.firebase?.app, auth:!!window.firebase?.auth, firestore:!!window.firebase?.firestore };
  return {
    ts: Date.now(),
    app:{ versionExpected:APP_VERSION, versionCached:localStorage.getItem('app.version')||null, cdnLoaded:cdn, online:navigator.onLine, ua:navigator.userAgent },
    auth:{ available:cdn.auth, signedIn:!!user, email:user?.email||null, isAdmin:!!user && user.email===ADMIN_EMAIL },
    storage:{ keysPresent:REQUIRED_KEYS.map(k=>[k,!!localStorage.getItem(k)]), bytes:bytesUsed() },
    quiz:{ localResultsCount:(getJSON('quiz.localResults',[])||[]).length, mistakesCount:(getJSON('quiz.mistakes',[])||[]).length },
    lastError:getJSON('app.lastError', null),
  };
}
function updateBadgesFromSnapshot(snap){
  appVerChip.textContent = `v${APP_VERSION}`;
  authBadge.textContent = snap.auth.available ? (snap.auth.signedIn?`Auth: ${snap.auth.email}`:'Auth: signed out') : 'Auth not available';
  authBadge.classList.toggle('bad', !snap.auth.available);
  roleBadge.textContent = `Role: ${snap.auth.isAdmin? 'admin':'guest'}`;
}
async function refreshOverall(){
  const snap = await buildSnapshot();
  snapPre.textContent = JSON.stringify(snap, null, 2);
  updateBadgesFromSnapshot(snap);
  const sdkOk = snap.app.cdnLoaded.app && snap.app.cdnLoaded.auth && snap.app.cdnLoaded.firestore;
  const versionOk = snap.app.versionCached === APP_VERSION;
  const authOk = snap.auth.available && snap.auth.signedIn;
  const haveErrors = !!snap.lastError;
  if (!sdkOk) setOverall('bad','SDK Problem','Check CDN order or assets/firebase.js');
  else if (!versionOk) setOverall('warn','Version Mismatch','Hard refresh recommended.');
  else if (!authOk) setOverall('warn','Signed Out','Sign in with Google to unlock admin tests.');
  else if (haveErrors) setOverall('warn','Recent Errors Logged','See “Last Runtime Error” below.');
  else setOverall('good','All Good','System healthy.');
}

// Checks
async function checkSDKs(){ const ok=!!(window.firebase?.app&&window.firebase?.auth&&window.firebase?.firestore); addRow({name:'Firebase SDKs Loaded', ok, detail: ok?'Compat SDKs present':'Missing/misordered Firebase compat scripts'}); }
async function checkAuth(){ const u=firebase.auth().currentUser; addRow({name:'Authentication', ok:!!u, detail:u?`Signed in as ${u.email}`:'No user signed in', warn:!u}); addRow({name:'Admin Privilege', ok:!!u && u.email===ADMIN_EMAIL, detail: u?`User=${u.email}`:'Unknown user', warn:!!u && u.email!==ADMIN_EMAIL}); }
async function checkVersion(){ const cached=localStorage.getItem('app.version'); const ok=cached===APP_VERSION; addRow({name:'App Version', ok, detail: ok?`v${APP_VERSION}`:`Mismatch cached=${cached||'none'} expected=${APP_VERSION}`, warn:!ok}); }
async function checkLocalStorage(){ const missing=REQUIRED_KEYS.filter(k=>!localStorage.getItem(k)); addRow({name:'LocalStorage Keys', ok:missing.length===0, detail: missing.length?`Missing: ${missing.join(', ')}`:'All present', warn:missing.length>0}); addRow({name:'LocalStorage Usage', ok: bytesUsed()<0.8*4*1024*1024, detail:`${kb(bytesUsed())} used / ~4MB`, warn: bytesUsed()>=0.8*4*1024*1024}); }
async function checkFirestore(){ const db=firebase.firestore(); try{ await db.collection(DIAGNOSTICS).doc('health_probe').set({ ts: firebase.firestore.FieldValue.serverTimestamp(), ver: APP_VERSION },{merge:true}); addRow({name:'Firestore Write Probe', ok:true, detail:`${DIAGNOSTICS}/health_probe wrote OK`}); }catch(e){ addRow({name:'Firestore Write Probe', ok:false, detail:e.message}); } }
async function checkLastError(){ const err=getJSON('app.lastError',null); addRow({name:'Last Runtime Error', ok:!err, detail: err? JSON.stringify(err).slice(0,300):'No recent errors', warn:!!err}); }

// Buttons
$('#btnFullSuite').addEventListener('click', async()=>{ rows.innerHTML=''; await checkSDKs(); await checkAuth(); await checkVersion(); await checkLocalStorage(); await checkFirestore(); await checkLastError(); await refreshOverall(); });
$('#btnClearLocalErr').addEventListener('click', ()=>{ localStorage.removeItem('app.lastError'); addRow({name:'Local error log', ok:true, detail:'Cleared'}); });
$('#btnHardRefresh').addEventListener('click', async()=>{ localStorage.removeItem('app.version'); try{ if (window.caches){ const keys=await caches.keys(); await Promise.all(keys.map(k=>caches.delete(k))); addRow({name:'CacheStorage', ok:true, detail:'Cleared'}); } }catch(e){ addRow({name:'CacheStorage', ok:false, detail:e.message}); } location.reload(); });
$('#btnExportSnapshot').addEventListener('click', ()=>{ const blob=new Blob([snapPre.textContent], {type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='health_snapshot.json'; a.click(); URL.revokeObjectURL(url); });

// Auth
$('#btnAuthPing').addEventListener('click', ()=>{ const u=firebase.auth().currentUser; $('#authResult').textContent = u?`Signed in: ${u.email}`:'Signed out'; addRow({name:'Auth ping', ok:!!u, detail:u?u.email:'No session'}); refreshOverall(); });
$('#btnGoogleSignIn').addEventListener('click', async()=>{ try{ const p=new firebase.auth.GoogleAuthProvider(); await firebase.auth().signInWithPopup(p); addRow({name:'Google Sign-In (popup)', ok:true, detail:'Success'});}catch(e){ addRow({name:'Google Sign-In (popup)', ok:false, detail:e.message}); } refreshOverall(); });
$('#btnGoogleRedirect').addEventListener('click', async()=>{ try{ const p=new firebase.auth.GoogleAuthProvider(); await firebase.auth().signInWithRedirect(p);}catch(e){ addRow({name:'Google Sign-In (redirect)', ok:false, detail:e.message}); }});
$('#btnSignOut').addEventListener('click', async()=>{ try{ await firebase.auth().signOut(); addRow({name:'Sign out', ok:true, detail:'Done'});}catch(e){ addRow({name:'Sign out', ok:false, detail:e.message}); } refreshOverall(); });

// Firestore
$('#btnFSRead').addEventListener('click', async()=>{ const db=firebase.firestore(); try{ const snap=await db.collection(LEADERBOARD).limit(1).get(); $('#fsResult').textContent=`Read OK, sample size=${snap.size}`; addRow({name:'Firestore Read', ok:true, detail:`leaderboard size≥${snap.size}`}); }catch(e){ $('#fsResult').textContent=e.message; addRow({name:'Firestore Read', ok:false, detail:e.message}); }});
$('#btnFSWrite').addEventListener('click', async()=>{ const db=firebase.firestore(); try{ await db.collection(DIAGNOSTICS).doc('health_probe').set({ ts: firebase.firestore.FieldValue.serverTimestamp(), by: firebase.auth().currentUser?.email||'anon', ver: APP_VERSION },{merge:true}); $('#fsResult').textContent='Write OK'; addRow({name:'Firestore Write', ok:true, detail:`${DIAGNOSTICS}/health_probe`}); }catch(e){ $('#fsResult').textContent=e.message; addRow({name:'Firestore Write', ok:false, detail:e.message}); }});
$('#btnFSRules').addEventListener('click', ()=>{ const u=firebase.auth().currentUser; const isAdmin=!!u && u.email===ADMIN_EMAIL; addRow({name:'Rules sanity', ok:isAdmin, detail:isAdmin?'Admin may write diagnostics':'Non-admin: write should be blocked', warn:!isAdmin}); });

// Leaderboard
$('#btnLBWriteProbe').addEventListener('click', async()=>{ const db=firebase.firestore(); try{ const doc={tag:'probe',ver:APP_VERSION,score:Math.floor(Math.random()*100),ts:firebase.firestore.FieldValue.serverTimestamp(),by:firebase.auth().currentUser?.email||'anon'}; await db.collection(LEADERBOARD).add(doc); $('#lbResult').textContent='Probe score written'; addRow({name:'Leaderboard write', ok:true, detail:`score=${doc.score}`}); }catch(e){ $('#lbResult').textContent=e.message; addRow({name:'Leaderboard write', ok:false, detail:e.message}); }});
$('#btnLBReadTop').addEventListener('click', async()=>{ const db=firebase.firestore(); try{ const snap=await db.collection(LEADERBOARD).orderBy('score','desc').limit(5).get(); const arr=snap.docs.map(d=>({id:d.id,...d.data()})); $('#lbResult').textContent=JSON.stringify(arr,null,2); addRow({name:'Leaderboard read', ok:true, detail:`Top ${arr.length} loaded`}); }catch(e){ $('#lbResult').textContent=e.message; addRow({name:'Leaderboard read', ok:false, detail:e.message}); }});
$('#btnLBCleanProbes').addEventListener('click', async()=>{ const db=firebase.firestore(); try{ const snap=await db.collection(LEADERBOARD).where('tag','==','probe').get(); const batch=db.batch(); snap.forEach(doc=>batch.delete(doc.ref)); await batch.commit(); $('#lbResult').textContent=`Deleted ${snap.size} probe docs`; addRow({name:'Leaderboard clean probes', ok:true, detail:`Deleted ${snap.size}`}); }catch(e){ $('#lbResult').textContent=e.message; addRow({name:'Leaderboard clean probes', ok:false, detail:e.message}); }});

// Question Bank
let BANK=null;
async function loadBankFromFile(file){ const text=await file.text(); BANK=JSON.parse(text); setJSON('quiz.bankJSON', BANK); return BANK; }
function getBankFromLocal(){ const b=getJSON('quiz.bankJSON', null); if(b) BANK=b; return b; }
function normalizeQuestion(q){ const t=(q.questionText||q.q||'').replace(/\s+/g,' ').trim().toLowerCase(); return t; }
function auditBank(bank){ if(!Array.isArray(bank)) throw new Error('Bank must be an array of question objects'); const seenId=new Map(), seenText=new Map(); for(const q of bank){ if(q.id) seenId.set(q.id,(seenId.get(q.id)||0)+1); const t=normalizeQuestion(q); if(t) seenText.set(t,(seenText.get(t)||0)+1); } const dupId=[...seenId.entries()].filter(([,c])=>c>1); const dupText=[...seenText.entries()].filter(([,c])=>c>1).sort((a,b)=>b[1]-a[1]).slice(0,10); return {count:bank.length, dupId, dupText}; }
function fisherYates(a){ a=a.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }

$('#fileBank').addEventListener('change', async(e)=>{ try{ if(!e.target.files?.[0]) return; const bank=await loadBankFromFile(e.target.files[0]); $('#bankResult').textContent=`Loaded ${bank.length} questions from file → saved to localStorage`; addRow({name:'Bank load (file)', ok:true, detail:`${bank.length} items`}); }catch(err){ $('#bankResult').textContent=err.message; addRow({name:'Bank load (file)', ok:false, detail:err.message}); }});
$('#btnBankUseLocal').addEventListener('click', ()=>{ const b=getBankFromLocal(); $('#bankResult').textContent=b?`Loaded ${b.length} from localStorage`:'No bank in localStorage'; addRow({name:'Bank load (localStorage)', ok:!!b, detail:b?`${b.length} items`:'Missing'}); });
$('#btnBankPaste').addEventListener('click', ()=>{ const text=prompt('Paste JSON array of questions:'); if(!text) return; try{ const b=JSON.parse(text); setJSON('quiz.bankJSON', b); BANK=b; $('#bankResult').textContent=`Saved ${b.length} questions to localStorage`; addRow({name:'Bank load (paste)', ok:true, detail:`${b.length} items`}); }catch(e){ $('#bankResult').textContent=e.message; addRow({name:'Bank load (paste)', ok:false, detail:e.message}); }});
$('#btnBankAudit').addEventListener('click', ()=>{ try{ const bank=BANK||getBankFromLocal(); if(!bank) throw new Error('No bank loaded'); const rep=auditBank(bank); const msg=`Total=${rep.count}; dupId=${rep.dupId.length}; dupTextTop=${rep.dupText.length}`; $('#bankResult').textContent=msg+'\n'+JSON.stringify(rep.dupText,null,2); addRow({name:'Bank audit', ok:rep.dupId.length===0 && rep.dupText.length===0, detail:msg, warn: rep.dupId.length+rep.dupText.length>0}); }catch(e){ $('#bankResult').textContent=e.message; addRow({name:'Bank audit', ok:false, detail:e.message}); }});
$('#btnBankShuffleTest').addEventListener('click', ()=>{ try{ const bank=BANK||getBankFromLocal(); if(!bank) throw new Error('No bank loaded'); const sample=fisherYates(bank).slice(0,40); const texts=new Set(); let dup=0; for(const q of sample){ const t=normalizeQuestion(q); if(texts.has(t)) dup++; else texts.add(t); } const ok=dup===0; $('#bankResult').textContent=`Shuffle sample=${sample.length}; duplicates found=${dup}`; addRow({name:'Shuffle/no-repeat sample', ok, detail:`dups=${dup}`, warn:!ok}); }catch(e){ $('#bankResult').textContent=e.message; addRow({name:'Shuffle/no-repeat sample', ok:false, detail:e.message}); }});

// Status / Analytics
function computeStatus(results){ const total=results.length; const byTopic=new Map(); for(const r of results){ const t=r.topic||'Unknown'; const cur=byTopic.get(t)||{attempts:0,correct:0}; cur.attempts+=1; if(r.correct) cur.correct+=1; byTopic.set(t,cur);} const arr=[...byTopic.entries()].map(([topic,v])=>({topic,attempts:v.attempts,accuracy:v.attempts?(v.correct/v.attempts):0})).sort((a,b)=>a.accuracy-b.accuracy); return {total, topics:arr, weakest:arr.slice(0,3)}; }
$('#btnStatusFromLocal').addEventListener('click', ()=>{ const res=getJSON('quiz.localResults',[]); const rep=computeStatus(res); $('#statusResult').textContent=JSON.stringify(rep,null,2); addRow({name:'Status from localResults', ok:true, detail:`attempts=${rep.total}; weakest=${rep.weakest.map(x=>x.topic).join(', ')||'—'}`}); });
$('#btnStatusMock').addEventListener('click', ()=>{ const mock=[]; const topics=['Principles','Double Entry','Controls','Bank Rec','Errors','Trial Balance']; for(let i=0;i<150;i++){ mock.push({topic:topics[i%topics.length], correct: Math.random()>0.42}); } const rep=computeStatus(mock); $('#statusResult').textContent=JSON.stringify(rep,null,2); addRow({name:'Status on mock data', ok:true, detail:`attempts=${rep.total}; weakest=${rep.weakest.map(x=>x.topic).join(', ')}`}); });
$('#btnStatusExport').addEventListener('click', ()=>{ const text=$('#statusResult').textContent||'{}'; const blob=new Blob([text],{type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='status_report.json'; a.click(); URL.revokeObjectURL(url); });

// Hub / Index bridge
$('#btnHubPing').addEventListener('click', async()=>{
  const id=Math.random().toString(36).slice(2,7);
  const reply=await new Promise(resolve=>{
    const to=setTimeout(()=>resolve({error:'timeout'}),1500);
    const handler=(ev)=>{ if(ev.data?.type==='pong' && ev.data?.pingId===id){ clearTimeout(to); hub.removeEventListener('message', handler); resolve(ev.data); } };
    hub.addEventListener('message', handler);
    hub.postMessage({type:'ping', pingId:id, from:'admin.html'});
  });
  $('#hubResult').textContent=JSON.stringify(reply,null,2);
  addRow({name:'Hub ping → index', ok:!reply.error, detail: reply.error?reply.error:`reply from ${reply.from}`, warn:!!reply.error});
});
$('#btnHubSendBank').addEventListener('click', ()=>{ const bank=BANK||getBankFromLocal(); if(!bank){ addRow({name:'Send bank → index', ok:false, detail:'No bank loaded'}); return;} hub.postMessage({type:'bank.push', len:bank.length}); addRow({name:'Send bank → index', ok:true, detail:`sent len=${bank.length}`}); });
$('#btnHubAskModules').addEventListener('click', async()=>{
  const reply=await new Promise(resolve=>{
    const to=setTimeout(()=>resolve({error:'timeout'}),1500);
    const handler=(ev)=>{ if(ev.data?.type==='modules.info'){ clearTimeout(to); hub.removeEventListener('message', handler); resolve(ev.data);} };
    hub.addEventListener('message', handler);
    hub.postMessage({type:'modules.request'});
  });
  $('#hubResult').textContent=JSON.stringify(reply,null,2);
  addRow({name:'Ask modules (index)', ok:!reply.error, detail: reply.error?reply.error: `modules=${(reply.modules||[]).join(', ')}`, warn:!!reply.error});
});

// Error capture
window.addEventListener('error', e=>{ setJSON('app.lastError',{ts:Date.now(),message:e.message,source:e.filename,line:e.lineno,col:e.colno}); });
window.addEventListener('unhandledrejection', e=>{ setJSON('app.lastError',{ts:Date.now(),message:String(e.reason||'unhandled rejection')}); });

// Boot
document.addEventListener('DOMContentLoaded', async()=>{
  if(!localStorage.getItem('app.version')) localStorage.setItem('app.version', APP_VERSION);
  firebase.auth().onAuthStateChanged(async _=>{ await refreshOverall(); });
});