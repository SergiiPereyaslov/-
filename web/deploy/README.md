# Розгортання

Два способи: Docker (простіше) або systemd на голому сервері.

## Обов'язково перед першим запуском

**Локаль бази даних.** Кластер PostgreSQL має бути створений з UTF-8:

```bash
initdb --encoding=UTF8 --locale=C.UTF-8
# або в docker-compose це вже задано через POSTGRES_INITDB_ARGS
```

При локалі `C` PostgreSQL не згортає кирилицю в нижній регістр
(`lower('СТАКАН')` повертає `СТАКАН`), тому запити з `ILIKE` по українському
тексту мовчки нічого не знаходять. Сам сайт від цього не постраждає — пошук
працює через окреме нормалізоване поле, — але будь-який ручний SQL по базі
поводитиметься неочікувано.

## Docker

```bash
cp .env.example .env        # заповнити паролі й токени
docker compose up -d --build

# Разові команди виконує окремий образ migrate: у ньому повний
# node_modules, бо CLI Prisma тягне багато залежностей
docker compose run --rm migrate
docker compose run --rm migrate node --experimental-strip-types prisma/seed.ts
docker compose run --rm migrate node scripts/create-admin.mjs \
  sales@smartecopack.com "надійний-пароль" "Менеджер"
```

> **Не перевірено в цьому середовищі.** Dockerfile і compose написані, але
> зібрати образ під час розробки не вдалося — у пісочниці не запущений
> демон Docker. Перший `docker compose build` варто зробити на тестовому
> сервері, не одразу на бойовому.

Далі nginx на хості (`deploy/nginx.conf`) і сертифікат:

```bash
sudo certbot --nginx -d smartecopack.com -d www.smartecopack.com
```

## Без Docker

```bash
# на сервері
sudo adduser --system --group --home /srv/smartecopack smartecopack
sudo -u smartecopack git clone <repo> /srv/smartecopack/repo
cd /srv/smartecopack/repo/web
npm ci
NEXT_PUBLIC_SITE_URL=https://smartecopack.com npm run build

# standalone-збірка потребує статики поруч
cp -r public .next/standalone/
cp -r .next/static .next/standalone/.next/
cp -r prisma .next/standalone/
ln -sfn /srv/smartecopack/repo/web/.next/standalone /srv/smartecopack/current

sudo install -m 600 /dev/stdin /etc/smartecopack.env <<'ENV'
DATABASE_URL=postgresql://smartecopack:пароль@localhost:5432/smartecopack
NEXT_PUBLIC_SITE_URL=https://smartecopack.com
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
ENV

sudo cp deploy/smartecopack.service /etc/systemd/system/
sudo systemctl daemon-reload && sudo systemctl enable --now smartecopack
```

> **Обережно з `.next/standalone/.env`.** Next копіює файл `.env` у
> standalone-збірку. Якщо збирати на машині розробника й переносити теку
> на сервер, разом із нею поїдуть локальні секрети. Docker-збірка цього
> не робить (`.env` виключений у `.dockerignore`), а при ручному
> розгортанні збирайте на сервері або видаляйте файл перед копіюванням.

## Оновлення

```bash
git pull
npm ci
npm run build
npx prisma migrate deploy      # міграції — окремим кроком, до перезапуску
sudo systemctl restart smartecopack
```

## Резервне копіювання

База — єдине сховище каталогу, заявок і статей. Щоденний дамп:

```bash
0 3 * * * pg_dump -Fc smartecopack > /var/backups/sep-$(date +\%F).dump
```

Перевіряйте відновлення хоча б раз на квартал — дамп, який ніхто не
відновлював, не є резервною копією.
