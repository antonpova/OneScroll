/*
 * OneScroll stats — stored only in this browser (storage.local).
 * Nothing is ever sent anywhere.
 *
 * Shape: { days: { "YYYY-MM-DD": { b: <blocked scroll attempts>,
 *                                  o: <shorts opened>,
 *                                  w: <seconds of Shorts watched> } } }
 */
(() => {
  "use strict";

  const api = globalThis.browser ?? globalThis.chrome;
  const KEY = "days";
  const FIELDS = ["b", "o", "w"];
  const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

  const pad = (n) => String(n).padStart(2, "0");
  // Local calendar day, so "today" matches the user's clock.
  const dayKey = (d = new Date()) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  // Serialize writes from this page so quick increments don't overwrite each other.
  let queue = Promise.resolve();
  const enqueue = (fn) => {
    queue = queue.then(fn).catch(() => {}); // e.g. extension reloaded while the tab stayed open
    return queue;
  };

  const add = (field, n = 1) =>
    enqueue(async () => {
      const days = (await api.storage.local.get(KEY))[KEY] ?? {};
      const entry = (days[dayKey()] ??= {});
      entry[field] = (entry[field] ?? 0) + n;
      await api.storage.local.set({ [KEY]: days });
    });

  const load = async () => (await api.storage.local.get(KEY))[KEY] ?? {};

  // Keep only well-formed days and non-negative whole-number fields.
  const sanitize = (raw) => {
    const out = {};
    if (!raw || typeof raw !== "object") return out;
    for (const [k, v] of Object.entries(raw)) {
      if (!DAY_RE.test(k) || !v || typeof v !== "object") continue;
      const e = {};
      for (const f of FIELDS) {
        const n = Number(v[f]);
        if (Number.isFinite(n) && n > 0) e[f] = Math.floor(n);
      }
      if (Object.keys(e).length) out[k] = e;
    }
    return out;
  };

  // Merging takes the larger value per day and field, so importing the same
  // file twice (or your own export) never double-counts.
  const merge = (a, b) => {
    const out = structuredClone(a);
    for (const [k, e] of Object.entries(b)) {
      const t = (out[k] ??= {});
      for (const f of FIELDS) if (e[f] != null) t[f] = Math.max(t[f] ?? 0, e[f]);
    }
    return out;
  };

  globalThis.OneScrollStats = {
    dayKey,
    FIELDS,
    recordBlocked: () => add("b"),
    recordOpened: () => add("o"),
    recordWatch: (seconds) => (seconds > 0 ? add("w", seconds) : queue),
    load,
    sanitize,
    merge,
    save: (days) => enqueue(() => api.storage.local.set({ [KEY]: days })),
    reset: () => enqueue(() => api.storage.local.remove(KEY)),
  };
})();
