/* quiz.js — robust loader with diagnostics */
(function () {
  const ui = {
    msg: document.getElementById("quizMsg") || document.getElementById("boardMsg") || null,
    box: document.getElementById("quizBox") || document.getElementById("board") || null
  };

  function say(txt) {
    if (ui.msg) ui.msg.textContent = txt;
    console.log("[QUIZ]", txt);
  }
  function panic(title, detail) {
    const msg = `${title}${detail ? " — " + detail : ""}`;
    say(msg);
    if (ui.box) {
      ui.box.innerHTML = `<div class="muted" style="margin-top:8px">
        <div style="font-weight:600;color:#ffb4b4">⚠️ ${title}</div>
        <div style="opacity:.9">${detail || ""}</div>
      </div>`;
    }
  }

  // ---- read params
  const params = new URLSearchParams(location.search);
  const level = (params.get("level") || "atswa1").toLowerCase();
  const subject = (params.get("subject") || "").toLowerCase();

  if (!subject) {
    return panic("Missing subject", "URL must include ?level=atswa1&subject=basic_accounting (for example).");
  }

  // ---- map subject -> data file
  // Keep these exactly matching your /data filenames
  const fileMap = {
    "basic_accounting": `./data/${level}_basic_accounting.json`,
    "business_law":     `./data/${level}_business_law.json`,
    "economics":        `./data/${level}_economics.json`,
    "comm_skills":      `./data/${level}_comm_skills.json`
  };

  const dataPath = fileMap[subject];
  if (!dataPath) {
    return panic("Unknown subject", `No mapping for subject "${subject}".`);
  }

  // ---- fetch with timeout + no-cache
  async function fetchWithTimeout(url, ms = 12000) {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), ms);
    try {
      const res = await fetch(`${url}?v=${Date.now()}`, { cache: "no-store", signal: ctl.signal });
      clearTimeout(t);
      return res;
    } catch (e) {
      clearTimeout(t);
      throw e;
    }
  }

  async function loadQuestions() {
    say("Preparing questions…");
    let res;
    try {
      res = await fetchWithTimeout(dataPath);
    } catch (e) {
      return panic("Network error", `Could not reach ${dataPath}. ${e.name === "AbortError" ? "Request timed out." : e.message}`);
    }
    if (!res.ok) {
      return panic("Could not load questions", `${dataPath} → HTTP ${res.status}`);
    }

    let data;
    try {
      data = await res.json();
    } catch (e) {
      return panic("Invalid JSON", `Failed to parse ${dataPath}. ${e.message}`);
    }

    if (!Array.isArray(data) || data.length === 0) {
      return panic("Empty question set", `${dataPath} returned 0 items.`);
    }

    // Normalize questions (adds ids if missing)
    const questions = data.map((q, i) => ({
      id: q.id || `${subject}-${i + 1}`,
      question: q.question || q.q || "",
      options: q.options || q.choices || [],
      answer: q.answer,
      topic: q.topic || null
    }));

    // Minimal render (keeps your old styles/structure)
    if (ui.box) {
      ui.box.innerHTML = "";
      const wrap = document.createElement("div");
      wrap.style.display = "grid";
      wrap.style.gap = "12px";

      questions.forEach((q, idx) => {
        const card = document.createElement("div");
        card.className = "card";
        card.innerHTML = `
          <div class="muted small" style="margin-bottom:6px">Q${idx + 1}${q.topic ? ` · <span>${q.topic}</span>` : ""}</div>
          <div style="margin-bottom:8px">${q.question}</div>
          <div>
            ${q.options.map((opt, oi) => `
              <label style="display:block;margin:.25rem 0">
                <input type="radio" name="q_${idx}" value="${oi}"> ${opt}
              </label>
            `).join("")}
          </div>
        `;
        wrap.appendChild(card);
      });
      ui.box.appendChild(wrap);
      say(`Loaded ${questions.length} questions`);
    } else {
      say(`Loaded ${questions.length} questions (no container found to render).`);
    }
  }

  // Kick off
  try {
    loadQuestions();
  } catch (e) {
    panic("Loader crashed", e.message);
  }
})();