# VK Mini App «Меню-плитки»

Мини-приложение для VK: главный экран — сетка плиток с изображениями. Плитка может открывать диалоговое окно с информацией или другое мини-приложение VK.

Стек: **React 18 + TypeScript + VKUI 6 + vk-bridge + Vite**.

## Разделы меню

| № | Плитка | Действие |
| --- | --- | --- |
| 1 | Информация | Окно с текстом «привет мир» |
| 2 | Распределение | Окно с текстом «привет мир» |
| 3 | Получить палочку | Открывает приложение VK [app54660044](https://vk.ru/app54660044) |
| 4 | Администрация | Окно с текстом «привет мир» |
| 5 | Придира | Окно с текстом «привет мир» |

Приложение VK открывается через `VKWebAppOpenApp` (`app_id: 54660044`). Если bridge недоступен (обычный браузер) — открывается ссылка `https://vk.ru/app54660044`.

## Возможности

- Пять вертикальных плиток-колонок на всю высоту экрана (все разделы в один ряд по горизонтали).
- Модальные окна VKUI (`ModalRoot` + `ModalPage`) — одно окно на каждую плитку-раздел.
- Контент окна собирается из блоков: `lead`, `heading`, `text`, `list`, `facts`, `contacts`.
- Плитка-ссылка открывает другое мини-приложение VK.
- Инициализация `VKWebAppInit` при старте.
- Автоматическое переключение светлой/тёмной темы вслед за настройками VK.
- Доступность: плитки работают с клавиатуры (Enter / Space), есть `aria-label`.
- Работает и вне VK (в обычном браузере) — данные пользователя просто не загружаются.

## Запуск

Приложение опубликовано по адресу **https://quidditch.aurorhq.ru/worldmenu/** —
поэтому в [`vite.config.ts`](vite.config.ts) задан `base: '/worldmenu/'`, и локально
оно тоже открывается по подпути.

```bash
npm install
npm run dev      # http://localhost:5173/worldmenu/
npm run build    # проверка типов + production-сборка в dist/
npm run preview  # локальный предпросмотр сборки: http://localhost:4173/worldmenu/
```

> Если приложение нужно перенести в корень домена — уберите `base` из `vite.config.ts`
> и поменяйте пути в [`deploy/nginx.conf`](deploy/nginx.conf).

## Деплой через Docker

В проекте есть multi-stage [`Dockerfile`](Dockerfile): статика собирается на `node:20-alpine`,
а раздаётся `nginx:1.27-alpine` по подпути `/worldmenu/` (конфиг — [`deploy/nginx.conf`](deploy/nginx.conf)).

```bash
# сборка и запуск (контейнер слушает http://127.0.0.1:8087/worldmenu/)
docker compose up -d --build

# или без compose
docker build -t quidditch-worldmenu .
docker run -d -p 127.0.0.1:8087:80 --name quidditch-worldmenu quidditch-worldmenu
```

Проверка, что контейнер жив и отдаёт приложение:

```bash
curl -I http://127.0.0.1:8087/worldmenu/
```

Что учтено в nginx:

- `/worldmenu` → редирект на `/worldmenu/`;
- SPA-фолбэк: любой путь внутри `/worldmenu/` отдаёт `index.html`;
- `/worldmenu/assets/*` кешируется на год (`immutable`), `index.html` — без кеша;
- `/healthz` — эндпоинт для healthcheck контейнера;
- `/` → редирект на `/worldmenu/` (удалите этот блок, если корень домена занят другим сервисом).

### Внешний nginx на сервере

Наружу сайт отдаёт системный nginx (`/etc/nginx/sites-enabled/<имя-сайта>` на Debian/Ubuntu
или `/etc/nginx/conf.d/<имя-сайта>.conf` на RHEL/CentOS). Он принимает HTTPS и проксирует
`https://quidditch.aurorhq.ru/worldmenu/` в контейнер на `http://127.0.0.1:8087/worldmenu/`.

Готовый блок для вставки **внутрь существующего `server { ... }`** этого сайта —
в [`deploy/server-nginx.conf`](deploy/server-nginx.conf):

```nginx
location = /worldmenu {
    return 301 /worldmenu/;
}

location /worldmenu/ {
    proxy_pass http://127.0.0.1:8087;   # без слэша в конце!
    proxy_http_version 1.1;
    proxy_set_header Host              $host;
    proxy_set_header X-Real-IP         $remote_addr;
    proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Host  $host;
}
```

Важные моменты:

- `proxy_pass` указан **без завершающего слэша** — префикс `/worldmenu/` не срезается,
  потому что сборка Vite сделана под этот подпуть. Со слэшем получите 404 на ассетах.
- Нужен именно `proxy_pass`, а не `return 302 http://localhost:8087/...`: редирект отправит
  браузер пользователя на **его собственный** localhost, и сайт откроется только на самом сервере.
- Применение: `sudo nginx -t && sudo systemctl reload nginx`.
- Какой файл реально работает: `sudo nginx -T | less`.

VK требует HTTPS, поэтому итоговая ссылка для мини-приложения —
`https://quidditch.aurorhq.ru/worldmenu/`.

## Структура проекта

```
src/
  main.tsx              # провайдеры VKUI, тема, инициализация vk-bridge
  App.tsx               # экран: заголовок + сетка плиток + обработка клика
  vkBridge.ts           # VKWebAppInit, пользователь, тема, открытие приложения VK
  components/
    Tile.tsx            # плитка (Card)
    InfoModal.tsx       # ModalRoot со всеми модальными окнами
  data/menu.ts          # ВСЁ содержимое меню (плитки + текст в окнах)
  assets/*.svg          # иллюстрации плиток
  styles.css            # сетка, плитки, блоки контента
```

## Как менять содержимое

Всё описано в [`src/data/menu.ts`](src/data/menu.ts). Плитка с окном:

```ts
{
  kind: 'modal',              // плитка открывает диалоговое окно
  id: 'info',                 // уникальный id плитки и окна
  title: 'Информация',        // заголовок плитки
  image: aboutImage,          // картинка (импорт из src/assets или URL)
  accent: '#4C8DFF',          // цвет фона, пока картинка грузится
  modalTitle: 'Информация',   // заголовок окна
  blocks: [{ type: 'text', value: 'привет мир' }],
}
```

Плитка, открывающая приложение VK:

```ts
{
  kind: 'app',
  id: 'stick',
  title: 'Получить палочку',
  image: servicesImage,
  accent: '#FF9A3D',
  appId: 54660044,                       // id из ссылки vk.ru/app<id>
  url: 'https://vk.ru/app54660044',      // запасная ссылка вне VK
}
```

Доступные блоки контента:

| Тип | Описание |
| --- | --- |
| `lead` | Вводный абзац (приглушённый цвет) |
| `heading` | Подзаголовок внутри окна |
| `text` | Обычный абзац |
| `list` | Маркированный список (`items: string[]`) |
| `facts` | Сетка мини-карточек «значение + подпись» |
| `contacts` | Список контактов со ссылками (`href` необязателен) |

Чтобы добавить раздел — добавьте объект в `MENU_ITEMS`, плитка появится автоматически. Для плитки-окна окно создастся само, для плитки-ссылки достаточно `kind: 'app'`.

Картинки лежат в `src/assets/`. Замените файл или укажите внешний URL строкой.

## Подключение к VK

Подробная инструкция — в [`docs/vk-guide.md`](docs/vk-guide.md): как устроен проект изнутри,
как он общается с VK и как пошагово опубликовать его как мини-приложение (со ссылками на документацию).

Кратко:

1. Создайте мини-приложение на [dev.vk.com](https://dev.vk.com) → «Мини-приложения» → «Создать».
2. Укажите URL приложения. VK требует **HTTPS**, поэтому локальную разработку публикуйте через туннель (VK Tunnel, ngrok, cloudpub) или деплойте сборку.
3. Соберите проект (`npm run build`) и выложите содержимое `dist/` на любой статический хостинг (VK Hosting, GitHub Pages, Netlify, свой сервер).
4. Откройте приложение по ссылке из кабинета — оно само вызовет `VKWebAppInit` и подхватит тему VK.

Полезно знать:

- `VKWebAppInit` обязателен — вызывается в [`src/vkBridge.ts`](src/vkBridge.ts).
- Вне VK вызовы bridge отклоняются, ошибки перехвачены — приложение не падает.
- Для открытия другого приложения используется `VKWebAppOpenApp` с `app_id` (см. [`openVkApp()`](src/vkBridge.ts)).
