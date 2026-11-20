# OneScroll — store listing texts

Copy-paste source for addons.mozilla.org (AMO) and the Chrome Web Store.
Store texts are plain text: copy what is inside the code blocks.

---

## Name

```
OneScroll
```

## Summary / short description

AMO limit 250 chars, Chrome limit 132 chars — this one fits both.

```
One short. That's it. Watch the YouTube Short you opened — scrolling to the next one is gone.
```

## Full description

```
One short. That's it.

YouTube Shorts are built to keep you scrolling. OneScroll takes that part away: open a Short, watch it — and that's the end. There is no "next one".

WHAT IT DOES
• Blocks moving to another Short by mouse wheel, swipe, arrow keys, PageUp/PageDown and the up/down buttons.
• Hides the edges of the next and previous Shorts, so there's nothing to peek at.
• Shows a small "One short. That's it." when you try to scroll.
• Comments, description, likes and the player keep working as usual.
• You can still open any Short on purpose — from search, a channel or a link.

STATS, IF YOU'RE CURIOUS
• Blocked scroll attempts, shorts watched and watch time — today, 7 days, 30 days, a year, all time.
• Streaks of days with zero scroll attempts.
• A GitHub-style heatmap, plus averages, medians and your best and worst day or week.

PRIVATE BY DESIGN
• Stats are stored only in your browser. Nothing is sent anywhere: no servers, no analytics, no accounts.
• Only daily numbers are kept — no video IDs, titles or history.
• Export, import or reset your stats any time.
• Runs only on youtube.com. The only permission it asks for is storage.

Open source (MIT): https://github.com/antonpova/OneScroll

Not affiliated with YouTube or Google.
```

## Categories and tags

- **AMO (Firefox):** Photos, Music & Videos. Second category, if asked: Other.
- **AMO (Firefox for Android):** Photos, Music & Videos.
- **Chrome Web Store:** Lifestyle → Well-being. If that's not offered: Productivity → Tools.
- **AMO tags:** youtube, shorts, focus, productivity, digital wellbeing

## Links

- Homepage / support site: `https://github.com/antonpova/OneScroll`
- Support for bugs: `https://github.com/antonpova/OneScroll/issues` (works once the repo is public)
- License: MIT

---

## AMO: notes for reviewers

```
No build step and no minified or bundled code — the uploaded files are the source.

How it works: a content script on youtube.com / m.youtube.com blocks wheel, touch and key events that would move to another Short while on /shorts/, hides the neighbouring Shorts with CSS, and shows a small toast. Stats (daily counts only) are kept in storage.local and shown in the popup and options page. No network requests are made by the extension.

To test: open https://www.youtube.com/shorts and try to scroll to the next Short.
```

---

## Chrome Web Store: Privacy practices tab

**Single purpose description**

```
Stops endless scrolling in YouTube Shorts: the Short you open is the only one you watch. Moving to the next Short by scrolling, swiping, keys or buttons is blocked. The extension also keeps simple daily counts of how often it stepped in, stored only in the local browser and shown in its popup.
```

**Permission justification — storage**

```
Saves daily counts (blocked scroll attempts, Shorts opened, seconds watched) in local browser storage so the popup and stats page can show them. The data never leaves the browser.
```

**Permission justification — host permission (youtube.com)**

```
The content script must run on www.youtube.com and m.youtube.com to block scrolling between Shorts, hide the neighbouring Shorts and show the "One short. That's it." notice. It runs on no other site.
```

**Are you using remote code?** No, I am not using remote code.

**Data usage.** Chrome counts data handled *locally* as handled too
(see https://developer.chrome.com/docs/webstore/program-policies/user-data-faq, Q3 and Q14), so tick:
- **User activity** — scroll/swipe/key events are observed to block them; blocked attempts and watch time are counted.
- **Web history** — Shorts opened are counted; a tab keeps the ids of Shorts already counted until it closes.

Leave the other seven unchecked. Then tick all three certifications:
- I do not sell or transfer user data to third parties, outside of the approved use cases
- I do not use or transfer user data for purposes that are unrelated to my item's single purpose
- I do not use or transfer user data to determine creditworthiness or for lending purposes

**Privacy policy URL** (required, because user data is handled):
`https://github.com/antonpova/OneScroll/blob/main/PRIVACY.md`

---

## Images

All in `store/images/`:

| File | Use |
|---|---|
| `1-one-short.png` (1280×800) | Screenshot 1 — AMO and Chrome |
| `2-popup.png` (1280×800) | Screenshot 2 — AMO and Chrome |
| `3-private.png` (1280×800) | Screenshot 3 — AMO and Chrome |
| `promo-tile-440x280.png` | Chrome "Small promo tile" |
| `marquee-1400x560.png` | Chrome "Marquee promo tile" (optional, used only if featured) |
| `../../icons/icon-128.png` | Chrome "Store icon" and AMO "Add-on icon" (upload it by hand — AMO doesn't pick it up from the manifest) |
