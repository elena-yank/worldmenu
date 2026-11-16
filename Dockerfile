# ---------- 1. Сборка статики ----------
FROM node:20-alpine AS build

WORKDIR /app

# Сначала только манифесты — слой с зависимостями кешируется между сборками.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---------- 2. Раздача через nginx ----------
FROM nginx:1.27-alpine AS runtime

# Убираем дефолтный конфиг и подключаем свой (подпуть /worldmenu/).
RUN rm -f /etc/nginx/conf.d/default.conf
COPY deploy/nginx.conf /etc/nginx/conf.d/worldmenu.conf

# Vite собирает с base: '/worldmenu/', поэтому кладём файлы в /worldmenu.
COPY --from=build /app/dist /usr/share/nginx/html/worldmenu

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/healthz >/dev/null 2>&1 || exit 1

CMD ["nginx", "-g", "daemon off;"]
