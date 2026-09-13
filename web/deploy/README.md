# Розгортання

Два способи: Docker (простіше) або systemd на голому сервері.

> Розгортаєте з нуля на своєму сервері? Є детальна покрокова інструкція під
> чистий Ubuntu — [INSTALL.md](INSTALL.md). Цей файл — коротка довідка для тих,
> хто вже знає, що робить.

> **Збірка потребує заповненої бази.** `npm run build` генерує 258 статичних
> сторінок і читає каталог з PostgreSQL. Тому міграції й сідування виконуються
> **до** збірки, інакше буде `P1001: Can't reach database server` або сайт
> без товарів.

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

> ## ⚠️ Docker-шлях зараз не працює — потрібна переробка
>
> Образ не збирається, і це не дрібниця конфігурації, а структурна проблема.
>
> `next build` пре-рендерить 258 сторінок і **читає каталог з PostgreSQL**
> (перевірено: без бази збірка падає з `P1001 … Failed to collect page data`).
> Але на етапі `docker build`:
>
> - `DATABASE_URL` не передається — у Dockerfile є лише `ARG NEXT_PUBLIC_SITE_URL`
>   і `ARG NEXT_PUBLIC_GA_ID`;
> - `.env` виключений через `.dockerignore`, тож підхопити звідти теж нічого;
> - контейнер збірки не під'єднаний до мережі compose — `depends_on` керує
>   лише порядком **запуску**, а не збіркою, тому хост `db` не резолвиться.
>
> Через це `docker compose up -d --build` впаде на збірці образу.
> Команда `docker compose run --rm migrate` теж не врятує: стадія `migrate`
> оголошена як `FROM builder`, тобто для неї спершу виконується той самий
> `npm run build` — і падає так само. Міграції через Docker недоступні
> раніше, ніж буде полагоджена збірка.
>
> **Що робити зараз:** розгортати за інструкцією [INSTALL.md](INSTALL.md)
> (systemd + nginx) — цей шлях пройдений від початку до кінця й працює.
>
> **Щоб полагодити Docker,** потрібно щонайменше: винести стадію для
> міграцій так, щоб вона не залежала від `builder`, і дати збірці доступ
> до бази (окремий `ARG DATABASE_URL` + збірка в мережі, де видно `db`).
> Робити це наосліп не варто — перевіряти треба на машині з робочим
> демоном Docker.

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

# спочатку база: збірка читає з неї каталог
npm run db:migrate
npm run db:seed

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
npx prisma migrate deploy      # міграції — до збірки, а не після
npm run build
cp -r public .next/standalone/ && cp -r .next/static .next/standalone/.next/
sudo systemctl restart smartecopack
```

## Резервне копіювання

База — єдине сховище каталогу, заявок і статей. Щоденний дамп:

```bash
0 3 * * * pg_dump -Fc smartecopack > /var/backups/sep-$(date +\%F).dump
```

Перевіряйте відновлення хоча б раз на квартал — дамп, який ніхто не
відновлював, не є резервною копією.
