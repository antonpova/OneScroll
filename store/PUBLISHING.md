# Как опубликовать OneScroll

Тексты для копирования — в [listing.md](listing.md), картинки — в [images/](images/).
Архив для загрузки собирается командой:

```bash
npm run build
```

и появляется в `web-ext-artifacts/onescroll-0.3.0.zip`. Один и тот же архив — для Firefox и Chrome.

---

## 0. Перед началом

1. **Сделай репозиторий публичным** (иначе ссылки на GitHub в описании и в расширении ведут на 404):
   github.com/antonpova/OneScroll → **Settings** → внизу **Danger Zone** → **Change visibility** → **Make public**.
2. Собери свежий архив (`npm run build`).

---

## 1. Firefox — addons.mozilla.org (бесплатно)

1. Открой https://addons.mozilla.org/developers/ → **Log in** (нужен аккаунт Mozilla, можно создать там же).
2. При первом входе:
   - прими **Firefox Add-on Distribution Agreement**;
   - задай **Display Name** в профиле (например, `anton pova`) — оно будет видно как автор.
3. Нажми **Submit a New Add-on**.
4. **How to Distribute this Version** → выбери **On this site** → Continue.
5. **Upload Version**:
   - загрузи `web-ext-artifacts/onescroll-0.3.0.zip`;
   - **Compatible Platforms**: отметь **Firefox** и **Firefox for Android**;
   - дождись автопроверки (должно быть без ошибок) → Continue.
6. **Source code**: «Do you need to submit source code?» → **No** (у нас нет сборки и минификации).
7. **Describe Add-on** (тексты из listing.md):
   - **Name**: OneScroll; **Add-on URL**: `onescroll` (если занято — `onescroll-shorts`);
   - **Summary** и **Description**;
   - **Categories** (Firefox и Android);
   - **Support website**: ссылка на GitHub; email — по желанию;
   - **License**: MIT;
   - **Privacy Policy**: галку не ставим (данные не собираются);
   - **Notes to Reviewer**: блок «AMO: notes for reviewers».
8. **Submit Version**.
9. После отправки зайди в **Edit Product Page** → **Images** → загрузи 3 скриншота из `store/images/` (1-, 2-, 3-…png). Можно добавить **Tags**.
10. Ждём ревью — обычно от нескольких часов до пары дней. Придёт письмо.

### Потестить на телефоне

Когда AMO одобрит:
1. На Android открой **Firefox** → https://addons.mozilla.org/android/ → найди **OneScroll** (или открой страницу расширения по ссылке из письма).
2. **Add to Firefox** → разрешить.
3. Открой `m.youtube.com/shorts` и попробуй свайпать. Если что-то не так — пиши, поправим и выпустим 0.3.1.

---

## 2. Chrome — Chrome Web Store (разово $5)

1. Открой https://chrome.google.com/webstore/devconsole → войди в Google-аккаунт.
2. При первом входе: прими соглашение и оплати **регистрационный взнос $5** (один раз на аккаунт).
3. Вкладка **Account**: укажи и **подтверди контактный email** (без этого не дадут отправить на ревью). Publisher name — например, `anton pova`.
4. **New item** (+ Add new item) → загрузи тот же zip.
   - Может появиться предупреждение про `browser_specific_settings` — это настройки для Firefox, Chrome их игнорирует. Нормально.
5. Вкладка **Store listing**:
   - **Description** — полное описание из listing.md;
   - **Category** — Lifestyle → Well-being (или Productivity → Tools);
   - **Language** — English;
   - **Store icon** — `icons/icon-128.png`;
   - **Screenshots** — 3 файла из `store/images/` (1280×800);
   - **Small promo tile** — `store/images/promo-tile-440x280.png`;
   - **Homepage URL / Support URL** — ссылка на GitHub.
6. Вкладка **Privacy** (тексты — раздел «Chrome Web Store: Privacy practices tab»):
   - **Single purpose**;
   - **Permission justification** для `storage` и для доступа к youtube.com;
   - **Remote code** → No;
   - **Data usage** → ничего не отмечать, поставить три галки-сертификации внизу.
7. Вкладка **Distribution**: **Public**, все регионы.
8. **Submit for review** (справа сверху). Ревью — обычно от пары дней до недели.

---

## 3. (По желанию) Microsoft Edge — бесплатно

1. https://partner.microsoft.com/dashboard/microsoftedge → зарегистрироваться как разработчик (бесплатно).
2. **Create new extension** → загрузить тот же zip.
3. Тексты и картинки — те же, что для Chrome.

---

## 4. Когда опубликовано

- Скажи мне ссылки на страницы в магазинах — добавлю их в README (раздел Install).
- Каждое следующее обновление: поднять `version` в `manifest.json` (например, 0.3.1), `npm run build`, загрузить новый zip:
  - AMO: страница расширения → **Upload New Version**;
  - Chrome: item → **Package** → **Upload new package** → Submit for review.
