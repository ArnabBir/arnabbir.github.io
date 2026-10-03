(() => {
  "use strict";

  const STORAGE_KEY = "sdm-practice-attempts-v1";
  const competencies = [
    ["framing", "Framing and scope", "Requirements, exclusions, assumptions, and priorities"],
    ["invariants", "Invariants and SLOs", "Correctness conditions and measurable targets"],
    ["estimation", "Estimation", "Scale estimates changed concrete design choices"],
    ["modeling", "API and data model", "Contracts, identifiers, states, and access patterns align"],
    ["architecture", "Baseline architecture", "A simple end-to-end path covers core requirements"],
    ["scaling", "Scaling and partitioning", "Bottlenecks, keys, skew, and growth triggers"],
    ["consistency", "Consistency and idempotency", "Guarantees are operation-specific and retries are safe"],
    ["reliability", "Reliability and recovery", "Overload, dependency failures, repair, and rebuild paths"],
    ["operations", "Security and operations", "Threats, SLIs, alerts, rollout, and incident response"],
    ["tradeoffs", "Tradeoff communication", "Alternatives are compared and complexity is justified"]
  ];

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function init() {
    document.querySelectorAll("[data-practice-console]").forEach((root) => {
      if (root.dataset.ready) return;
      root.dataset.ready = "true";
      root.querySelector("[data-tool-loading]")?.remove();
      buildConsole(root);
    });
  }

  function buildConsole(root) {
    const originalTitle = document.title;
    let duration = 30 * 60;
    let remaining = duration;
    let running = false;
    let deadline = 0;
    let interval = null;
    let ownedTitle = null;

    const header = element("div", "sdm-tool-header");
    const intro = element("div");
    intro.append(element("p", "sdm-kicker", "DELIBERATE PRACTICE"), element("h2", "", "One attempt. Observable evidence."), element("p", "", "Run the clock, score what you demonstrated, and save the smallest useful reflection."));
    const privacy = element("p", "sdm-local-badge", "LOCAL ONLY");
    header.append(intro, privacy);

    const workspace = element("div", "sdm-practice-grid");
    const timerPanel = element("section", "sdm-console-panel sdm-timer-panel");
    timerPanel.setAttribute("aria-labelledby", "practice-timer-title");
    const timerTitle = element("h3", "", "Session timer");
    timerTitle.id = "practice-timer-title";
    const durationGroup = element("div", "sdm-segmented sdm-duration-options");
    durationGroup.setAttribute("role", "group");
    durationGroup.setAttribute("aria-label", "Session duration");
    [15, 30, 45, 60].forEach((minutes) => {
      const button = element("button", minutes === 30 ? "is-active" : "", `${minutes} min`);
      button.type = "button";
      button.dataset.minutes = String(minutes);
      button.setAttribute("aria-pressed", String(minutes === 30));
      durationGroup.append(button);
    });
    const clock = element("output", "sdm-clock", "30:00");
    clock.setAttribute("aria-label", "30 minutes remaining");
    const timerStatus = element("p", "sdm-timer-status", "Ready");
    timerStatus.setAttribute("aria-live", "polite");
    const timerActions = element("div", "sdm-timer-actions");
    const start = element("button", "sdm-button sdm-button--primary", "Start");
    const pause = element("button", "sdm-button", "Pause");
    const reset = element("button", "sdm-button", "Reset");
    [start, pause, reset].forEach((button) => { button.type = "button"; });
    pause.disabled = true;
    timerActions.append(start, pause, reset);
    timerPanel.append(timerTitle, durationGroup, clock, timerStatus, timerActions);

    const promptPanel = element("section", "sdm-console-panel");
    promptPanel.setAttribute("aria-labelledby", "practice-brief-title");
    const briefTitle = element("h3", "", "Attempt brief");
    briefTitle.id = "practice-brief-title";
    const promptField = field("Practice prompt", "text", "e.g. Design a notification system", "practice-prompt");
    promptField.input.maxLength = 160;
    const notesField = field("Highest-leverage reflection", "textarea", "Best decision, largest gap, and one change for the next attempt", "practice-notes");
    notesField.input.maxLength = 1000;
    promptPanel.append(briefTitle, promptField.group, notesField.group);
    workspace.append(timerPanel, promptPanel);

    const scorePanel = element("section", "sdm-console-panel sdm-score-panel");
    scorePanel.setAttribute("aria-labelledby", "practice-score-title");
    const scoreHeading = element("div", "sdm-score-heading");
    const scoreTitleWrap = element("div");
    const scoreTitle = element("h3", "", "Evidence score");
    scoreTitle.id = "practice-score-title";
    scoreTitleWrap.append(scoreTitle, element("p", "", "0 missing, 1 weak, 2 adequate, 3 strong, 4 exceptional"));
    const total = element("output", "sdm-total-score", "0 / 40");
    total.setAttribute("aria-live", "polite");
    scoreHeading.append(scoreTitleWrap, total);
    const scoreGrid = element("div", "sdm-score-grid");
    const scoreInputs = new Map();
    competencies.forEach(([key, label, description]) => {
      const item = element("div", "sdm-score-item");
      const copy = element("div");
      const labelNode = element("label", "", label);
      labelNode.htmlFor = `practice-score-${key}`;
      copy.append(labelNode, element("small", "", description));
      const select = document.createElement("select");
      select.id = `practice-score-${key}`;
      select.name = key;
      select.setAttribute("aria-label", `${label} score`);
      for (let score = 0; score <= 4; score += 1) {
        const option = document.createElement("option");
        option.value = String(score);
        option.textContent = String(score);
        select.append(option);
      }
      item.append(copy, select);
      scoreGrid.append(item);
      scoreInputs.set(key, select);
    });
    scorePanel.append(scoreHeading, scoreGrid);

    const finishPanel = element("section", "sdm-console-panel sdm-finish-panel");
    finishPanel.setAttribute("aria-labelledby", "practice-finish-title");
    const finishTitle = element("h3", "", "Close the loop");
    finishTitle.id = "practice-finish-title";
    const confidenceLabel = element("label", "", "Confidence in this self-assessment");
    confidenceLabel.htmlFor = "practice-confidence";
    const confidenceRow = element("div", "sdm-confidence-row");
    const confidence = document.createElement("input");
    confidence.type = "range";
    confidence.id = "practice-confidence";
    confidence.min = "1";
    confidence.max = "5";
    confidence.step = "1";
    confidence.value = "3";
    const confidenceValue = element("output", "", "3 / 5");
    confidenceValue.htmlFor = confidence.id;
    confidenceRow.append(confidence, confidenceValue);
    const save = element("button", "sdm-button sdm-button--primary", "Save attempt");
    save.type = "button";
    const saveStatus = element("p", "sdm-save-status");
    saveStatus.setAttribute("role", "status");
    finishPanel.append(finishTitle, confidenceLabel, confidenceRow, save, saveStatus);

    const insights = element("section", "sdm-console-panel sdm-insights");
    insights.setAttribute("aria-labelledby", "practice-insights-title");
    const insightsTitle = element("h3", "", "Weakness summary");
    insightsTitle.id = "practice-insights-title";
    const weakness = element("div", "sdm-weakness-copy");
    insights.append(insightsTitle, weakness);

    const historyPanel = element("section", "sdm-console-panel sdm-history-panel");
    historyPanel.setAttribute("aria-labelledby", "practice-history-title");
    const historyHeading = element("div", "sdm-history-heading");
    const historyTitle = element("h3", "", "Attempt history");
    historyTitle.id = "practice-history-title";
    const historyActions = element("div", "sdm-tool-actions");
    const exportButton = element("button", "sdm-button", "Export JSON");
    const clearButton = element("button", "sdm-button sdm-button--danger", "Clear history");
    exportButton.type = "button";
    clearButton.type = "button";
    historyActions.append(exportButton, clearButton);
    historyHeading.append(historyTitle, historyActions);
    const history = element("div", "sdm-history-list");
    historyPanel.append(historyHeading, history);

    root.append(header, workspace, scorePanel, finishPanel, insights, historyPanel);

    function updateClock() {
      const minutes = Math.floor(remaining / 60);
      const seconds = remaining % 60;
      clock.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
      clock.setAttribute("aria-label", `${minutes} minutes ${seconds} seconds remaining`);
      if (running) {
        ownedTitle = `${clock.textContent} | ${originalTitle}`;
        document.title = ownedTitle;
      } else {
        if (document.title === ownedTitle) document.title = originalTitle;
        ownedTitle = null;
      }
    }

    function stopTimer(message) {
      running = false;
      clearInterval(interval);
      interval = null;
      start.disabled = remaining === 0;
      pause.disabled = true;
      durationGroup.querySelectorAll("button").forEach((button) => { button.disabled = false; });
      timerStatus.textContent = message;
      updateClock();
    }

    function tick() {
      if (!root.isConnected) {
        clearInterval(interval);
        if (document.title === ownedTitle) document.title = originalTitle;
        ownedTitle = null;
        return;
      }
      remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      updateClock();
      if (remaining === 0) stopTimer("Time is up. Capture evidence, not excuses.");
    }

    durationGroup.addEventListener("click", (event) => {
      const button = event.target.closest("button[data-minutes]");
      if (!button || running) return;
      duration = Number(button.dataset.minutes) * 60;
      remaining = duration;
      durationGroup.querySelectorAll("button").forEach((candidate) => {
        const active = candidate === button;
        candidate.classList.toggle("is-active", active);
        candidate.setAttribute("aria-pressed", String(active));
      });
      timerStatus.textContent = "Ready";
      start.disabled = false;
      updateClock();
    });

    start.addEventListener("click", () => {
      if (running || remaining === 0) return;
      running = true;
      deadline = Date.now() + remaining * 1000;
      start.disabled = true;
      pause.disabled = false;
      durationGroup.querySelectorAll("button").forEach((button) => { button.disabled = true; });
      timerStatus.textContent = "Session in progress";
      interval = setInterval(tick, 250);
      tick();
    });

    pause.addEventListener("click", () => {
      if (!running) return;
      remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      stopTimer("Paused");
    });

    reset.addEventListener("click", () => {
      remaining = duration;
      stopTimer("Ready");
      start.disabled = false;
    });

    const updateTotal = () => {
      const score = [...scoreInputs.values()].reduce((sum, input) => sum + Number(input.value), 0);
      total.textContent = `${score} / ${competencies.length * 4}`;
    };
    scoreGrid.addEventListener("change", updateTotal);
    confidence.addEventListener("input", () => { confidenceValue.textContent = `${confidence.value} / 5`; });

    save.addEventListener("click", () => {
      const prompt = promptField.input.value.trim();
      if (!prompt) {
        saveStatus.textContent = "Add a practice prompt before saving.";
        promptField.input.focus();
        return;
      }
      const scores = Object.fromEntries([...scoreInputs].map(([key, input]) => [key, Number(input.value)]));
      const attempts = readAttempts();
      attempts.unshift({
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        savedAt: new Date().toISOString(),
        prompt,
        durationMinutes: duration / 60,
        notes: notesField.input.value.trim(),
        confidence: Number(confidence.value),
        scores,
        total: Object.values(scores).reduce((sum, score) => sum + score, 0)
      });
      const persistedAttempts = capAttempts(attempts);
      if (writeAttempts(persistedAttempts)) {
        saveStatus.textContent = "Attempt saved in this browser.";
        renderHistory(history, weakness, persistedAttempts);
      } else {
        saveStatus.textContent = "Local storage is unavailable.";
      }
    });

    exportButton.addEventListener("click", () => {
      const attempts = readAttempts();
      const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), version: 1, attempts }, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `system-design-practice-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.append(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    });

    clearButton.addEventListener("click", () => {
      if (!readAttempts().length) return;
      if (!window.confirm("Clear all locally saved practice attempts? This cannot be undone.")) return;
      try {
        localStorage.removeItem(STORAGE_KEY);
        if (localStorage.getItem(STORAGE_KEY) !== null) throw new Error("Storage key was not removed");
        renderHistory(history, weakness, []);
        saveStatus.textContent = "Attempt history cleared.";
      } catch (_) {
        saveStatus.textContent = "Attempt history could not be cleared because local storage is unavailable.";
      }
    });

    updateClock();
    updateTotal();
    renderHistory(history, weakness, readAttempts());
  }

  function field(labelText, type, placeholder, id) {
    const group = element("div", "sdm-field");
    const label = element("label", "", labelText);
    label.htmlFor = id;
    const input = type === "textarea" ? document.createElement("textarea") : document.createElement("input");
    if (type !== "textarea") input.type = type;
    input.id = id;
    input.placeholder = placeholder;
    group.append(label, input);
    return { group, input };
  }

  function readAttempts() {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      return Array.isArray(value) ? value.filter(validAttempt) : [];
    } catch (_) {
      return [];
    }
  }

  function validAttempt(attempt) {
    if (!attempt || typeof attempt !== "object" || Array.isArray(attempt)) return false;
    if (typeof attempt.id !== "string" || !attempt.id || attempt.id.length > 100 || typeof attempt.prompt !== "string" || !attempt.prompt.trim() || attempt.prompt.length > 160) return false;
    if (typeof attempt.notes !== "string" || attempt.notes.length > 1000 || typeof attempt.savedAt !== "string" || !Number.isFinite(Date.parse(attempt.savedAt))) return false;
    if (![15, 30, 45, 60].includes(attempt.durationMinutes) || !Number.isInteger(attempt.confidence) || attempt.confidence < 1 || attempt.confidence > 5) return false;
    if (!attempt.scores || typeof attempt.scores !== "object" || Array.isArray(attempt.scores)) return false;
    const scores = competencies.map(([key]) => attempt.scores[key]);
    if (scores.some((score) => !Number.isInteger(score) || score < 0 || score > 4)) return false;
    return Number.isInteger(attempt.total) && attempt.total === scores.reduce((sum, score) => sum + score, 0);
  }

  function writeAttempts(attempts) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(attempts));
      return true;
    } catch (_) {
      return false;
    }
  }

  function capAttempts(attempts) {
    return attempts.slice(0, 100);
  }

  function renderHistory(container, weakness, attempts) {
    container.replaceChildren();
    weakness.replaceChildren();
    if (!attempts.length) {
      container.append(element("p", "sdm-empty-state", "No saved attempts yet. Finish one session and score the evidence you produced."));
      weakness.append(element("p", "", "Weaknesses appear after the first saved attempt. Repeated low scores matter more than one difficult prompt."));
      return;
    }

    const averages = competencies.map(([key, label]) => {
      const values = attempts.map((attempt) => Number(attempt.scores[key])).filter(Number.isFinite);
      const average = values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
      return { label, average };
    }).sort((a, b) => a.average - b.average);
    weakness.append(element("p", "", `Across ${attempts.length} saved attempt${attempts.length === 1 ? "" : "s"}, prioritize:`));
    const list = element("ol", "sdm-weakness-list");
    averages.slice(0, 3).forEach((item) => {
      list.append(element("li", "", `${item.label} - ${item.average.toFixed(1)} / 4 average`));
    });
    weakness.append(list, element("p", "sdm-assumption", "Use the trend as a practice signal, not an objective competency measurement."));

    attempts.forEach((attempt) => {
      const item = element("article", "sdm-history-item");
      const main = element("div");
      main.append(element("strong", "", attempt.prompt), element("span", "", new Date(attempt.savedAt).toLocaleString()));
      const result = element("div", "sdm-history-result");
      result.append(element("strong", "", `${Number(attempt.total) || 0} / ${competencies.length * 4}`), element("span", "", `${attempt.durationMinutes || "?"} min - confidence ${attempt.confidence || "?"}/5`));
      item.append(main, result);
      if (attempt.notes) item.append(element("p", "", attempt.notes));
      container.append(item);
    });
  }

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { capAttempts, validAttempt };
    return;
  }

  if (typeof document$ !== "undefined") document$.subscribe(init);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
