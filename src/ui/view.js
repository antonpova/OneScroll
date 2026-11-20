/*
 * Shared helpers for the popup and the Stats & data page:
 * formatting, period maths and the heatmap.
 */
(() => {
  "use strict";

  const S = globalThis.OneScrollStats;
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // ---- Dates -----------------------------------------------------------------

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
  const parseKey = (k) => {
    const [y, m, d] = k.split("-").map(Number);
    return new Date(y, m - 1, d);
  };
  const mondayOf = (d) => addDays(d, -((d.getDay() + 6) % 7));
  const label = (d) => `${MONTHS[d.getMonth()]} ${d.getDate()}`;

  // ---- Formatting ------------------------------------------------------------

  const fmt = (n) => n.toLocaleString("en-US");
  const plural = (n, one, many) => `${fmt(n)} ${n === 1 ? one : many}`;
  // Whole numbers as-is, small averages with one decimal.
  const num = (n) => (Number.isInteger(n) ? fmt(n) : n < 10 ? n.toFixed(1) : fmt(Math.round(n)));

  // 45s · 4m 12s · 2h 5m 10s
  const dur = (s) => {
    s = Math.round(s);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const parts = [];
    if (h) parts.push(`${h}h`);
    if (h || m) parts.push(`${m}m`);
    parts.push(`${s % 60}s`);
    return parts.join(" ");
  };
  // Same, but drops seconds past an hour — for tight spots.
  const durShort = (s) => (s >= 3600 ? dur(s).replace(/ \d+s$/, "") : dur(s));

  const message = (b) => {
    if (b === 0) return "Zero today. Strong willpower!";
    if (b <= 3) return "A couple of reflexes. You held the line.";
    if (b <= 10) return "The feed kept calling. You didn't answer.";
    if (b <= 25) return "Tough one. Every block still counts.";
    return "Rough day. Maybe close YouTube for a bit?";
  };

  // ---- Stats maths -----------------------------------------------------------

  const entry = (days, k) => ({ b: 0, o: 0, w: 0, ...days[k] });
  const firstKey = (days) => Object.keys(days).sort()[0];

  // First day of a period ("7", "30", "365", "all"), never before the first
  // recorded day — so a fresh install doesn't count empty days.
  const periodStart = (days, range) => {
    const t = today();
    const first = firstKey(days);
    if (!first) return t; // nothing recorded yet: only today counts
    const from = parseKey(first);
    const start = range === "all" ? from : addDays(t, -(Number(range) - 1));
    return from > start ? from : start;
  };

  // Totals per day (or per Monday-based week) across the period.
  const buckets = (days, range, unit = "day") => {
    const map = new Map();
    for (let d = periodStart(days, range); d <= today(); d = addDays(d, 1)) {
      const key = S.dayKey(unit === "week" ? mondayOf(d) : d);
      const acc = map.get(key) ?? { b: 0, o: 0, w: 0 };
      const e = entry(days, S.dayKey(d));
      acc.b += e.b;
      acc.o += e.o;
      acc.w += e.w;
      map.set(key, acc);
    }
    return [...map.values()];
  };

  const total = (days, range) =>
    buckets(days, range).reduce(
      (t, e) => ({ b: t.b + e.b, o: t.o + e.o, w: t.w + e.w, zero: t.zero + (e.b === 0 ? 1 : 0) }),
      { b: 0, o: 0, w: 0, zero: 0 }
    );

  const summarize = (values) => {
    const sorted = [...values].sort((a, b) => a - b);
    const n = sorted.length;
    const sum = sorted.reduce((a, b) => a + b, 0);
    const median = n % 2 ? sorted[(n - 1) / 2] : (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
    return { total: sum, avg: sum / n, median, max: sorted[n - 1], min: sorted[0] };
  };

  // Days in a row, ending today, with no blocked attempts.
  const streak = (days) => {
    const first = firstKey(days);
    if (!first) return 0;
    let n = 0;
    for (let d = today(); S.dayKey(d) >= first; d = addDays(d, -1)) {
      if (entry(days, S.dayKey(d)).b > 0) break;
      n++;
    }
    return n;
  };

  const bestStreak = (days) => {
    const first = firstKey(days);
    if (!first) return 0;
    let best = 0;
    let run = 0;
    for (let d = parseKey(first); d <= today(); d = addDays(d, 1)) {
      run = entry(days, S.dayKey(d)).b === 0 ? run + 1 : 0;
      best = Math.max(best, run);
    }
    return best;
  };

  // ---- Heatmap ---------------------------------------------------------------

  const dayDetail = (days, k) => {
    const e = entry(days, k);
    return `${label(parseKey(k))} · ${plural(e.b, "block", "blocks")} · ${plural(e.o, "short", "shorts")} · ${dur(e.w)}`;
  };

  /**
   * Draw a GitHub-style heatmap of blocked attempts.
   * opts: { grid, months, detail, days, weeks, step, idleText, state: { selected } }
   */
  const renderHeat = (opts) => {
    const { grid, months, detail, days, weeks, step, idleText, state } = opts;
    grid.replaceChildren();
    months.replaceChildren();

    const restore = () => {
      detail.textContent = state.selected ? dayDetail(days, state.selected) : idleText;
    };

    const t = today();
    const todayKey = S.dayKey(t);
    const start = addDays(mondayOf(t), -(weeks - 1) * 7);

    const cells = [];
    let max = 0;
    for (let i = 0; i < weeks * 7; i++) {
      const d = addDays(start, i);
      const k = S.dayKey(d);
      const future = d > t;
      const b = future ? 0 : entry(days, k).b;
      max = Math.max(max, b);
      cells.push({ k, b, future });
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
        if (c.k === state.selected) el.classList.add("selected");
        const text = dayDetail(days, c.k);
        el.setAttribute("aria-label", text);
        el.addEventListener("mouseenter", () => (detail.textContent = text));
        el.addEventListener("mouseleave", restore);
        el.addEventListener("click", () => {
          state.selected = state.selected === c.k ? null : c.k;
          renderHeat(opts);
        });
      }
      grid.appendChild(el);
    }

    // Month labels above the first week that starts in a new month.
    let lastMonth = -1;
    let lastPos = -99;
    for (let w = 0; w < weeks; w++) {
      const m = addDays(start, w * 7).getMonth();
      if (m === lastMonth) continue;
      lastMonth = m;
      if (w - lastPos < 3) {
        // A sliver of a month at the left edge yields to the next full one.
        if (lastPos !== 0) continue;
        months.lastChild?.remove();
      }
      const s = document.createElement("span");
      s.textContent = MONTHS[m];
      s.style.left = `${w * step}px`;
      months.appendChild(s);
      lastPos = w;
    }
    restore();
  };

  globalThis.OneScrollUI = {
    today,
    entry,
    fmt,
    plural,
    num,
    dur,
    durShort,
    message,
    buckets,
    total,
    summarize,
    streak,
    bestStreak,
    renderHeat,
  };
})();
