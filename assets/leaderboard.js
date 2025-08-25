// assets/leaderboard.js  v50
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore, collection, query, orderBy, limit, getDocs
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const cfg = window.firebaseConfig;
const app = initializeApp(cfg);
const db  = getFirestore(app);

const list = document.getElementById('lbList');
const err  = document.getElementById('lbError');

function row(i, d){
  const pct = (d.pct ?? Math.round(100 * (d.score||0)/Math.max(1, d.total||0)));
  return `${String(i).padStart(2,"0")}. ${d.email||"anonymous"} — ${d.subject||""} — ${d.score||0}/${d.total||0} (${pct}%)`;
}

(async ()=>{
  try {
    const q = query(collection(db, "scores"), orderBy("pct","desc"), limit(100));
    const snap = await getDocs(q);
    if (snap.empty){ list.textContent = "(no cloud scores yet)"; return; }
    const lines = [];
    let i=1;
    snap.forEach(doc=> lines.push(row(i++, doc.data())));
    list.textContent = lines.join("\n");
  } catch(e){
    err.style.display='block';
    err.textContent = `Could not load leaderboard (rules or network): ${e.code||e}`;
  }
})();