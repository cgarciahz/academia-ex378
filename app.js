// Lógica Principal de Academia EX378: Estudio + Entrenador Infinito de Anotaciones + Modo Claro/Oscuro
(function () {
  const STORAGE_KEY = "ex378_trainer_state_v3";

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

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {}
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
      state.questionStats[qId] = { wrongCount: 0, consecutiveCorrectNeeded: 0, mastered: false };
    }
    const qStat = state.questionStats[qId];

    if (isCorrect) {
      state.totalCorrect++;
      state.streak++;
      if (state.streak > state.bestStreak) state.bestStreak = state.streak;
      state.xp += 15;

      if (qStat.consecutiveCorrectNeeded > 0) {
        qStat.consecutiveCorrectNeeded--;
        if (qStat.consecutiveCorrectNeeded === 0) {
          qStat.mastered = true;
          state.wrongQueue = state.wrongQueue.filter(id => id !== qId);
        }
      } else {
        qStat.mastered = true;
      }
    } else {
      state.streak = 0;
      qStat.wrongCount++;
      qStat.mastered = false;
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
    ["study", "quiz", "flashcards"].forEach(t => {
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

  window.addEventListener("DOMContentLoaded", function () {
    applyTheme();
    renderTopStats();
    renderStudySidebar();
    renderStudyDetail();
    loadNextQuizQuestion();
    renderFlashcard();
    window.renderAnnotationTable();
  });
})();
