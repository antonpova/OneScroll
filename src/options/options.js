(() => {
  "use strict";

  const S = globalThis.OneScrollStats;
  const U = globalThis.OneScrollUI;
  const api = globalThis.browser ?? globalThis.chrome;
  const $ = (id) => document.getElementById(id);
  const FORMAT = 1;
  const PREFS_KEY = "onescroll-page";

  let days = {};
  let range = "30";
  let unit = "day";
  let pending = null; // sanitized days from the chosen import file
  const heatState = { selected: null };

  try {
    const p = JSON.parse(localStorage.getItem(PREFS_KEY) ?? "{}");
    range = p.range ?? range;
    unit = p.unit ?? unit;
  } catch {}
  const savePrefs = () => {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify({ range, unit }));
    } catch {}
  };

  const RANGE_TEXT = { 7: "the last 7 days", 30: "the last 30 days", 365: "the last year", all: "all time" };

  // ---- Stats -----------------------------------------------------------------

  const renderOverview = () => {
    for (const btn of document.querySelectorAll(".tabs button")) {
      btn.setAttribute("aria-selected", String(btn.dataset.range === range));
    }
    const t = U.total(days, range);
    $("r-blocked").textContent = U.fmt(t.b);
    $("r-opened").textContent = U.fmt(t.o);
    $("r-watch").textContent = U.dur(t.w);
    $("r-zero").textContent = U.fmt(t.zero);

    const cur = U.streak(days);
    const best = U.bestStreak(days);
    const el = $("streaks");
    el.replaceChildren();
    const b = (text) => Object.assign(document.createElement("b"), { textContent: text });
    el.append("Current streak at zero: ", b(U.plural(cur, "day", "days")), " · Best: ", b(U.plural(best, "day", "days")));
  };

  const renderTypical = () => {
    for (const btn of document.querySelectorAll(".seg button")) {
      btn.setAttribute("aria-pressed", String(btn.dataset.unit === unit));
    }
    const list = U.buckets(days, range, unit);
    const n = list.length;
    const word = unit === "week" ? "week" : "day";
    $("typical-title").textContent = `A typical ${word}`;
    const span = RANGE_TEXT[range][0].toUpperCase() + RANGE_TEXT[range].slice(1);
    $("typical-help").textContent =
      `${span}, split into ${U.plural(n, word, word + "s")}${unit === "week" ? " (Mon–Sun)" : ""}. ` +
      `Average and median show a usual ${word}; most and least show your worst and best ${word}.`;

    for (const row of document.querySelectorAll(".stats tbody tr")) {
      const f = row.dataset.field;
      const s = U.summarize(list.map((x) => x[f]));
      const show = f === "w" ? U.dur : U.num;
      const cells = row.querySelectorAll("td");
      [s.avg, s.median, s.max, s.min].forEach((v, i) => (cells[i].textContent = show(v)));
    }
  };

  const renderHeat = () =>
    U.renderHeat({
      grid: $("heat-grid"),
      months: $("heat-months"),
      detail: $("heat-detail"),
      days,
      weeks: 53,
      step: 14,
      idleText: "Hover or click a day to see its numbers.",
      state: heatState,
    });

  const describe = (d) => {
    const keys = Object.keys(d).sort();
    if (!keys.length) return "No stats yet.";
    const t = { b: 0, o: 0, w: 0 };
    for (const e of Object.values(d)) for (const f of S.FIELDS) t[f] += e[f] ?? 0;
    const span = keys.length === 1 ? keys[0] : `${keys[0]} – ${keys.at(-1)}`;
    return `${U.plural(keys.length, "day", "days")} recorded · ${span}\n${U.fmt(t.b)} scrolls blocked · ${U.fmt(t.o)} shorts · ${U.dur(t.w)} watched`;
  };

  const render = () => {
    renderOverview();
    renderTypical();
    renderHeat();
    $("summary").textContent = describe(days);
  };

  for (const btn of document.querySelectorAll(".tabs button")) {
    btn.addEventListener("click", () => {
      range = btn.dataset.range;
      savePrefs();
      renderOverview();
      renderTypical();
    });
  }
  for (const btn of document.querySelectorAll(".seg button")) {
    btn.addEventListener("click", () => {
      unit = btn.dataset.unit;
      savePrefs();
      renderTypical();
    });
  }

  // ---- Data ------------------------------------------------------------------

  const status = (text, isError = false) => {
    const el = $("status");
    el.textContent = text;
    el.classList.toggle("error", isError);
  };

  $("export").addEventListener("click", async () => {
    const data = { app: "OneScroll", format: FORMAT, exportedAt: new Date().toISOString(), days: await S.load() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `onescroll-stats-${S.dayKey()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    status("Exported.");
  });

  const hidePreview = () => {
    pending = null;
    $("preview").hidden = true;
    $("file").value = "";
  };

  $("file").addEventListener("change", async () => {
    const file = $("file").files[0];
    if (!file) return;
    status("");
    try {
      if (file.size > 5 * 1024 * 1024) throw new Error("File is too large.");
      const json = JSON.parse(await file.text());
      // Accept a OneScroll export, or a bare { "YYYY-MM-DD": {...} } map.
      const parsed = S.sanitize(json && json.app === "OneScroll" ? json.days : json);
      if (!Object.keys(parsed).length) throw new Error("No OneScroll stats found in this file.");
      pending = parsed;
      $("preview-text").textContent = `Found ${describe(parsed)}`;
      $("preview").hidden = false;
    } catch (err) {
      hidePreview();
      status(err instanceof SyntaxError ? "That file isn't valid JSON." : err.message, true);
    }
  });

  $("merge").addEventListener("click", async () => {
    if (!pending) return;
    await S.save(S.merge(await S.load(), pending));
    hidePreview();
    status("Imported and merged.");
  });

  $("replace").addEventListener("click", async () => {
    if (!pending) return;
    await S.save(pending);
    hidePreview();
    status("Imported. Previous stats replaced.");
  });

  $("cancel").addEventListener("click", () => {
    hidePreview();
    status("");
  });

  const reset = $("reset");
  let confirmTimer = 0;
  const unconfirm = () => {
    reset.classList.remove("confirm");
    reset.textContent = "Reset stats";
  };
  reset.addEventListener("click", async () => {
    if (!reset.classList.contains("confirm")) {
      reset.classList.add("confirm");
      reset.textContent = "Click again to delete all stats";
      confirmTimer = setTimeout(unconfirm, 4000);
      return;
    }
    clearTimeout(confirmTimer);
    unconfirm();
    await S.reset();
    status("All stats deleted.");
  });

  // ---- Live updates ----------------------------------------------------------

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
