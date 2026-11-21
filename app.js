// Lógica Principal de Academia EX378: Estudio + Entrenador Infinito de Anotaciones + Modo Claro/Oscuro
(function () {
  const STORAGE_KEY = "ex378_trainer_state_v3";
  const SYNC_CODE_KEY = "ex378_sync_code_v1";
  let syncSaveTimer = null;
  let syncStatus = "";

  const defaultState = {
    theme: "light", // Por defecto inicia en Modo Claro
    xp: 0,
    streak: 0,
    bestStreak: 0,
    totalAnswered: 0,
    totalCorrect: 0,
    questionStats: {},
    wrongQueue: [],
    selectedModuleId: "config",
    quizFilter: "all",
    quizMode: "all-types",
    annotationTopicFilter: "all",
    annotationSubView: "cards",
    questionsSinceLastWrongReview: 0
  };

  let state = loadState();
  let currentQuestion = null;
  let currentOptions = [];
  let answeredCurrent = false;
  let flashcardIndex = 0;
  let flashcardFlipped = false;

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return JSON.parse(JSON.stringify(defaultState));
      return Object.assign(JSON.parse(JSON.stringify(defaultState)), JSON.parse(raw));
    } catch (e) {
      return JSON.parse(JSON.stringify(defaultState));
    }
  }

  function sanitizeSyncCode(raw) {
    if (!raw) return "";
    const cleaned = String(raw).trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
    return cleaned.length >= 3 && cleaned.length <= 64 ? cleaned : "";
  }

  function getSyncCode() {
    try {
      return sanitizeSyncCode(localStorage.getItem(SYNC_CODE_KEY));
    } catch (e) {
      return "";
    }
  }

  function setSyncCode(code) {
    const clean = sanitizeSyncCode(code);
    try {
      if (clean) localStorage.setItem(SYNC_CODE_KEY, clean);
      else localStorage.removeItem(SYNC_CODE_KEY);
    } catch (e) {}
    return clean;
  }

  function updateSyncBadge(label) {
    const el = document.getElementById("sync-status-label");
    if (!el) return;
    const code = getSyncCode();
    if (!code) {
      el.textContent = "Sync";
      return;
    }
    el.textContent = label || `${code} ✓`;
  }

  async function pushCloudState() {
    const code = getSyncCode();
    if (!code) return;
    updateSyncBadge(`${code} ...`);
    try {
      const res = await fetch(`/api/progress?code=${encodeURIComponent(code)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state })
      });
      if (res.ok) {
        updateSyncBadge(`${code} ✓`);
      } else {
        updateSyncBadge(`${code} !`);
      }
    } catch (e) {
      updateSyncBadge(`${code} (offline)`);
    }
  }

  async function pullCloudState(forceReplace) {
    const code = getSyncCode();
    if (!code) {
      updateSyncBadge();
      return;
    }
    updateSyncBadge(`${code} ...`);
    try {
      const res = await fetch(`/api/progress?code=${encodeURIComponent(code)}`);
      if (res.status === 404) {
        if (state.totalAnswered > 0) {
          await pushCloudState();
        } else {
          updateSyncBadge(`${code} ✓`);
        }
        return;
      }
      if (!res.ok) {
        updateSyncBadge(`${code} !`);
        return;
      }
      const data = await res.json();
      if (data && data.state) {
        const cloudAnswered = data.state.totalAnswered || 0;
        if (forceReplace || cloudAnswered >= (state.totalAnswered || 0)) {
          state = Object.assign(JSON.parse(JSON.stringify(defaultState)), data.state);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
          applyTheme();
          renderTopStats();
          renderStudySidebar();
          renderStudyDetail();
          loadNextQuizQuestion();
        } else if (state.totalAnswered > cloudAnswered) {
          await pushCloudState();
        }
      }
      updateSyncBadge(`${code} ✓`);
    } catch (e) {
      updateSyncBadge(`${code} (offline)`);
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {}
    const code = getSyncCode();
    if (code) {
      updateSyncBadge(`${code} ...`);
      clearTimeout(syncSaveTimer);
      syncSaveTimer = setTimeout(pushCloudState, 600);
    }
  }

  function applyTheme() {
    const theme = state.theme === "dark" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", theme);
    const icon = document.getElementById("theme-toggle-icon");
    const label = document.getElementById("theme-toggle-label");
    if (icon && label) {
      if (theme === "light") {
        icon.textContent = "🌙";
        label.textContent = "Modo Oscuro";
      } else {
        icon.textContent = "☀️";
        label.textContent = "Modo Claro";
      }
    }
  }

  window.toggleTheme = function () {
    state.theme = state.theme === "dark" ? "light" : "dark";
    saveState();
    applyTheme();
  };

  function escapeHtml(str) {
    if (!str) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function shuffleArray(arr) {
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    return copy;
  }

  function getFilteredPool() {
    const filter = state.quizFilter;
    const mode = state.quizMode || "all-types";

    if (filter === "wrong") {
      const wrongQuestions = state.wrongQueue
        .map(id => window.QUESTION_BANK.find(q => q.id === id))
        .filter(Boolean);
      if (wrongQuestions.length > 0) return wrongQuestions;
    }

    let pool = window.QUESTION_BANK.slice();
    if (filter !== "all" && filter !== "wrong") {
      pool = pool.filter(q => q.module === filter);
    }
    if (mode !== "all-types") {
      const byMode = pool.filter(q => q.category === mode);
      if (byMode.length > 0) pool = byMode;
    }
    return pool;
  }

  function getModuleMastery(moduleId) {
    const modQuestions = window.QUESTION_BANK.filter(q => q.module === moduleId);
    if (modQuestions.length === 0) return 0;
    let masteredCount = 0;
    modQuestions.forEach(q => {
      const st = state.questionStats[q.id];
      if (st && st.mastered && (!st.consecutiveCorrectNeeded || st.consecutiveCorrectNeeded <= 0)) {
        masteredCount++;
      }
    });
    return Math.round((masteredCount / modQuestions.length) * 100);
  }

  function pickNextQuestion() {
    const filter = state.quizFilter;
    const mode = state.quizMode || "all-types";

    if (filter === "wrong") {
      if (state.wrongQueue.length > 0) {
        const qId = state.wrongQueue[0];
        const found = window.QUESTION_BANK.find(q => q.id === qId);
        if (found) return Object.assign({}, found, { isSpacedReview: true });
      }
      state.quizFilter = "all";
    }

    // Revisar si hay preguntas falladas listas para repetición espaciada
    const matchingWrong = state.wrongQueue.filter(qId => {
      const qObj = window.QUESTION_BANK.find(q => q.id === qId);
      if (!qObj) return false;
      const modMatch = filter === "all" || qObj.module === filter;
      const modeMatch = mode === "all-types" || qObj.category === mode;
      return modMatch && modeMatch;
    });

    if (matchingWrong.length > 0 && state.questionsSinceLastWrongReview >= 2) {
      state.questionsSinceLastWrongReview = 0;
      const reviewId = matchingWrong[0];
      const reviewQ = window.QUESTION_BANK.find(q => q.id === reviewId);
      if (reviewQ) {
        return Object.assign({}, reviewQ, { isSpacedReview: true });
      }
    }

    const pool = getFilteredPool();
    const unmastered = pool.filter(q => {
      const st = state.questionStats[q.id];
      return !st || !st.mastered || (st.consecutiveCorrectNeeded && st.consecutiveCorrectNeeded > 0);
    });

    state.questionsSinceLastWrongReview++;

    if (unmastered.length > 0) {
      const candidates = unmastered.filter(q => !currentQuestion || q.id !== currentQuestion.id);
      const list = candidates.length > 0 ? candidates : unmastered;
      return list[Math.floor(Math.random() * list.length)];
    }

    const nonSame = pool.filter(q => !currentQuestion || q.id !== currentQuestion.id);
    const finalPool = nonSame.length > 0 ? nonSame : pool;
    return finalPool[Math.floor(Math.random() * finalPool.length)];
  }

  function renderTopStats() {
    document.getElementById("stat-xp").textContent = state.xp + " XP";
    document.getElementById("stat-streak").textContent = state.streak + " 🔥";
    const acc = state.totalAnswered > 0 ? Math.round((state.totalCorrect / state.totalAnswered) * 100) : 0;
    document.getElementById("stat-accuracy").textContent = acc + "% (" + state.totalCorrect + "/" + state.totalAnswered + ")";
    document.getElementById("stat-wrong-count").textContent = state.wrongQueue.length;

    const badgeWrong = document.getElementById("nav-wrong-badge");
    if (badgeWrong) {
      badgeWrong.textContent = state.wrongQueue.length;
      badgeWrong.style.display = state.wrongQueue.length > 0 ? "inline-flex" : "none";
    }
  }

  function renderStudySidebar() {
    const container = document.getElementById("study-module-list");
    if (!container) return;
    container.innerHTML = window.STUDY_MODULES.map(mod => {
      const mastery = getModuleMastery(mod.id);
      const isSelected = state.selectedModuleId === mod.id;
      const scoreColor = mod.examScore === "0%"
        ? "bg-red-500/15 text-red-600 border-red-500/30"
        : "bg-amber-500/15 text-amber-600 border-amber-500/30";
      return `
        <button onclick="window.selectStudyModule('${mod.id}')"
          class="w-full text-left p-3 rounded-xl border transition-all duration-150 ${
            isSelected
              ? "bg-blue-600/15 border-blue-500 shadow-sm"
              : "theme-card hover:opacity-90"
          }">
          <div class="flex items-center justify-between gap-2 mb-1">
            <span class="text-xs font-bold uppercase tracking-wider text-blue-600">Tema ${mod.number}</span>
            <div class="flex items-center gap-1.5">
              <span class="text-xs px-2 py-0.5 rounded-full border font-semibold ${scoreColor}" title="Tu puntaje en el Intento 1">Examen: ${mod.examScore}</span>
              <span class="text-xs px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 border border-emerald-500/30 font-semibold">${mastery}%</span>
            </div>
          </div>
          <div class="font-semibold text-sm leading-snug">${escapeHtml(mod.title)}</div>
          <div class="w-full bg-slate-400/25 h-1.5 rounded-full mt-2 overflow-hidden">
            <div class="bg-emerald-500 h-full transition-all duration-300" style="width: ${mastery}%"></div>
          </div>
        </button>
      `;
    }).join("");
  }

  function renderStudyDetail() {
    const mod = window.STUDY_MODULES.find(m => m.id === state.selectedModuleId) || window.STUDY_MODULES[0];
    const container = document.getElementById("study-detail-content");
    if (!container || !mod) return;

    const dictForMod = (window.ANNOTATION_DICTIONARY || []).filter(a => a.module === mod.id);

    const dictCardsHtml = dictForMod.map(a => `
      <div class="theme-card border rounded-2xl p-4 hover:border-blue-500/60 transition-colors shadow-sm space-y-2">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <code class="text-xs sm:text-sm font-bold theme-code-badge px-2.5 py-1 rounded break-words">${escapeHtml(a.annotation)}</code>
          <span class="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-600 border border-blue-500/30">📍 ${escapeHtml(a.targetPlace)}</span>
        </div>
        <p class="text-xs sm:text-sm leading-relaxed"><strong>🧭 ¿Cuándo usarla?:</strong> ${escapeHtml(a.whenToUse)}</p>
        <p class="text-xs theme-text-muted"><strong>⚙️ Atributos clave:</strong> ${escapeHtml(a.attributes)}</p>
        <div class="text-xs theme-trap border rounded-lg px-3 py-2 theme-trap-body">
          <strong>⚠️ No confundir:</strong> ${escapeHtml(a.trapOrVs)}
        </div>
      </div>
    `).join("");

    const snippetsHtml = mod.codeSnippets.map(s => `
      <div class="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden mb-4 shadow-sm">
        <div class="bg-slate-800 px-4 py-2.5 border-b border-slate-700 flex items-center justify-between">
          <span class="text-xs sm:text-sm font-semibold text-blue-300">💻 ${escapeHtml(s.title)}</span>
          <span class="text-xs text-slate-400">Memorizar estructura</span>
        </div>
        <pre class="p-4 text-xs sm:text-sm text-emerald-300 font-mono overflow-x-auto leading-relaxed"><code>${escapeHtml(s.code)}</code></pre>
      </div>
    `).join("");

    const trapsHtml = mod.examTraps.map(t => `
      <li class="flex items-start gap-2.5 text-xs sm:text-sm theme-trap-body leading-relaxed">
        <span class="font-bold mt-0.5">⚠️</span>
        <span>${escapeHtml(t)}</span>
      </li>
    `).join("");

    container.innerHTML = `
      <div class="space-y-6">
        <!-- Encabezado del Tema -->
        <div class="theme-card border rounded-2xl p-5 shadow-sm">
          <div class="flex flex-wrap items-center justify-between gap-3 mb-2">
            <span class="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/15 text-blue-600 border border-blue-500/30">
              OBJETIVO #${mod.number} DEL EXAMEN EX378
            </span>
            <div class="flex flex-wrap gap-2 text-xs">
              <span class="px-2.5 py-1 rounded-lg theme-subtle border font-medium">📖 ${escapeHtml(mod.pdfPages)}</span>
              <span class="px-2.5 py-1 rounded-lg theme-subtle border font-medium">🎬 ${escapeHtml(mod.videos)}</span>
              <span class="px-2.5 py-1 rounded-lg theme-subtle border font-medium text-emerald-600">📂 ${escapeHtml(mod.labFolder)}</span>
            </div>
          </div>
          <h2 class="text-xl sm:text-2xl font-bold mb-4">${escapeHtml(mod.title)}</h2>

          <!-- Analogía para niño -->
          <div class="theme-analogy border rounded-xl p-4">
            <h3 class="text-sm sm:text-base font-bold theme-analogy-title mb-1.5">${escapeHtml(mod.kidAnalogyTitle)}</h3>
            <p class="text-xs sm:text-sm theme-analogy-body leading-relaxed whitespace-pre-line">${escapeHtml(mod.kidAnalogy)}</p>
          </div>
        </div>

        <!-- Guía Detallada de Anotaciones: Cuándo usarla, Dónde ponerla y Trampas -->
        <div>
          <h3 class="text-base sm:text-lg font-bold mb-3 flex items-center gap-2">
            <span>🏷️</span> Anotaciones de este Tema: ¿Cuándo usarlas y dónde colocarlas?
          </h3>
          <div class="grid grid-cols-1 gap-3.5">
            ${dictCardsHtml}
          </div>
        </div>

        <!-- Fragmentos de Código Exactos -->
        <div>
          <h3 class="text-base sm:text-lg font-bold mb-3 flex items-center gap-2">
            <span>📝</span> Plantillas de Código para el Examen
          </h3>
          ${snippetsHtml}
        </div>

        <!-- Trampas Mortales del Examen -->
        <div class="theme-trap border rounded-2xl p-5">
          <h3 class="text-base font-bold theme-trap-title mb-3">🛑 ¿Por qué se saca 0% en este tema? (Trampas a Evitar)</h3>
          <ul class="space-y-2.5">
            ${trapsHtml}
          </ul>
        </div>

        <!-- Botones de Acción para Evaluar este Tema -->
        <div class="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h4 class="font-bold text-base">¿Listo para memorizar las anotaciones de este tema?</h4>
            <p class="text-xs sm:text-sm theme-text-muted">Elige entrenar todas las preguntas de <strong>${escapeHtml(mod.title)}</strong> o enfocarte exclusivamente en sus anotaciones.</p>
          </div>
          <div class="flex flex-wrap gap-2 shrink-0">
            <button onclick="window.startQuizForModule('${mod.id}', 'annotation')"
              class="px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm shadow-lg transition-all">
              🏷️ Solo Anotaciones del Tema
            </button>
            <button onclick="window.startQuizForModule('${mod.id}', 'all-types')"
              class="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-lg transition-all">
              🎯 Evaluar Todo el Tema ➔
            </button>
          </div>
        </div>
      </div>
    `;
  }

  function renderQuizFilterSelect() {
    const sel = document.getElementById("quiz-filter-select");
    if (sel) {
      let html = `<option value="all" ${state.quizFilter === "all" ? "selected" : ""}>🌪️ Todos los 11 Objetivos Mezclados (${window.QUESTION_BANK.length} preguntas)</option>`;
      html += `<option value="wrong" ${state.quizFilter === "wrong" ? "selected" : ""}>🔥 Solo Preguntas Falladas (${state.wrongQueue.length} en cola)</option>`;
      window.STUDY_MODULES.forEach(m => {
        const count = window.QUESTION_BANK.filter(q => q.module === m.id).length;
        html += `<option value="${m.id}" ${state.quizFilter === m.id ? "selected" : ""}>Tema ${m.number}: ${escapeHtml(m.title)} (${count})</option>`;
      });
      sel.innerHTML = html;
    }

    const modeSel = document.getElementById("quiz-mode-select");
    if (modeSel) {
      modeSel.value = state.quizMode || "all-types";
    }

    const poolCounter = document.getElementById("quiz-pool-counter");
    if (poolCounter) {
      const pool = getFilteredPool();
      const masteredInPool = pool.filter(q => {
        const st = state.questionStats[q.id];
        return st && st.mastered && (!st.consecutiveCorrectNeeded || st.consecutiveCorrectNeeded <= 0);
      }).length;
      poolCounter.textContent = `Dominadas en este filtro: ${masteredInPool} / ${pool.length}`;
    }
  }

  function loadNextQuizQuestion() {
    answeredCurrent = false;
    renderQuizFilterSelect();
    currentQuestion = pickNextQuestion();

    const mod = window.STUDY_MODULES.find(m => m.id === currentQuestion.module);
    const rawOptions = currentQuestion.options.map((text, idx) => ({
      text: text,
      isCorrect: idx === currentQuestion.correct
    }));
    currentOptions = shuffleArray(rawOptions);

    const badgeContainer = document.getElementById("quiz-question-badges");
    let categoryLabel = "💻 Código y Propiedades";
    let categoryStyle = "bg-emerald-500/15 text-emerald-600 border-emerald-500/30";
    if (currentQuestion.category === "annotation") {
      categoryLabel = "🏷️ Sintaxis de Anotación";
      categoryStyle = "bg-indigo-500/15 text-indigo-600 border-indigo-500/30";
    } else if (currentQuestion.category === "when") {
      categoryLabel = "🧭 ¿Cuándo Usar Qué Anotación?";
      categoryStyle = "bg-amber-500/15 text-amber-600 border-amber-500/30";
    }

    let badgesHtml = `
      <span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-600 border border-blue-500/30">
        ${mod ? "Tema " + mod.number + ": " + escapeHtml(mod.title) : "General"}
      </span>
      <span class="px-2.5 py-1 rounded-full text-xs font-bold border ${categoryStyle}">
        ${categoryLabel}
      </span>
    `;
    if (currentQuestion.isSpacedReview || state.wrongQueue.includes(currentQuestion.id)) {
      const st = state.questionStats[currentQuestion.id];
      const needed = st ? st.consecutiveCorrectNeeded : 1;
      badgesHtml += `
        <span class="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-600 border border-rose-500/40 animate-pulse">
          🔁 REFUERZO DE ANOTACIÓN FALLADA (Acierta ${needed}x más para dominarla)
        </span>
      `;
    }
    badgeContainer.innerHTML = badgesHtml;

    document.getElementById("quiz-question-text").textContent = currentQuestion.question;

    const codeBlock = document.getElementById("quiz-question-code");
    if (currentQuestion.code) {
      codeBlock.style.display = "block";
      codeBlock.querySelector("code").textContent = currentQuestion.code;
    } else {
      codeBlock.style.display = "none";
    }

    const optionsContainer = document.getElementById("quiz-options-list");
    const letters = ["A", "B", "C", "D"];
    optionsContainer.innerHTML = currentOptions.map((opt, idx) => `
      <button id="quiz-opt-${idx}" onclick="window.submitQuizAnswer(${idx})"
        class="w-full text-left p-4 rounded-xl border theme-subtle hover:border-blue-500 transition-all flex items-start gap-3 group">
        <span class="w-7 h-7 rounded-lg theme-card border font-bold text-xs flex items-center justify-center shrink-0 group-hover:border-blue-500 group-hover:text-blue-600">
          ${letters[idx]}
        </span>
        <code class="text-xs sm:text-sm font-mono break-words leading-relaxed">${escapeHtml(opt.text)}</code>
      </button>
    `).join("");

    document.getElementById("quiz-feedback-box").classList.add("hidden");
  }

  window.submitQuizAnswer = function (selectedIdx) {
    if (answeredCurrent) return;
    answeredCurrent = true;

    const chosen = currentOptions[selectedIdx];
    const isCorrect = chosen.isCorrect;
    const qId = currentQuestion.id;

    state.totalAnswered++;

    if (!state.questionStats[qId]) {
      state.questionStats[qId] = { wrongCount: 0, consecutiveCorrectNeeded: 0, mastered: false, attempts: 0, correctCount: 0 };
    }
    const qStat = state.questionStats[qId];
    qStat.attempts = (qStat.attempts || 0) + 1;
    qStat.lastAttemptAt = new Date().toISOString();

    if (isCorrect) {
      state.totalCorrect++;
      qStat.correctCount = (qStat.correctCount || 0) + 1;
      state.streak++;
      if (state.streak > state.bestStreak) state.bestStreak = state.streak;
      state.xp += 15;

      if (qStat.consecutiveCorrectNeeded > 0) {
        qStat.consecutiveCorrectNeeded--;
        if (qStat.consecutiveCorrectNeeded === 0) {
          qStat.mastered = true;
          if (!qStat.passedAtAttempt) qStat.passedAtAttempt = qStat.attempts;
          state.wrongQueue = state.wrongQueue.filter(id => id !== qId);
        }
      } else {
        qStat.mastered = true;
        if (!qStat.passedAtAttempt) qStat.passedAtAttempt = qStat.attempts;
      }
    } else {
      state.streak = 0;
      qStat.wrongCount++;
      qStat.mastered = false;
      qStat.passedAtAttempt = null;
      qStat.consecutiveCorrectNeeded = 2;
      if (!state.wrongQueue.includes(qId)) {
        state.wrongQueue.push(qId);
      }
    }

    saveState();
    renderTopStats();
    renderStudySidebar();
    renderQuizFilterSelect();

    currentOptions.forEach((opt, idx) => {
      const btn = document.getElementById("quiz-opt-" + idx);
      if (!btn) return;
      btn.disabled = true;
      if (opt.isCorrect) {
        btn.className = "w-full text-left p-4 rounded-xl border-2 border-emerald-500 bg-emerald-500/15 flex items-start gap-3";
      } else if (idx === selectedIdx && !opt.isCorrect) {
        btn.className = "w-full text-left p-4 rounded-xl border-2 border-rose-500 bg-rose-500/15 flex items-start gap-3";
      } else {
        btn.className = "w-full text-left p-4 rounded-xl border theme-subtle opacity-50 flex items-start gap-3";
      }
    });

    const fbBox = document.getElementById("quiz-feedback-box");
    fbBox.classList.remove("hidden");

    const statusHeader = isCorrect
      ? `<div class="text-emerald-600 font-bold text-base mb-1">✅ ¡Correcto! (+15 XP)</div>`
      : `<div class="text-rose-600 font-bold text-base mb-1">❌ Incorrecto — Agregada a tu Cola de Refuerzo (se repetirá hasta que la aciertes 2 veces seguidas)</div>`;

    fbBox.className = "mt-5 p-5 rounded-2xl border " + (isCorrect ? "bg-emerald-500/10 border-emerald-500/40" : "bg-rose-500/10 border-rose-500/40");
    fbBox.innerHTML = `
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div class="space-y-2">
          ${statusHeader}
          <p class="text-xs sm:text-sm leading-relaxed"><strong>Explicación técnica:</strong> ${escapeHtml(currentQuestion.explanation)}</p>
          <div class="p-3 rounded-xl theme-analogy border text-xs sm:text-sm theme-analogy-body">
            💡 <strong>Clave para memorizar:</strong> ${escapeHtml(currentQuestion.kidTip)}
          </div>
        </div>
        <div class="flex flex-col gap-2 shrink-0">
          <button onclick="window.nextQuestion()"
            class="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg transition-all">
            Siguiente Pregunta ➔
          </button>
          <button onclick="window.jumpToStudyModule('${currentQuestion.module}')"
            class="px-4 py-2 rounded-xl theme-card hover:opacity-80 text-xs font-semibold border transition-all">
            📖 Ver todas las anotaciones del tema
          </button>
        </div>
      </div>
    `;
  };

  window.nextQuestion = function () {
    loadNextQuizQuestion();
  };

  function getFilteredAnnotations() {
    const f = state.annotationTopicFilter || "all";
    if (f === "all") return window.ANNOTATION_DICTIONARY;
    return window.ANNOTATION_DICTIONARY.filter(a => a.module === f);
  }

  function renderAnnotationTopicSelect() {
    const sel = document.getElementById("fc-topic-filter");
    if (!sel) return;
    let html = `<option value="all" ${state.annotationTopicFilter === "all" ? "selected" : ""}>📚 Todos los Temas (${window.ANNOTATION_DICTIONARY.length} anotaciones)</option>`;
    window.STUDY_MODULES.forEach(m => {
      const c = window.ANNOTATION_DICTIONARY.filter(a => a.module === m.id).length;
      html += `<option value="${m.id}" ${state.annotationTopicFilter === m.id ? "selected" : ""}>Tema ${m.number}: ${escapeHtml(m.title)} (${c})</option>`;
    });
    sel.innerHTML = html;
  }

  function renderFlashcard() {
    renderAnnotationTopicSelect();
    const list = getFilteredAnnotations();
    if (list.length === 0) return;
    const idx = ((flashcardIndex % list.length) + list.length) % list.length;
    const item = list[idx];
    const mod = window.STUDY_MODULES.find(m => m.id === item.module);

    document.getElementById("fc-counter").textContent = "Tarjeta " + (idx + 1) + " de " + list.length;
    document.getElementById("fc-module").textContent = mod ? "Tema " + mod.number + ": " + mod.title : item.module;
    document.getElementById("fc-where-badge").textContent = "📍 Se coloca: " + item.targetPlace;
    document.getElementById("fc-prompt").textContent = item.whenToUse;
    document.getElementById("fc-answer").textContent = item.annotation;
    document.getElementById("fc-where-detail").textContent = item.targetPlace;
    document.getElementById("fc-attributes-detail").textContent = item.attributes;
    document.getElementById("fc-trap-detail").textContent = item.trapOrVs;
    document.getElementById("fc-example-code").textContent = item.example;

    const answerBox = document.getElementById("fc-answer-container");
    if (flashcardFlipped) {
      answerBox.classList.remove("hidden");
    } else {
      answerBox.classList.add("hidden");
    }
  }

  window.renderAnnotationTable = function () {
    const grid = document.getElementById("annotation-dictionary-grid");
    const countEl = document.getElementById("annotation-table-count");
    const searchInput = document.getElementById("annotation-search-input");
    if (!grid) return;

    const query = searchInput ? searchInput.value.trim().toLowerCase() : "";
    let list = getFilteredAnnotations();
    if (query) {
      list = list.filter(a =>
        a.annotation.toLowerCase().includes(query) ||
        a.whenToUse.toLowerCase().includes(query) ||
        a.targetPlace.toLowerCase().includes(query) ||
        a.attributes.toLowerCase().includes(query) ||
        a.trapOrVs.toLowerCase().includes(query)
      );
    }

    if (countEl) {
      countEl.textContent = `Mostrando ${list.length} anotaciones`;
    }

    grid.innerHTML = list.map(a => {
      const mod = window.STUDY_MODULES.find(m => m.id === a.module);
      return `
        <div class="theme-card border rounded-2xl p-5 shadow-sm flex flex-col justify-between space-y-3">
          <div class="space-y-2.5">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <span class="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-600">
                ${mod ? "Tema " + mod.number + ": " + escapeHtml(mod.title) : a.module}
              </span>
              <span class="text-xs font-semibold px-2.5 py-0.5 rounded-full theme-subtle border">
                📍 ${escapeHtml(a.targetPlace)}
              </span>
            </div>

            <div class="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <code class="text-xs sm:text-sm font-mono font-bold text-emerald-300 break-words">${escapeHtml(a.annotation)}</code>
            </div>

            <p class="text-xs sm:text-sm leading-relaxed">
              <strong class="text-indigo-600">🧭 ¿Cuándo usarla?:</strong> ${escapeHtml(a.whenToUse)}
            </p>

            <p class="text-xs theme-text-muted">
              <strong>⚙️ Atributos:</strong> ${escapeHtml(a.attributes)}
            </p>

            <div class="p-2.5 rounded-xl theme-trap border text-xs theme-trap-body">
              <strong>⚠️ Ojo en el examen:</strong> ${escapeHtml(a.trapOrVs)}
            </div>
          </div>

          <div class="bg-slate-900 border border-slate-800 rounded-xl p-3">
            <pre class="text-xs text-amber-300 font-mono overflow-x-auto"><code>${escapeHtml(a.example)}</code></pre>
          </div>
        </div>
      `;
    }).join("");
  };

  window.switchAnnotationView = function (view) {
    state.annotationSubView = view;
    saveState();
    const cardsView = document.getElementById("annotation-view-cards");
    const tableView = document.getElementById("annotation-view-table");
    const btnCards = document.getElementById("subtab-btn-cards");
    const btnTable = document.getElementById("subtab-btn-table");

    if (cardsView && tableView) {
      cardsView.classList.toggle("hidden", view !== "cards");
      tableView.classList.toggle("hidden", view !== "table");
    }
    if (btnCards && btnTable) {
      btnCards.className = view === "cards"
        ? "px-4 py-2 rounded-xl font-bold text-xs sm:text-sm bg-indigo-600 text-white shadow transition-all"
        : "px-4 py-2 rounded-xl font-semibold text-xs sm:text-sm theme-subtle border hover:opacity-85 transition-all";
      btnTable.className = view === "table"
        ? "px-4 py-2 rounded-xl font-bold text-xs sm:text-sm bg-indigo-600 text-white shadow transition-all"
        : "px-4 py-2 rounded-xl font-semibold text-xs sm:text-sm theme-subtle border hover:opacity-85 transition-all";
    }
    if (view === "table") {
      window.renderAnnotationTable();
    } else {
      renderFlashcard();
    }
  };

  window.onAnnotationTopicFilter = function (topicId) {
    state.annotationTopicFilter = topicId;
    flashcardIndex = 0;
    flashcardFlipped = false;
    saveState();
    renderFlashcard();
    window.renderAnnotationTable();
  };

  window.toggleFlashcard = function () {
    flashcardFlipped = !flashcardFlipped;
    renderFlashcard();
  };

  window.nextFlashcard = function (delta) {
    flashcardFlipped = false;
    const list = getFilteredAnnotations();
    if (list.length === 0) return;
    flashcardIndex = (flashcardIndex + delta + list.length) % list.length;
    renderFlashcard();
  };

  window.switchTab = function (tabName) {
    ["study", "quiz", "flashcards", "progress"].forEach(t => {
      const sec = document.getElementById("tab-section-" + t);
      const btn = document.getElementById("tab-btn-" + t);
      if (sec) sec.classList.toggle("hidden", t !== tabName);
      if (btn) {
        btn.className = t === tabName
          ? "px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-blue-600 text-white shadow-md transition-all flex items-center gap-2"
          : "px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm theme-card border hover:opacity-90 transition-all flex items-center gap-2";
      }
    });
    if (tabName === "quiz" && !currentQuestion) {
      loadNextQuizQuestion();
    }
    if (tabName === "flashcards") {
      window.switchAnnotationView(state.annotationSubView || "cards");
    }
    if (tabName === "progress") {
      window.refreshProgressDashboard();
    }
  };

  window.selectStudyModule = function (modId) {
    state.selectedModuleId = modId;
    saveState();
    renderStudySidebar();
    renderStudyDetail();
  };

  window.startQuizForModule = function (modId, quizMode) {
    state.quizFilter = modId;
    if (quizMode) {
      state.quizMode = quizMode;
    }
    saveState();
    window.switchTab("quiz");
    loadNextQuizQuestion();
  };

  window.jumpToStudyModule = function (modId) {
    state.selectedModuleId = modId;
    saveState();
    renderStudySidebar();
    renderStudyDetail();
    window.switchTab("study");
  };

  window.onQuizFilterChange = function (newFilter) {
    if (newFilter === "wrong" && state.wrongQueue.length === 0) {
      alert("¡Felicidades! No tienes preguntas falladas pendientes en tu Cola de Refuerzo.");
      renderQuizFilterSelect();
      return;
    }
    state.quizFilter = newFilter;
    saveState();
    loadNextQuizQuestion();
  };

  window.onQuizModeChange = function (newMode) {
    state.quizMode = newMode;
    saveState();
    loadNextQuizQuestion();
  };

  window.resetTrainerProgress = function () {
    const keepTheme = state.theme;
    state = JSON.parse(JSON.stringify(defaultState));
    state.theme = keepTheme;
    saveState();
    renderTopStats();
    renderStudySidebar();
    renderStudyDetail();
    loadNextQuizQuestion();
  };

  let cloudProfilesCache = [];
  let inspectedProfileCode = null;

  function classifyQuestionStat(st) {
    if (!st) return "unseen";
    const wrong = st.wrongCount || 0;
    if (st.mastered) {
      return wrong === 0 ? "first" : "recovered";
    }
    return wrong > 0 ? "failing" : "unseen";
  }

  function summarizeProgressState(targetState) {
    const qStats = (targetState && targetState.questionStats) || {};
    let first = 0;
    let recovered = 0;
    let failing = 0;
    const modStats = {};
    window.STUDY_MODULES.forEach(m => {
      modStats[m.id] = { total: 0, first: 0, recovered: 0, failing: 0 };
    });

    window.QUESTION_BANK.forEach(q => {
      if (!modStats[q.module]) return;
      modStats[q.module].total++;
      const status = classifyQuestionStat(qStats[q.id]);
      if (status === "first") {
        first++;
        modStats[q.module].first++;
      } else if (status === "recovered") {
        recovered++;
        modStats[q.module].recovered++;
      } else if (status === "failing") {
        failing++;
        modStats[q.module].failing++;
      }
    });

    const advancedTopics = Object.values(modStats).filter(m => m.first + m.recovered > 0).length;
    const answered = (targetState && targetState.totalAnswered) || 0;
    const correct = (targetState && targetState.totalCorrect) || 0;
    const acc = answered > 0 ? Math.round((correct / answered) * 100) : 0;

    return { first, recovered, failing, modStats, advancedTopics, acc, xp: (targetState && targetState.xp) || 0 };
  }

  function getInspectedStateAndLabel() {
    if (inspectedProfileCode) {
      const found = cloudProfilesCache.find(p => p.code === inspectedProfileCode);
      if (found && found.state) {
        return { label: `(${found.code})`, targetState: found.state };
      }
    }
    const localCode = getSyncCode();
    return { label: localCode ? `(${localCode} - actual)` : "(Sesión local actual)", targetState: state };
  }

  function populateProgressModuleFilter() {
    const sel = document.getElementById("progress-filter-module");
    if (!sel || sel.options.length > 1) return;
    window.STUDY_MODULES.forEach(m => {
      const opt = document.createElement("option");
      opt.value = m.id;
      opt.textContent = `${m.icon} ${m.title}`;
      sel.appendChild(opt);
    });
  }

  window.renderProgressQuestionTable = function () {
    const tbody = document.getElementById("progress-questions-tbody");
    if (!tbody) return;
    populateProgressModuleFilter();

    const statusFilter = (document.getElementById("progress-filter-status") || {}).value || "answered";
    const modFilter = (document.getElementById("progress-filter-module") || {}).value || "all";
    const { targetState } = getInspectedStateAndLabel();
    const qStats = (targetState && targetState.questionStats) || {};

    const modMap = {};
    window.STUDY_MODULES.forEach(m => { modMap[m.id] = `${m.icon} ${m.title}`; });

    const rows = [];
    window.QUESTION_BANK.forEach(q => {
      if (modFilter !== "all" && q.module !== modFilter) return;
      const st = qStats[q.id];
      const status = classifyQuestionStat(st);
      if (status === "unseen") return;
      if (statusFilter !== "answered" && status !== statusFilter) return;

      const wrong = st.wrongCount || 0;
      const attempts = st.attempts || (wrong + (st.mastered ? 1 : 0));
      let badge = "";
      if (status === "first") {
        badge = `<span class="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 border border-emerald-500/30">✅ Superada 1er intento</span>`;
      } else if (status === "recovered") {
        const at = st.passedAtAttempt || attempts;
        badge = `<span class="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/15 text-amber-600 border border-amber-500/30">🔄 Reconsiderada (${at}º intento)</span>`;
      } else {
        const needed = st.consecutiveCorrectNeeded || 2;
        badge = `<span class="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500/15 text-rose-600 border border-rose-500/30">❌ Fallada (faltan ${needed})</span>`;
      }

      rows.push(`
        <tr class="hover:opacity-90">
          <td class="py-2.5 pr-3 font-mono text-xs theme-text-muted whitespace-nowrap">${escapeHtml(q.id)}</td>
          <td class="py-2.5 px-3 text-xs font-semibold whitespace-nowrap">${escapeHtml(modMap[q.module] || q.module)}</td>
          <td class="py-2.5 px-3 text-xs max-w-md">${escapeHtml(q.question.slice(0, 120))}${q.question.length > 120 ? "..." : ""}</td>
          <td class="py-2.5 px-3 text-center font-bold text-xs">${attempts}</td>
          <td class="py-2.5 px-3 text-center font-bold text-xs text-rose-500">${wrong}</td>
          <td class="py-2.5 pl-3 whitespace-nowrap">${badge}</td>
        </tr>
      `);
    });

    tbody.innerHTML = rows.length
      ? rows.join("")
      : `<tr><td colspan="6" class="py-6 text-center text-xs theme-text-muted">No hay preguntas registradas con este filtro todavía.</td></tr>`;
  };

  function renderProgressModulesTable() {
    const tbody = document.getElementById("progress-modules-tbody");
    const labelEl = document.getElementById("progress-active-code-label");
    if (!tbody) return;

    const { label, targetState } = getInspectedStateAndLabel();
    if (labelEl) labelEl.textContent = label;

    const summary = summarizeProgressState(targetState);
    tbody.innerHTML = window.STUDY_MODULES.map(m => {
      const ms = summary.modStats[m.id] || { total: 0, first: 0, recovered: 0, failing: 0 };
      const masteredTotal = ms.first + ms.recovered;
      const pct = ms.total > 0 ? Math.round((masteredTotal / ms.total) * 100) : 0;
      return `
        <tr>
          <td class="py-2.5 pr-3 font-semibold text-xs sm:text-sm">${m.icon} ${escapeHtml(m.title)}</td>
          <td class="py-2.5 px-3 text-center text-xs font-bold">${ms.total}</td>
          <td class="py-2.5 px-3 text-center text-xs font-bold text-emerald-600">${ms.first}</td>
          <td class="py-2.5 px-3 text-center text-xs font-bold text-amber-600">${ms.recovered}</td>
          <td class="py-2.5 px-3 text-center text-xs font-bold text-rose-600">${ms.failing}</td>
          <td class="py-2.5 px-3 min-w-[120px]">
            <div class="flex items-center gap-2">
              <div class="w-full h-2 rounded-full theme-subtle overflow-hidden">
                <div class="h-full bg-emerald-500" style="width:${pct}%"></div>
              </div>
              <span class="text-xs font-bold w-9 text-right">${pct}%</span>
            </div>
          </td>
          <td class="py-2.5 pl-3 text-right">
            <button onclick="window.onQuizFilterChange('${m.id}'); window.switchTab('quiz');"
              class="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold">
              Practicar
            </button>
          </td>
        </tr>
      `;
    }).join("");

    window.renderProgressQuestionTable();
  }

  window.selectProgressProfile = function (code) {
    inspectedProfileCode = code;
    renderProgressModulesTable();
  };

  window.loadProfileIntoCurrent = function (code) {
    setSyncCode(code);
    const url = new URL(location.href);
    url.searchParams.set("sync", code);
    history.replaceState(null, "", url.toString());
    inspectedProfileCode = null;
    pullCloudState(true).then(() => window.refreshProgressDashboard());
  };

  window.refreshProgressDashboard = async function () {
    const tbody = document.getElementById("progress-codes-tbody");
    if (tbody) {
      tbody.innerHTML = `<tr><td colspan="8" class="py-4 text-center text-xs theme-text-muted">Cargando códigos desde Netlify Blobs...</td></tr>`;
    }
    try {
      const res = await fetch("/api/progress?list=1");
      if (res.ok) {
        const data = await res.json();
        cloudProfilesCache = (data.profiles || []).filter(p => p.state);
      }
    } catch (e) {
      cloudProfilesCache = [];
    }

    if (tbody) {
      const activeCode = getSyncCode();
      if (cloudProfilesCache.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="py-4 text-center text-xs theme-text-muted">No hay códigos guardados en la nube todavía. Usa el botón ☁️ Sync arriba para registrar uno.</td></tr>`;
      } else {
        tbody.innerHTML = cloudProfilesCache.map(p => {
          const s = summarizeProgressState(p.state);
          const dateStr = p.updatedAt ? new Date(p.updatedAt).toLocaleString() : "-";
          const isCurrent = p.code === activeCode;
          return `
            <tr class="${isCurrent ? "bg-indigo-500/10" : ""}">
              <td class="py-2.5 pr-3 font-mono font-bold text-xs sm:text-sm">
                ${escapeHtml(p.code)} ${isCurrent ? '<span class="ml-1 text-[10px] px-1.5 py-0.5 rounded bg-indigo-600 text-white">activo</span>' : ""}
              </td>
              <td class="py-2.5 px-3 text-xs font-semibold">${s.xp} XP · ${s.acc}%</td>
              <td class="py-2.5 px-3 text-xs font-bold text-emerald-600">${s.first}</td>
              <td class="py-2.5 px-3 text-xs font-bold text-amber-600">${s.recovered}</td>
              <td class="py-2.5 px-3 text-xs font-bold text-rose-600">${s.failing}</td>
              <td class="py-2.5 px-3 text-xs font-semibold">${s.advancedTopics} / ${window.STUDY_MODULES.length}</td>
              <td class="py-2.5 px-3 text-xs theme-text-muted whitespace-nowrap">${escapeHtml(dateStr)}</td>
              <td class="py-2.5 pl-3 text-right whitespace-nowrap space-x-1">
                <button onclick="window.selectProgressProfile('${escapeHtml(p.code)}')"
                  class="px-2.5 py-1 rounded-lg theme-subtle border text-xs font-semibold hover:opacity-80">Ver tabla</button>
                ${!isCurrent ? `<button onclick="window.loadProfileIntoCurrent('${escapeHtml(p.code)}')" class="px-2.5 py-1 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500">Usar</button>` : ""}
              </td>
            </tr>
          `;
        }).join("");
      }
    }

    renderProgressModulesTable();
  };

  window.configureCloudSync = function () {
    const current = getSyncCode();
    const shareUrl = current ? `${location.origin}${location.pathname}?sync=${current}` : "";
    const msg = current
      ? `Código actual: ${current}\n\nPara abrir en tu teléfono/laptop/desktop usa:\n${shareUrl}\n\nEscribe un nuevo código (mín. 3 caracteres, o déjalo vacío para desconectar):`
      : `Escribe un código personal para guardar y sincronizar tu progreso en la nube sin login (ej. carlos-ex378):`;
    const input = window.prompt(msg, current || "carlos-ex378");
    if (input === null) return;
    const clean = setSyncCode(input);
    if (!clean) {
      updateSyncBadge();
      const url = new URL(location.href);
      url.searchParams.delete("sync");
      history.replaceState(null, "", url.toString());
      return;
    }
    const url = new URL(location.href);
    url.searchParams.set("sync", clean);
    history.replaceState(null, "", url.toString());
    pullCloudState(true);
  };

  window.addEventListener("DOMContentLoaded", function () {
    const params = new URLSearchParams(location.search);
    const urlSync = sanitizeSyncCode(params.get("sync"));
    if (urlSync) {
      setSyncCode(urlSync);
    }
    applyTheme();
    renderTopStats();
    renderStudySidebar();
    renderStudyDetail();
    loadNextQuizQuestion();
    renderFlashcard();
    window.renderAnnotationTable();
    updateSyncBadge();
    if (getSyncCode()) {
      pullCloudState(Boolean(urlSync));
    }
  });
})();
