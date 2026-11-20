/*
 * OneScroll — one short. That's it.
 *
 * While a YouTube Short is open (/shorts/<id>), moving to another Short by
 * scrolling, swiping, arrow keys or the up/down buttons is blocked.
 * Three layers:
 *   1. CSS (content.css): the feed scroller can't scroll, nav buttons hidden.
 *   2. Input events: wheel / touch / keys that would change the Short are cancelled.
 *   3. URL guard: if the page still lands on a different Short without the user
 *      clicking a link to it, send them back to the one they opened.
 */
(() => {
  "use strict";

  const TOAST_TEXT = "One short. That's it.";
  const NAV_KEYS = new Set(["ArrowDown", "ArrowUp", "PageDown", "PageUp"]);
  // A link click within this window counts as the user deliberately opening a Short.
  const CLICK_GRACE_MS = 2000;

  let lockedId = null; // id of the Short the user opened
  let lastLinkClickAt = 0; // last click on a link to a Short
  let lastPopstateAt = 0; // browser back/forward
  let touchStartY = null;

  const shortsIdFrom = (url) => {
    const m = /^\/shorts\/([^/?#]+)/.exec(new URL(url, location.href).pathname);
    return m ? m[1] : null;
  };
  const onShorts = () => shortsIdFrom(location.href) !== null;

  // ---- 1. Toggle the CSS hook --------------------------------------------

  const syncClass = () => {
    document.documentElement?.classList.toggle("onescroll-active", onShorts());
  };

  // ---- Stats -----------------------------------------------------------------

  const stats = globalThis.OneScrollStats;
  // One scroll gesture fires many wheel/touch events; count it as one attempt.
  const ATTEMPT_GAP_MS = 800;
  let lastBlockAt = 0;
  const noteAttempt = () => {
    const now = Date.now();
    if (now - lastBlockAt > ATTEMPT_GAP_MS) stats?.recordBlocked();
    lastBlockAt = now;
  };

  // Watch time: seconds a Short is actually playing (paused time doesn't count).
  const WATCH_TICK_MS = 1000;
  const WATCH_FLUSH_MS = 15000;
  let watchPending = 0; // seconds not yet saved
  let lastTick = performance.now();
  let lastFlush = lastTick;

  const shortPlaying = () => {
    for (const v of document.querySelectorAll("video")) {
      if (!v.paused && !v.ended && v.readyState > 2) return true;
    }
    return false;
  };

  const flushWatch = () => {
    const whole = Math.floor(watchPending);
    if (whole > 0) {
      watchPending -= whole;
      stats?.recordWatch(whole);
    }
    lastFlush = performance.now();
  };

  setInterval(() => {
    const now = performance.now();
    // Cap the step so a throttled/suspended tab doesn't add a huge jump.
    const dt = Math.min(now - lastTick, 5000) / 1000;
    lastTick = now;
    if (onShorts() && shortPlaying()) watchPending += dt;
    if (now - lastFlush >= WATCH_FLUSH_MS) flushWatch();
  }, WATCH_TICK_MS);

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushWatch();
  });
  window.addEventListener("pagehide", flushWatch);

  // ---- Toast ---------------------------------------------------------------

  // The visible frame of the current Short, so the toast centres on the video.
  const videoRect = () => {
    const cy = innerHeight / 2;
    for (const el of document.querySelectorAll("ytd-reel-video-renderer #player-container")) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.top <= cy && r.bottom >= cy) return r;
    }
    // Fallback (mobile site, layout changes): the largest visible <video>.
    let best = null;
    let bestArea = 0;
    for (const v of document.querySelectorAll("video")) {
      const r = v.getBoundingClientRect();
      const w = Math.min(r.right, innerWidth) - Math.max(r.left, 0);
      const h = Math.min(r.bottom, innerHeight) - Math.max(r.top, 0);
      if (w > 0 && h > 0 && w * h > bestArea) {
        bestArea = w * h;
        best = r;
      }
    }
    return best;
  };

  const placeToast = (el) => {
    const r = videoRect();
    let x = innerWidth / 2;
    let y = innerHeight / 2;
    if (r) {
      x = (Math.max(r.left, 0) + Math.min(r.right, innerWidth)) / 2;
      y = (Math.max(r.top, 0) + Math.min(r.bottom, innerHeight)) / 2;
    }
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
  };

  let toastEl = null;
  let toastTimer = 0;
  const toast = () => {
    if (!document.body) return;
    if (!toastEl || !toastEl.isConnected) {
      toastEl = document.createElement("div");
      toastEl.id = "onescroll-toast";
      toastEl.setAttribute("role", "status");
      toastEl.textContent = TOAST_TEXT;
      document.body.appendChild(toastEl);
    }
    placeToast(toastEl);
    toastEl.classList.add("onescroll-show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove("onescroll-show"), 1400);
  };

  // ---- 2. Input events -----------------------------------------------------

  const isEditable = (el) =>
    el instanceof Element &&
    (el.isContentEditable || el.closest("input, textarea, select, [contenteditable='true']"));

  // True if the event target sits inside its own scrollable area (comments,
  // description panel, menus) — those must keep scrolling normally.
  const insideOwnScroller = (target, dy) => {
    const root = document.scrollingElement;
    for (let el = target instanceof Element ? target : null; el; el = el.parentElement) {
      if (el.id === "shorts-container" || el === root || el === document.body) return false;
      const oy = getComputedStyle(el).overflowY;
      if ((oy === "auto" || oy === "scroll") && el.scrollHeight > el.clientHeight + 1) {
        // Only if it can still scroll in that direction; otherwise the scroll
        // would chain to the feed.
        if (dy > 0) return el.scrollTop + el.clientHeight < el.scrollHeight - 1;
        if (dy < 0) return el.scrollTop > 0;
        return true;
      }
    }
    return false;
  };

  const block = (e) => {
    e.preventDefault();
    e.stopImmediatePropagation();
    toast();
    noteAttempt();
  };

  const onWheel = (e) => {
    if (!onShorts() || e.ctrlKey) return; // ctrl+wheel = page zoom
    if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
    if (insideOwnScroller(e.target, e.deltaY)) return;
    block(e);
  };

  const onKeyDown = (e) => {
    if (!onShorts() || !NAV_KEYS.has(e.key)) return;
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (isEditable(e.target)) return;
    if (insideOwnScroller(e.target, e.key === "ArrowUp" || e.key === "PageUp" ? -1 : 1)) return;
    block(e);
  };

  const onTouchStart = (e) => {
    touchStartY = e.touches.length === 1 ? e.touches[0].clientY : null;
  };

  const onTouchMove = (e) => {
    if (!onShorts() || touchStartY === null || e.touches.length !== 1) return;
    const dy = touchStartY - e.touches[0].clientY; // >0 = swipe up = next short
    if (Math.abs(dy) < 4) return;
    if (insideOwnScroller(e.target, dy)) return;
    if (e.cancelable) block(e);
  };

  const opts = { capture: true, passive: false };
  window.addEventListener("wheel", onWheel, opts);
  window.addEventListener("keydown", onKeyDown, opts);
  window.addEventListener("touchstart", onTouchStart, { capture: true, passive: true });
  window.addEventListener("touchmove", onTouchMove, opts);

  // ---- 3. URL guard --------------------------------------------------------

  // Remember deliberate clicks on links to a Short (shelf, search, channel grid…).
  window.addEventListener(
    "click",
    (e) => {
      const a = e.target instanceof Element && e.target.closest("a[href]");
      if (a && shortsIdFrom(a.href)) lastLinkClickAt = Date.now();
    },
    true
  );
  window.addEventListener("popstate", () => (lastPopstateAt = Date.now()), true);

  // Set before the guard reloads the page, so the reload isn't counted as a new open.
  const RETURN_FLAG = "onescroll-return";
  const takeReturnFlag = (id) => {
    try {
      const was = sessionStorage.getItem(RETURN_FLAG) === id;
      sessionStorage.removeItem(RETURN_FLAG);
      return was;
    } catch {
      return false;
    }
  };

  const lockTo = (id) => {
    lockedId = id;
    if (!takeReturnFlag(id)) stats?.recordOpened();
  };

  const checkUrl = () => {
    syncClass();
    const id = shortsIdFrom(location.href);
    if (!id) {
      lockedId = null; // left Shorts — next Short opened starts fresh
      return;
    }
    if (id === lockedId) return;
    if (lockedId === null) return lockTo(id);
    const now = Date.now();
    const deliberate =
      now - lastLinkClickAt < CLICK_GRACE_MS || now - lastPopstateAt < CLICK_GRACE_MS;
    if (deliberate) return lockTo(id);
    // Landed on another Short on its own (scroll slipped through, auto-advance…).
    try {
      sessionStorage.setItem(RETURN_FLAG, lockedId);
    } catch {}
    noteAttempt();
    flushWatch();
    location.replace(`/shorts/${lockedId}`);
  };

  // YouTube is a single-page app: watch its navigation events, plus a light
  // poll as a fallback for URL changes made via history.replaceState.
  for (const ev of ["yt-navigate-start", "yt-navigate-finish", "popstate"]) {
    window.addEventListener(ev, checkUrl, true);
    document.addEventListener(ev, checkUrl, true);
  }
  setInterval(checkUrl, 400);

  syncClass();
  checkUrl();
  if (!document.documentElement) {
    document.addEventListener("DOMContentLoaded", checkUrl, { once: true });
  }
})();
