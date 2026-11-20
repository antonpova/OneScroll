(() => {
  "use strict";

  const S = globalThis.OneScrollStats;
  const U = globalThis.OneScrollUI;
  const api = globalThis.browser ?? globalThis.chrome;
  const $ = (id) => document.getElementById(id);

  const PREFS_KEY = "onescroll-popup";
  let days = {};
  let range = "7";
  const heatState = { selected: null };

  try {
    range = JSON.parse(localStorage.getItem(PREFS_KEY) ?? "{}").range ?? range;
  } catch {}

  const renderToday = () => {
    const t = U.entry(days, S.dayKey());
    const count = $("today-count");
    count.textContent = U.fmt(t.b);
    count.classList.toggle("zero", t.b === 0);
    $("today-unit").textContent = t.b === 1 ? "scroll blocked" : "scrolls blocked";
    $("today-sub").textContent = `${U.dur(t.w)} watched · ${U.plural(t.o, "short", "shorts")}`;
    $("today-message").textContent = U.message(t.b);
  };

  const renderRange = () => {
    for (const btn of document.querySelectorAll(".tabs button")) {
      btn.setAttribute("aria-selected", String(btn.dataset.range === range));
    }
    const t = U.total(days, range);
    $("r-blocked").textContent = U.fmt(t.b);
    $("r-opened").textContent = U.fmt(t.o);
    $("r-watch").textContent = U.dur(t.w);
    $("r-streak").textContent = U.fmt(U.streak(days));
  };

  const renderHeat = () =>
    U.renderHeat({
      grid: $("heat-grid"),
      months: $("heat-months"),
      detail: $("heat-detail"),
      days,
      weeks: 24,
      step: 12.5,
      idleText: "Last 6 months",
      state: heatState,
    });

  const render = () => {
    renderToday();
    renderRange();
    renderHeat();
  };

  for (const btn of document.querySelectorAll(".tabs button")) {
    btn.addEventListener("click", () => {
      range = btn.dataset.range;
      try {
        localStorage.setItem(PREFS_KEY, JSON.stringify({ range }));
      } catch {}
      renderRange();
    });
  }

  // Full stats, export/import and reset live on their own page
  // (a file picker would close this popup).
  $("manage").addEventListener("click", () => {
    api.runtime.openOptionsPage();
    window.close();
  });

  api.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.days) {
      days = changes.days.newValue ?? {};
      render();
    }
  });

  S.load().then((d) => {
    days = d;
    render();
  });
})();
