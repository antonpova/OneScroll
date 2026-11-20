(() => {
  "use strict";

  const S = globalThis.OneScrollStats;
  const api = globalThis.browser ?? globalThis.chrome;
  const $ = (id) => document.getElementById(id);
  const FORMAT = 1;

  let pending = null; // sanitized days from the chosen import file

  const fmt = (n) => n.toLocaleString("en-US");
  const dur = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return h ? `${h}h ${m}m` : `${m}m`;
  };
  const describe = (days) => {
    const keys = Object.keys(days).sort();
    if (!keys.length) return "No stats yet.";
    const t = { b: 0, o: 0, w: 0 };
    for (const e of Object.values(days)) for (const f of S.FIELDS) t[f] += e[f] ?? 0;
    const span = keys.length === 1 ? keys[0] : `${keys[0]} – ${keys.at(-1)}`;
    return `${fmt(keys.length)} ${keys.length === 1 ? "day" : "days"} · ${span}\n${fmt(t.b)} scrolls blocked · ${fmt(t.o)} shorts · ${dur(t.w)} watched`;
  };

  const status = (text, isError = false) => {
    const el = $("status");
    el.textContent = text;
    el.classList.toggle("error", isError);
  };

  const refresh = async () => {
    $("summary").textContent = describe(await S.load());
  };

  // ---- Export ----------------------------------------------------------------

  $("export").addEventListener("click", async () => {
    const days = await S.load();
    const data = { app: "OneScroll", format: FORMAT, exportedAt: new Date().toISOString(), days };
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

  // ---- Import ----------------------------------------------------------------

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
      const raw = json && json.app === "OneScroll" ? json.days : json;
      const days = S.sanitize(raw);
      if (!Object.keys(days).length) throw new Error("No OneScroll stats found in this file.");
      pending = days;
      $("preview-text").textContent = `Found ${describe(days)}`;
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

  // ---- Reset -----------------------------------------------------------------

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

  api.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.days) refresh();
  });
  refresh();
})();
