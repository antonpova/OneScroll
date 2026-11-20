# OneScroll privacy policy

_Last updated: 2026-11-21_

OneScroll is a browser extension that stops scrolling between YouTube Shorts and shows you simple stats about it. This page explains exactly what data it handles. Short version: **everything stays in your browser. Nothing is ever sent to the developer or anyone else.**

## What OneScroll handles

While you are on `youtube.com` or `m.youtube.com`, OneScroll:

- **Reacts to scrolling, swiping and key presses** on Shorts pages, so it can block moving to the next Short. These events are not recorded — only counted (see below).
- **Keeps daily counts** in your browser's local extension storage (`storage.local`):
  - how many scroll attempts it blocked,
  - how many Shorts you opened,
  - how many seconds of Shorts were playing.

  Each day is stored as just these three numbers. No video IDs, titles, URLs, channels, timestamps within the day, or anything else about what you watched.
- **Remembers which Shorts were already counted in the current tab**, so reloading a Short doesn't count it twice. This list of Short IDs lives only in that tab's session storage for youtube.com (the same place YouTube's own page keeps per-tab data) and is deleted by the browser when the tab is closed. It is never saved to the stats.

That's all. OneScroll does not read comments, your account, your watch history, cookies, or any other page content, and it does not run on any other website.

## What OneScroll does not do

- It makes **no network requests**. There is no server, no analytics, no telemetry, no ads, no tracking.
- It does **not sell, share or transfer** any data to anyone. The developer never receives your data and has no way to see it.
- It does not use data for anything other than blocking Shorts scrolling and showing you your own stats.

## Your control

- See your stats in the OneScroll popup and on its **Stats & data** page.
- **Export** them as a JSON file, **import** a file, or **reset** (delete) them on the Stats & data page. Exporting is the only way your stats leave the browser, and only when you do it yourself.
- Uninstalling the extension deletes all of its stored data.

## Changes

If OneScroll ever starts handling data differently, this page will be updated before that version is released, and the change will be described in the release notes.

## Contact

Questions or concerns: open an issue at https://github.com/antonpova/OneScroll/issues

## Limited Use

The use of information received by OneScroll adheres to the Chrome Web Store User Data Policy, including the Limited Use requirements.
