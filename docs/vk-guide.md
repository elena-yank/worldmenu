# Как это устроено и как встроить в VK

Документ про проект «Меню-плитки»: что внутри, как оно общается с VK и что нужно сделать,
чтобы приложение открывалось внутри ВКонтакте как мини-приложение (VK Mini App).

---

## 1. Что это за проект

Одностраничное веб-приложение (SPA), которое собирается в набор статических файлов
(`index.html` + JS/CSS/картинки) и открывается внутри VK в iframe (десктоп) или WebView (мобильные).

Стек:

| Слой | Технология |
| --- | --- |
| Сборка | [Vite](https://vitejs.dev/) 5 |
| UI | React 18 + TypeScript |
| Компоненты | [VKUI](https://vkui.io/) 6 (`@vkontakte/vkui`) |
| Иконки | `@vkontakte/icons` |
| Общение с VK | [`@vkontakte/vk-bridge`](https://www.npmjs.com/package/@vkontakte/vk-bridge) |

Ключевая идея: **приложение — обычный сайт**. VK не даёт никакого специального рантайма,
он просто открывает ваш URL и прокидывает в страницу объект-мост (`window.vkBridge`),
через который сайт может спрашивать у клиента VK данные и выполнять действия.

---

## 2. Как устроено внутри

### 2.1. Файлы и роли

```
index.html                  # точка входа, <div id="root">
src/main.tsx                # провайдеры VKUI + инициализация VK + тема
src/App.tsx                 # экран: PanelHeader + сетка плиток + обработка клика
src/vkBridge.ts             # весь контакт с VK (единственное место!)
src/data/menu.ts            # содержимое меню: плитки и текст модальных окон
src/components/Tile.tsx     # плитка (VKUI Card), доступна с клавиатуры
src/components/InfoModal.tsx# ModalRoot + ModalPage, рендер блоков контента
src/styles.css              # сетка, плитки, блоки контента
src/assets/*.svg            # картинки плиток
vite.config.ts              # сборка, dev-сервер на 5173
```

### 2.2. Поток запуска

1. VK открывает `https://<ваш-домен>/` в iframe/WebView.
2. Загружается [`index.html`](index.html), подключается [`src/main.tsx`](src/main.tsx).
3. `Root` в [`src/main.tsx`](src/main.tsx:13) монтирует провайдеры VKUI:
   `ConfigProvider` (тема) → `AdaptivityProvider` (адаптив) → `AppRoot` (скролл/portal-контейнеры).
4. В `useEffect` вызывается [`initVk()`](src/vkBridge.ts:27):
   - `VKWebAppInit` — обязательный «hello» для клиента VK: без него VK не считает
     приложение инициализированным (не подстраивает высоту iframe, не шлёт конфиг и т.д.);
   - `VKWebAppGetUserInfo` — данные текущего пользователя (в этом проекте результат
     используется опционально, приложение работает и без него).
5. Параллельно [`subscribeAppearance()`](src/vkBridge.ts:51) подписывается на
   `VKWebAppUpdateConfig` и один раз спрашивает `VKWebAppGetConfig`, чтобы узнать
   текущую схему оформления (`bright_light` / `client_light` / тёмные) и передать её в VKUI.
6. Рендерится [`App`](src/App.tsx:9): заголовок и плитки из `MENU_ITEMS`.
7. Клик по плитке:
   - `kind: 'modal'` → открывается `ModalPage` с id плитки;
   - `kind: 'app'` → [`openVkApp()`](src/vkBridge.ts:78) вызывает `VKWebAppOpenApp`
     с `app_id`, а если моста нет (обычный браузер) — открывает `url` в новой вкладке.

### 2.3. Какие методы VK Bridge используются

| Метод | Где | Зачем |
| --- | --- | --- |
| `VKWebAppInit` | [`initVk()`](src/vkBridge.ts:27) | обязательная инициализация мини-приложения |
| `VKWebAppGetUserInfo` | [`initVk()`](src/vkBridge.ts:27) | получить id/имя/аватар пользователя |
| `VKWebAppGetConfig` | [`subscribeAppearance()`](src/vkBridge.ts:51) | узнать текущую тему оформления |
| `VKWebAppUpdateConfig` (событие) | [`subscribeAppearance()`](src/vkBridge.ts:51) | тема поменялась «на лету» |
| `VKWebAppOpenApp` | [`openVkApp()`](src/vkBridge.ts:78) | открыть другое мини-приложение по `app_id` |

Все вызовы обёрнуты в `try/catch`: **вне VK (в обычном браузере) bridge отклоняет промисы**,
и это штатное поведение — приложение просто остаётся в светлой теме и без данных пользователя.

### 2.4. Контент

Всё содержимое — в [`src/data/menu.ts`](src/data/menu.ts). Тип `MenuItem` — объединение
`ModalMenuItem` (`kind: 'modal'`) и `LinkMenuItem` (`kind: 'app'`). Модальное окно создаётся
автоматически для каждой плитки `kind: 'modal'`, контент собирается из блоков
`lead / heading / text / list / facts / contacts`.

---

## 3. Что значит «вставить в VK»

Технически «вставить в VK» = **зарегистрировать в кабинете VK Mini Apps URL вашего сайта**.
Дальше VK сам показывает приложение:

- на десктопе — в iframe внутри `vk.com`;
- в мобильных приложениях VK — в WebView;
- по прямой ссылке `https://vk.com/app<APP_ID>`.

Требования, которые важны на старте:

1. **HTTPS** — VK не откроет `http://`.
2. **Публичный адрес** — `localhost` не подойдёт (для разработки есть туннели, см. § 5).
3. **Статика** — сборка `dist/` должна открываться как сайт (все пути корректны).
4. **`VKWebAppInit`** — уже вызывается в проекте.

---

## 4. Пошаговая инструкция: публикация

### Шаг 1. Собрать проект

```bash
npm install
npm run build
```

Результат — папка `dist/`. Проверить локально:

```bash
npm run preview
```

### Шаг 2. Выложить `dist/` на HTTPS-хостинг

Варианты (все подходят):

- **VK Mini Apps Hosting** через официальный пакет `@vkontakte/vk-miniapps-deploy` —
  самый простой путь, раздаёт статику с домена VK. Пример конфига `vk-hosting-config.json`
  в корне проекта:

  ```json
  {
    "app_id": 00000000,
    "static_path": "dist",
    "endpoints": {
      "mobile": "index.html",
      "mvk": "index.html",
      "web": "index.html"
    }
  }
  ```

  Деплой:

  ```bash
  npx @vkontakte/vk-miniapps-deploy
  ```

  Подробности — в README пакета (ссылка в § 7).

- **GitHub Pages / Netlify / Vercel / Cloudflare Pages** — любой статический хостинг с HTTPS.
- **Свой сервер** (nginx, Caddy) — тогда HTTPS-сертификат (Let's Encrypt) на вас.

> Если приложение лежит не в корне домена (например, `https://site.ru/app/`), задайте
> `base: '/app/'` в [`vite.config.ts`](vite.config.ts:7) и пересоберите. Иначе ассеты
> будут запрашиваться из корня и вы увидите белый экран.

### Шаг 3. Создать мини-приложение в кабинете VK

1. Откройте [dev.vk.com](https://dev.vk.com/ru) и войдите под своим аккаунтом VK.
2. «Мои приложения» → «Создать приложение» → тип **Mini App** (мини-приложение).
3. Заполните название, иконки, категорию.
4. В настройках укажите:
   - **URL приложения (Mobile/Web)** — адрес из шага 2 (HTTPS);
   - при необходимости — **базовый домен** и разрешённые redirect-URL;
   - платформы: Web, Mobile Web, iOS, Android (что нужно).
5. Сохраните. VK выдаст `app_id` — он же используется в ссылке `https://vk.com/app<app_id>`
   и в `VKWebAppOpenApp` (в проекте это [`appId`](src/data/menu.ts:77)).

### Шаг 4. Проверить внутри VK

- Откройте `https://vk.com/app<app_id>` на десктопе и в мобильном приложении VK.
- Убедитесь, что: приложение инициализируется (нет ошибок в консоли iframe), тема совпадает
  с темой VK, плитки открывают окна, плитка «Получить палочку» открывает другое мини-приложение.
- Если что-то не так — включите отладку через `vk-bridge`/`eruda` и смотрите консоль
  (в мобильном WebView консоль недоступна без инструментов).

### Шаг 5. Модерация и публикация

Мини-приложение проходит проверку модерацией VK (правила, работа без ошибок, корректные
данные в карточке). После одобрения приложение становится доступно всем.
Правила и процесс публикации — в разделах «Публикация» и «Правила» на dev.vk.com (§ 7).

---

## 5. Локальная разработка внутри VK

VK требует HTTPS и публичный адрес, поэтому `http://localhost:5173` напрямую не подойдёт.
Два рабочих способа:

1. **VK Tunnel** (официальный):

   ```bash
   npm run dev
   # в другом терминале
   npx @vkontakte/vk-tunnel --app-id=<APP_ID> --port=5173
   ```

   Пакет выдаст HTTPS-адрес туннеля и подскажет, как открыть приложение в VK.
   Актуальные флаги — в README пакета.

2. **Сторонний туннель** (ngrok, cloudpub и т.п.) — пробросить порт 5173 и указать
   полученный HTTPS-URL в настройках приложения на dev.vk.com.

`vite.config.ts` уже содержит `server.host = true`, так что dev-сервер слушает не только
`localhost` — это нужно для туннелей и тестов с телефона в той же сети.

---

## 6. Частые проблемы

| Симптом | Причина / решение |
| --- | --- |
| Белый экран в VK, локально всё ок | `base` в Vite не совпадает с путём деплоя; ассеты 404 |
| «Bridge is not available» в консоли | Открыли сайт в обычном браузере, а не через VK — это нормально |
| VK не подстраивает высоту iframe | Не вызван `VKWebAppInit` или вызван позже первого рендера |
| Приложение не открывается по ссылке | URL не HTTPS, недоступен публично или не сохранён в настройках |
| `VKWebAppOpenApp` падает | Неверный `app_id`, приложение удалено/не опубликовано, нет прав |
| Тема не переключается | Не подписаны на `VKWebAppUpdateConfig` (в проекте уже сделано) |
| Не работает `VKWebAppGetUserInfo` | Пользователь не авторизован / нет прав в настройках приложения |

Если в будущем понадобится **бэкенд** (хранение данных, платежи, проверка пользователя),
параметры запуска (`vk_user_id`, `sign`) нужно проверять на сервере по секретному ключу
приложения — см. раздел про параметры запуска в документации (§ 7).

---

## 7. Ссылки на документацию

Официальные источники (разделы dev.vk.com иногда переименовывают — если ссылка не открылась,
ищите по названию в левом меню сайта):

**VK Mini Apps**
- Обзор платформы: <https://dev.vk.com/ru/mini-apps/overview>
- Первое мини-приложение (пошагово): <https://dev.vk.com/ru/mini-apps/development/first-app>
- Параметры запуска и их подпись: <https://dev.vk.com/ru/mini-apps/development/launch-parameters>
- Публикация и модерация: <https://dev.vk.com/ru/mini-apps/publishing>
- Правила размещения: <https://dev.vk.com/ru/mini-apps/rules>
- Кабинет приложений: <https://dev.vk.com/ru>

**VK Bridge (мост к клиенту VK)**
- Обзор и установка: <https://dev.vk.com/ru/bridge/overview>
- Список всех методов: <https://dev.vk.com/ru/bridge/reference/overview>
- `VKWebAppInit`: <https://dev.vk.com/ru/bridge/reference/VKWebAppInit>
- `VKWebAppGetUserInfo`: <https://dev.vk.com/ru/bridge/reference/VKWebAppGetUserInfo>
- `VKWebAppGetConfig`: <https://dev.vk.com/ru/bridge/reference/VKWebAppGetConfig>
- `VKWebAppUpdateConfig`: <https://dev.vk.com/ru/bridge/reference/VKWebAppUpdateConfig>
- `VKWebAppOpenApp`: <https://dev.vk.com/ru/bridge/reference/VKWebAppOpenApp>
- Пакет на npm: <https://www.npmjs.com/package/@vkontakte/vk-bridge>

**UI и деплой**
- VKUI (компоненты, темы, гайды): <https://vkui.io/>
- VKUI на npm: <https://www.npmjs.com/package/@vkontakte/vkui>
- `@vkontakte/icons`: <https://www.npmjs.com/package/@vkontakte/icons>
- VK Mini Apps Hosting (деплой статики): <https://www.npmjs.com/package/@vkontakte/vk-miniapps-deploy>
- VK Tunnel (локальная разработка в VK): <https://www.npmjs.com/package/@vkontakte/vk-tunnel>
- Vite (сборка, `base`, `server.host`): <https://vitejs.dev/config/>

---

## 8. Короткий чек-лист

- [ ] `npm run build` проходит без ошибок типов.
- [ ] `dist/` выложен на HTTPS-хостинг, открывается как сайт.
- [ ] `base` в [`vite.config.ts`](vite.config.ts:7) соответствует пути деплоя.
- [ ] В кабинете VK Mini Apps создано приложение и указан URL.
- [ ] `VKWebAppInit` вызывается при старте (уже есть).
- [ ] Проверено на десктопе и в мобильном VK.
- [ ] Плитка-ссылка ведёт на существующее мини-приложение (`appId` верный).
- [ ] Приложение отправлено на модерацию.
