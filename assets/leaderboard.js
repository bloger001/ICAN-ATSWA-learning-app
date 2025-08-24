// Weekly leaderboard from Firestore "runs"
import { db } from './firebase.js';
import {
  collection, query, orderBy, getDocs, Timestamp
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

const board = document.getElementById('board');

function sevenDaysAgo(){
  const d = new Date(); d.setDate(d.getDate() - 7);
  return Timestamp.fromDate(d);
}

async function loadBoard(){
  try {
    board.textContent = 'Loading…';
    const q = query(collection(db,'runs'), orderBy('ts','desc'));
    const snap = await getDocs(q);

    const cutoff = sevenDaysAgo();
    const rows = [];
    snap.forEach(doc=>{
      const d = doc.data();
      if (!d || !d.ts) return;
      if (d.ts.seconds < cutoff.seconds) return; // older than 7d
      rows.push(d);
    });

    // Aggregate by user
    const agg = new Map();
    for (const r of rows){
      const key = r.uid || r.email || 'unknown';
      if (!agg.has(key)) agg.set(key, { name: r.displayName || r.email || 'Student', points:0, attempts:0, total:0 });
      const a = agg.get(key);
      a.points  += r.score || 0;
      a.total   += r.total || 0;
      a.attempts += 1;
    }

    const list = [...agg.values()].sort((a,b)=> b.points - a.points).slice(0, 20);

    if (!list.length){
      board.innerHTML = `<p class="muted">No runs yet this week. Finish a quiz to appear on the board.</p>`;
      return;
    }

    board.innerHTML = list.map((r,i)=>`
      <div class="space-between card" style="margin:8px 0; align-items:center">
        <div><b>#${i+1}</b> ${r.name}</div>
        <div class="row">
          <span class="pill mono">Points: ${r.points}</span>
          <span class="pill mono">Attempts: ${r.attempts}</span>
          <span class="pill mono">Accuracy: ${r.total? Math.round((r.points/r.total)*100):0}%</span>
        </div>
      </div>
    `).join('');
  } catch (e) {
    board.innerHTML = `<p class="muted">Error loading leaderboard: ${e.message}</p>`;
    console.error(e);
  }
}

loadBoard();