<script>
// --- admin.js (drop-in) ---
(() => {
  const ADMIN_EMAIL = "offixcialbloger@gmail.com";
  const healthEl = document.querySelector("#healthDump");
  const errorsEl = document.querySelector("#errorDump");
  const gateEl = document.querySelector("#gateMsg");

  function readLS(key, fallback="{}") {
    try { return JSON.parse(localStorage.getItem(key) || fallback); }
    catch { return JSON.parse(fallback); }
  }

  function renderDiagnostics() {
    const health = readLS("ican:health:home", "{}");
    const errs = readLS("ican:error:log", "[]");

    if (healthEl) healthEl.textContent = JSON.stringify(health, null, 2);
    if (errorsEl) errorsEl.textContent = JSON.stringify(errs, null, 2);
  }

  function lock(reason) {
    if (gateEl) gateEl.textContent = reason || "Not authorized";
    document.body.classList.add("locked");
  }

  // Require auth + admin email
  const onAuthChanged = window.AppOnAuthChanged || function(){};
  const auth = window.AppAuth || null;
  if (!auth || !onAuthChanged) {
    lock("Auth not initialized.");
    renderDiagnostics();
    return;
  }

  onAuthChanged((user) => {
    if (!user) { lock("Please sign in."); return; }
    const ok = (user.email || "").toLowerCase() === ADMIN_EMAIL.toLowerCase();
    if (!ok) { lock("Admin only."); return; }
    // Authorized — show tools
    document.body.classList.remove("locked");
    renderDiagnostics();
  });
})();
</script>