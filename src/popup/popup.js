(() => {
  "use strict";

  const S = globalThis.OneScrollStats;
  const api = globalThis.browser ?? globalThis.chrome;
  const $ = (id) => document.getElementById(id);

  const WEEKS = 24; // ~6 months fits the popup width
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const RANGE_KEY = "onescroll-range";

  let days = {};
  let range = "7";
  let selectedKey = null;

  try {
    range = localStorage.getItem(RANGE_KEY) ?? range;
  } catch {}

  // ---- Helpers ---------------------------------------------------------------

  const today = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  };
  const addDays = (d, n) => {
    const x = new Date(d);
    x.setDate(x.getDate() + n);
    return x;
  };
  const get = (k) => ({ b: 0, o: 0, w: 0, ...days[k] });
  const fmt = (n) => n.toLocaleString("en-US");
  const plural = (n, one, many) => `${fmt(n)} ${n === 1 ? one : many}`;
  // 45s · 12m · 3h 5m
  const dur = (s) => {
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m`;
    return `${Math.floor(m / 60)}h ${m % 60}m`;
  };
  const label = (d) => `${MONTHS[d.getMonth()]} ${d.getDate()}`;

  const message = (b) => {
    if (b === 0) return "Zero today. Strong willpower!";
    if (b <= 3) return "A couple of reflexes. You held the line.";
    if (b <= 10) return "The feed kept calling. You didn't answer.";
    if (b <= 25) return "Tough one. Every block still counts.";
    return "Rough day. Maybe close YouTube for a bit?";
  };

  const sumRange = () => {
    const total = { b: 0, o: 0, w: 0 };
    const add = (e) => {
      total.b += e.b ?? 0;
      total.o += e.o ?? 0;
      total.w += e.w ?? 0;
    };
    if (range === "all") Object.values(days).forEach(add);
    else for (let i = 0; i < Number(range); i++) add(get(S.dayKey(addDays(today(), -i))));
    return total;
  };

  // Days in a row, ending today, with no blocked attempts — counted from the
  // first day OneScroll recorded anything.
  const streak = () => {
    const first = Object.keys(days).sort()[0];
    if (!first) return 0;
    let n = 0;
    for (let d = today(); S.dayKey(d) >= first; d = addDays(d, -1)) {
      if ((get(S.dayKey(d)).b ?? 0) > 0) break;
      n++;
    }
    return n;
  };

  // ---- Render ----------------------------------------------------------------

  const renderToday = () => {
    const t = get(S.dayKey());
    const count = $("today-count");
    count.textContent = fmt(t.b);
    count.classList.toggle("zero", t.b === 0);
    $("today-unit").textContent = t.b === 1 ? "scroll blocked" : "scrolls blocked";
    $("today-sub").textContent = `${dur(t.w)} watched · ${plural(t.o, "short", "shorts")}`;
    $("today-message").textContent = message(t.b);
  };

  const renderRange = () => {
    for (const btn of document.querySelectorAll(".tabs button")) {
      btn.setAttribute("aria-selected", String(btn.dataset.range === range));
    }
    const total = sumRange();
    $("r-blocked").textContent = fmt(total.b);
    $("r-opened").textContent = fmt(total.o);
    $("r-watch").textContent = dur(total.w);
    $("r-streak").textContent = fmt(streak());
  };

  const defaultDetail = () => "Last 6 months";
  const dayDetail = (k, d) => {
    const e = get(k);
    return `${label(d)} · ${plural(e.b, "block", "blocks")} · ${plural(e.o, "short", "shorts")} · ${dur(e.w)}`;
  };

  const renderHeat = () => {
    const grid = $("heat-grid");
    const months = $("heat-months");
    grid.replaceChildren();
    months.replaceChildren();

    const t = today();
    const todayKey = S.dayKey(t);
    const mondayIdx = (t.getDay() + 6) % 7;
    const start = addDays(t, -mondayIdx - (WEEKS - 1) * 7);

    const cells = [];
    let max = 0;
    for (let i = 0; i < WEEKS * 7; i++) {
      const d = addDays(start, i);
      const k = S.dayKey(d);
      const future = d > t;
      const b = future ? 0 : get(k).b ?? 0;
      max = Math.max(max, b);
      cells.push({ d, k, b, future });
    }

    const levelOf = (b) => (b === 0 || max === 0 ? 0 : Math.min(4, Math.ceil((b / max) * 4)));

    for (const c of cells) {
      const el = document.createElement("i");
      el.setAttribute("role", "gridcell");
      if (c.future) {
        el.className = "future";
      } else {
        const lvl = levelOf(c.b);
        if (lvl) el.classList.add(`l${lvl}`);
        if (c.k === todayKey) el.classList.add("is-today");
        if (c.k === selectedKey) el.classList.add("selected");
        const text = dayDetail(c.k, c.d);
        el.title = text;
        el.setAttribute("aria-label", text);
        el.tabIndex = -1;
        el.addEventListener("mouseenter", () => ($("heat-detail").textContent = text));
        el.addEventListener("mouseleave", restoreDetail);
        el.addEventListener("click", () => {
          selectedKey = selectedKey === c.k ? null : c.k;
          renderHeat();
        });
      }
      grid.appendChild(el);
    }

    // Month labels above the first week that starts in a new month.
    const step = 10 + 2.5;
    let lastMonth = -1;
    let lastPos = -99;
    for (let w = 0; w < WEEKS; w++) {
      const m = addDays(start, w * 7).getMonth();
      if (m !== lastMonth) {
        lastMonth = m;
        if (w - lastPos >= 3) {
          const s = document.createElement("span");
          s.textContent = MONTHS[m];
          s.style.left = `${w * step}px`;
          months.appendChild(s);
          lastPos = w;
        }
      }
    }
    restoreDetail();
  };

  function restoreDetail() {
    const el = $("heat-detail");
    if (selectedKey) {
      const [y, m, d] = selectedKey.split("-").map(Number);
      el.textContent = dayDetail(selectedKey, new Date(y, m - 1, d));
    } else {
      el.textContent = defaultDetail();
    }
  }

  const render = () => {
    renderToday();
    renderRange();
    renderHeat();
  };

  // ---- Events ----------------------------------------------------------------

  for (const btn of document.querySelectorAll(".tabs button")) {
    btn.addEventListener("click", () => {
      range = btn.dataset.range;
      try {
        localStorage.setItem(RANGE_KEY, range);
      } catch {}
      renderRange();
    });
  }

  // Export / import / reset live on the Data page: a file picker would close this popup.
  $("manage").addEventListener("click", () => {
    api.runtime.openOptionsPage();
    window.close();
  });

  // Live update while the popup is open.
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
