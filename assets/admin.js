const diag = document.getElementById("diag");
const localLog = document.getElementById("localLog");
const files = [
  "./assets/app.js",
  "./assets/firebase.js",
  "./assets/app.css",
  "./data/atswa1_basic_accounting.json",
  "./data/atswa1_business_law.json",
  "./data/atswa1_economics.json",
  "./data/atswa1_comm_skills.json",
  "./leaderboard.html",
  "./quiz.html",
  "./status.html",
  "./review.html"
];

function log(s){ diag.textContent += s + "\n"; }

document.getElementById("checkHealth").addEventListener("click", async ()=>{
  diag.textContent = "";
  log("✅ firebaseConfig present");

  for (const f of files){
    try{
      const r = await fetch(f, {cache:"no-store"});
      log(`${r.ok ? "✅" : "❌"} ${r.status} ${f}`);
    }catch(e){
      log(`❌ ERR ${f} ${e.message}`);
    }
  }

  try{
    const snap = await firebaseDB.collection("leaderboard").limit(1).get();
    log(snap ? "✅ Firestore read ok" : "❌ Firestore read failed");
  }catch(e){
    log(`❌ Firestore read failed: ${e.code || e.message}`);
  }

  log("✅ Diagnostics complete");
});

document.getElementById("clearLog").addEventListener("click", ()=>{
  localStorage.removeItem("ican_error_log");
  localLog.textContent = "(empty)";
});

// Show saved local errors (if any)
localLog.textContent = localStorage.getItem("ican_error_log") || "(empty)";
window.addEventListener("error", e=>{
  const prev = localStorage.getItem("ican_error_log") || "";
  localStorage.setItem("ican_error_log", (prev + "\n" + e.message).trim());
});