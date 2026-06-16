# План рефакторингу — приведення коду до дизайн-стандарту

Мета: усунути **24 неконсистентності** з аудиту, додати **19 нових токенів** (+ `btn("ghost")`,
`Modal`, `OrDivider`, набір `GLYPH`) і мігрувати ~20 файлів — **без зміни функціоналу**.
Стандарт — [docs/design-system/](../design-system/README.md), рішення — [ADR](../architecture/adr/README.md).

## Принципи

- **Commit-to-main = deploy** ([ADR-0020](../architecture/adr/0020-commit-to-main-equals-deploy.md)).
  Тому **кожен етап — атомарний**: самодостатній, лишає `tsc --noEmit` + `next build` зеленими,
  візуально безпечний. Один етап = один коміт. Пуш — лише на прохання засновника.
- **Спершу токени, потім call-sites.** Етап 0 додає всі токени адитивно (0 візуальних змін).
  Далі мігруємо посилання дрібними порціями. Найризикованіше (`BugReport`) — наприкінці.
- **Тестів немає** → кожен етап має **ручну перевірку** (світла + темна тема).
- **Відкат** = `git revert` одного коміту (етапи малі й незалежні).
- Не змінюємо функціонал — лише стиль/структуру. Винятки явно позначені (i18n-ключі в Етапі 6, `ghost` в 9).

## Залежності між етапами

```
Етап 0 (токени) ──┬── Етапи 1–5 (незалежні, низький ризик, будь-який порядок)
                  ├── Етап 6 (хелпери статусів)
                  ├── Етап 7 (ритм/ширини)
                  ├── Етап 8 (icon/overlay/fab + Modal) ──┐
                  ├── Етап 9 (ghost) ─────────────────────┴── Етап 10 (BugReport)
                  ├── Етап 11 (гліфи, незалежний)
                  └── Етап 12 (прибирання, останній)
```

---

## Етапи

### Етап 0 — Токени (без візуальних змін) · ризик: мінімальний
Додати **все** в `components/ui`, але ще не застосовувати — адитивно, UI не змінюється.
- `buttons.ts`: `ButtonKind += "ghost"`; `btn("ghost")` = `BTN_BASE` + `bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-800`.
- `styles.ts`: `link`, `warnText`, `emptyState`, `fieldLabel`, `legend`, `fieldBox`, `checkbox`, `radio`, `fileInput`, `listCard`, `iconBtn`, `overlayBtn`/`overlayIconBtn`, `fab`, `price`, `metaFaint`, `wordmark`, `successIconCircle`.
- `styles.ts`: хелпери `gameStatusBadge()`, `referralStatusBadge()`.
- Нові файли: `components/ui/Modal.tsx`, `components/ui/OrDivider.tsx`, набір `GLYPH` (в `styles.ts` або `glyphs.ts`).
- `index.ts`: реекспорт нового.
- **Перевірка:** `tsc` + `build` зелені; жоден екран не змінився.
- **Готує:** [ADR-0023](../architecture/adr/0023-tokenize-recurring-recipes.md), [0026](../architecture/adr/0026-icon-overlay-fab-and-modal.md).

### Етап 1 — Інлайн-посилання → `ui.link` · ризик: низький
**7 файлів:** `GameCard`, `GameActions`, `AnnouncementBlock`, `app/page.tsx`, `admin/locations`, `admin/games/[id]`, `admin/games`. Замінити `text-[var(--c-brand-text)] hover:underline` на `ui.link`, прибрати `font-medium`-дрейф. Заголовок-посилання на home (`cardTitle` + hover-brand) лишити як є.
- **Перевірка:** усі посилання клікаються, колір/підкреслення на hover ок.
- **Закриває:** дублювання інлайн-лінка. [ADR-0023](../architecture/adr/0023-tokenize-recurring-recipes.md)

### Етап 2 — Порожні стани → `ui.emptyState` · ризик: низький-середній
`app/page.tsx`, `app/shop`, `app/games`, `RankingTable` (dashed-бокс) + кабінет (3 голі `text-sm text-gray-500` «порожньо»). Уніфікувати на `ui.emptyState`.
- ⚠️ `border-dashed` у `BugReport` (кнопка «прикріпити») і `SocialLinks` — **не** порожні стани: перевірити кожен, BugReport-attach → `ghost` в Етапі 10.
- **Закриває:** 3 стилі порожнього стану.

### Етап 3 — Поля форм · ризик: середній
- `accent-brand` (**10 у 6 файлах:** shop, chores, RegisterForm×3, locations×3, roles, settings) → `ui.checkbox`/`ui.radio`; **виправити дрібні радіо** в `RegisterForm` (зараз без `h-4 w-4`).
- Підписи полів → `ui.fieldLabel` (text-sm, [OD2]); підпідписи всередині fieldset → `ui.meta`.
- fieldset-бокс → `ui.fieldBox`; legend → `ui.legend`; `GalleryUploader` file-input → `ui.fileInput`.
- **Перевірка:** форми локацій/налаштувань/chores/реєстрації — поля рівні, чекбокси однакового розміру.
- **Закриває:** підпис поля sm/xs; чекбокс/радіо; fieldset-бокс. [ADR-0023](../architecture/adr/0023-tokenize-recurring-recipes.md)

### Етап 4 — Картки/поверхні → `ui.card`/`ui.cardHover`/`ui.listCard` · ризик: низький-середній
shop ShopTile (`app/shop:84`), social fieldset (`admin/social:27`), roles box (`admin/roles:79`, дрейф `bg-gray-50 p-4`), історія балів кабінету → `ui.listCard`.
- **Закриває:** хардкод поверхні картки.

### Етап 5 — Сірі рівні + семантичний текст · ризик: низький
- `text-gray-400` → `ui.metaFaint` [OD3] (cabinet, GameCard, settings-ключі, social, locations-meta…).
- `text-amber-600` → `ui.warnText` (`admin/games/[id]:73`).
- `font-mono` (`admin/roles:84`, **єдиний у застосунку**) → прибрати → `ui.bodyStrong` + brand-text.
- Профіль кабінету: `dt`→`ui.meta`, `dd`→`ui.bodyStrong` (6 рядків).
- **Закриває:** gray-400-розкид; warn-текст; порушення one-font. [ADR-0023](../architecture/adr/0023-tokenize-recurring-recipes.md)

### Етап 6 — Статус-пігулки: хелпери + локалізація · ризик: середній · [OD5]
- `gameStatusBadge()`/`referralStatusBadge()` замість тернарів (`admin/games:116`, `games/[id]:86`, `cabinet:194`, joins, referrals); дефолт невідомого → `gray`.
- Додати i18n-ключі `gamest_*`/`regst_*`, **локалізувати** адмін-пігулки (зараз сирий enum).
- **Перевірка:** усі статуси (announced/registered/cancelled/no_show/pending/hidden) — правильні колір+текст на адмінці й у кабінеті.
- **Закриває:** копії тернара; сирий enum. [ADR-0025](../architecture/adr/0025-status-badge-helpers.md)

### Етап 7 — Ритм сторінки + ширини · ризик: середній · [OD8]
- Корінь сторінок → `ui.pageStack`: `app/games:62` (`space-y-10`→pageStack), `cabinet:125` (`space-y-8`→pageStack). `app/page.tsx:40` (лендінг) — лишити `space-y-10` як **задокументований виняток** ([05-exceptions](../design-system/05-exceptions.md)).
- `max-w-[66rem]` → іменована константа; центровані: login/`AuthForm`/check-email (`max-w-sm/md`) → `narrow` (`max-w-md`); cabinet (`max-w-lg/2xl`) → `prose` (`max-w-2xl`).
- Заголовок→контент → `mb-3` на заголовку (прибрати `mt-1/2/3`-дрейф).
- **Закриває:** ритм; ширини; інтервали. [ADR-0024](../architecture/adr/0024-standardize-rhythm-and-widths.md)

### Етап 8 — Іконкові/overlay/FAB + Modal/OrDivider · ризик: середній
- `ThemeToggle`, хрестики → `ui.iconBtn`. Лайтбокс `GalleryGrid` (prev/next/close) → `ui.overlayBtn`/`ui.overlayIconBtn`. FAB → `ui.fab` (єдиний `dark:`).
- «АБО»-роздільник (cabinet, login) → `OrDivider`.
- **Перевірка:** галерея (стрілки/закриття/Esc), перемикач теми.
- **Закриває:** розрізнені іконкові/overlay/FAB. [ADR-0026](../architecture/adr/0026-icon-overlay-fab-and-modal.md)

### Етап 9 — Ghost для вторинних дій · ризик: низький-середній · [OD6]
- `AuthForm:74`: перемикач режиму → `ui.link` (не друга повноширинна `btn("action")`).
- Нейтральні **кнопки** → `btn("ghost")`.
- **Закриває:** друга праймері в AuthForm. [ADR-0026](../architecture/adr/0026-icon-overlay-fab-and-modal.md)

### Етап 10 — Міграція BugReport · ризик: ВИСОКИЙ · [OD1]
`components/BugReport.tsx` → на дизайн-систему: `Modal` (rounded-lg), `btn("action")` (надіслати),
`btn("ghost")` (cancel) + тригер «прикріпити», `ui.input` (поля), `ui.iconBtn` (хрестик),
`ui.negText` (помилки), `ui.successIconCircle` (замість `bg-emerald-50`), `--c-brand-text` (іконка).
FAB лишається `ui.fab`.
- **Перевірка (ретельна):** надсилання → успіх; помилка мережі; прикріплення/видалення PNG/JPG; завеликий файл; клік по бекдропу (натиск почався на бекдропі); Esc; світла й темна тема; кнопка не блокує під час `sending`.
- **Закриває:** найбільший «острів» поза системою. [ADR-0028](../architecture/adr/0028-bugreport-migrate-or-whitelist.md)

### Етап 11 — Гліфи-константи · ризик: низький · [OD4]
Набір `GLYPH` (date/place/points/balance/rank/game…) → однакове вживання в home, `GameCard`, cabinet, ranking, `PlayersAdmin`.
- **Закриває:** емодзі-індикатори ad hoc. [ADR-0027](../architecture/adr/0027-emoji-glyph-policy.md)

### Етап 12 — Прибирання + захист від регресій · ризик: низький
- `overflow-x-auto` + `bg-white` внести в `ui.tableWrap` (щоб публічні таблиці теж не обрізались).
- Ряд дій: канонічний порядок [save][delete]…`ml-auto` (locations — еталон; виправити roles/shop).
- `disabled:opacity-50` всюди (прибрати 40/60); канон focus-ring; ціна/баланс → `ui.price`.
- Оновити [tokens-reference](../design-system/tokens-reference.md): перенести нові токени з «Запропоновані» в «Чинні».
- Опційно: grep-guard/ESLint проти хардкоду (`text-brand*`, дубль-рецепти, off-scale розміри).
- **Закриває:** решта дрібних неконсистентностей.

---

## Зведена таблиця

| Етап | Суть | Файли | Ризик | ADR |
|---|---|---|---|---|
| 0 | Токени (адитивно) | `ui/*` | мінімальний | 0023, 0026 |
| 1 | `ui.link` | 7 | низький | 0023 |
| 2 | `ui.emptyState` | ~5 | низ-сер | 0023 |
| 3 | Поля (checkbox/label/box) | ~6 | середній | 0023 |
| 4 | Картки/поверхні | ~4 | низ-сер | 0010 |
| 5 | Сірі + warn + font-mono | ~10 | низький | 0023 |
| 6 | Статус-хелпери + i18n | ~5 | середній | 0025 |
| 7 | Ритм + ширини | ~6 | середній | 0024 |
| 8 | icon/overlay/fab + Modal | ~4 | середній | 0026 |
| 9 | Ghost | ~2 | низ-сер | 0026 |
| 10 | **BugReport** | 1 | **високий** | 0028 |
| 11 | Гліфи | ~5 | низький | 0027 |
| 12 | Прибирання + guard | ~6 | низький | усі |

## Definition of Done (на кожен етап)

- [ ] `tsc --noEmit` зелений
- [ ] `next build` зелений
- [ ] Ручна перевірка змінених екранів — світла **і** темна тема
- [ ] Без зміни функціоналу (крім явно зазначеного: i18n в Е6, ghost в Е9)
- [ ] Один коміт = один етап; повідомлення з номером етапу
- [ ] Оновлено трекер нижче

## Трекер прогресу

> ✅ **Виконано 2026-06-16** (локально, не закомічено). `tsc --noEmit` і `next build` — зелені.
> Усі 28 ADR-токенів у `components/ui`; ~27 файлів мігровано; BugReport на дизайн-системі;
> статус-пігулки локалізовано (`gamest_*`/`regst_*`/`joinst_*`/`refst_*` + `statusText`).

| Етап | Статус |
|---|---|
| 0 — Токени | ✅ |
| 1 — ui.link | ✅ |
| 2 — emptyState | ✅ |
| 3 — Поля | ✅ |
| 4 — Картки | ✅ |
| 5 — Сірі/warn/mono | ✅ |
| 6 — Статус-хелпери | ✅ |
| 7 — Ритм/ширини | ✅ |
| 8 — icon/overlay/Modal | ✅ |
| 9 — Ghost | ✅ |
| 10 — BugReport | ✅ |
| 11 — Гліфи | ✅ |
| 12 — Прибирання | ✅ |

**Лишилось (ручне):** візуальна перевірка у браузері (світла+темна тема) і коміт — на твоє рішення.
Свідомо лишені винятки: лендінг `space-y-10` (home), dashed-плитки соцмереж (`SocialLinks`), `space-y-8` усередині форми соцмереж.
