# Розгортання сайту SmartEcoPack з архіву

Покрокова інструкція для чистого сервера Ubuntu 22.04/24.04.
Орієнтовний час — 30–40 хвилин.

Якщо у вас уже налаштований Docker, є коротший шлях — див. [README.md](README.md).
Ця інструкція описує звичайне розгортання без Docker: Node + PostgreSQL + nginx.

---

## 0. Що потрібно мати до початку

| Ресурс | Мінімум | Коментар |
|---|---|---|
| Сервер | 2 vCPU, 2 ГБ RAM, 10 ГБ диска | Збірка Next.js — найважча операція, їй потрібна пам'ять |
| ОС | Ubuntu 22.04 або 24.04 | Інші дистрибутиви теж підійдуть, зміняться лише команди пакетного менеджера |
| Домен | A-запис на IP сервера | Потрібен до випуску сертифіката |
| Доступ | root або sudo | |

**Важливо про домен.** Адреса сайту вшивається у збірку — вона потрапляє
в canonical, hreflang і sitemap.xml. Тому домен треба знати **до** кроку
збірки, а при зміні домену сайт треба перезібрати.

---

## 1. Базове ПЗ

```bash
sudo apt update
sudo apt install -y curl git nginx postgresql postgresql-contrib

# Node.js 22 LTS — молодші версії не підійдуть: збірка використовує
# --experimental-strip-types для TypeScript-скриптів обслуговування
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

node -v    # має бути v22.x
npm -v
```

---

## 2. База даних

PostgreSQL має бути з локаллю UTF-8. Перевірте, що вже є:

```bash
sudo -u postgres psql -c "SHOW lc_collate;"
```

Якщо бачите `C` або `POSIX` замість `C.UTF-8`/`uk_UA.UTF-8` — кластер треба
перестворити з правильною локаллю. При локалі `C` PostgreSQL не згортає
кирилицю в нижній регістр (`lower('СТАКАН')` повертає `СТАКАН`), і будь-який
ручний SQL з `ILIKE` по українському тексту мовчки нічого не знаходить.
Сам сайт від цього не постраждає — пошук працює через окреме нормалізоване
поле, — але адміністрування бази стане неприємним.

Створіть користувача й базу:

```bash
sudo -u postgres psql <<'SQL'
CREATE USER smartecopack WITH PASSWORD 'ЗАМІНІТЬ_НА_НАДІЙНИЙ_ПАРОЛЬ';
CREATE DATABASE smartecopack OWNER smartecopack ENCODING 'UTF8';
SQL
```

Перевірка підключення:

```bash
psql "postgresql://smartecopack:ВАШ_ПАРОЛЬ@localhost:5432/smartecopack" -c "select 1"
```

---

## 3. Користувач системи й розпакування архіву

Сайт не повинен працювати від root.

```bash
sudo adduser --system --group --home /srv/smartecopack smartecopack
sudo mkdir -p /srv/smartecopack/repo
sudo chown -R smartecopack:smartecopack /srv/smartecopack

# завантажте архів на сервер (scp з вашого комп'ютера):
#   scp smartecopack-site.tar.gz root@ВАШ_СЕРВЕР:/tmp/

sudo tar -xzf /tmp/smartecopack-site.tar.gz -C /srv/smartecopack/repo
sudo chown -R smartecopack:smartecopack /srv/smartecopack/repo
cd /srv/smartecopack/repo
ls    # маєте побачити package.json, prisma/, src/, public/, deploy/
```

---

## 4. Змінні оточення

Один файл `.env` у теці проєкту — для збірки й обслуговування:

```bash
sudo -u smartecopack tee /srv/smartecopack/repo/.env > /dev/null <<'ENV'
DATABASE_URL="postgresql://smartecopack:ВАШ_ПАРОЛЬ@localhost:5432/smartecopack"
NEXT_PUBLIC_SITE_URL="https://smartecopack.com"

TELEGRAM_BOT_TOKEN=""
TELEGRAM_CHAT_ID=""
SMTP_HOST=""
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASSWORD=""
LEAD_EMAIL_TO="sales@smartecopack.com"

NEXT_PUBLIC_GA_ID=""
ADMIN_SESSION_SECRET="ДОВГИЙ_ВИПАДКОВИЙ_РЯДОК"
ENV

sudo chmod 600 /srv/smartecopack/repo/.env
```

Згенерувати секрет для сесій адмінки:

```bash
openssl rand -base64 48
```

Що станеться, якщо пропустити необов'язкові значення:

- **без Telegram/SMTP** — заявки все одно зберігаються в базі й видно в адмінці,
  але менеджер не отримає миттєвого сповіщення;
- **без `NEXT_PUBLIC_GA_ID`** — скрипт аналітики просто не вантажиться;
- **без `ADMIN_SESSION_SECRET`** — адмінка працювати не буде, це обов'язкове поле.

---

## 5. Залежності, міграції, наповнення бази

> **Порядок кроків важливий.** Збірка Next.js генерує 258 статичних сторінок
> і під час цього **читає каталог з бази**. Якщо база недоступна або порожня,
> `npm run build` впаде з помилкою `P1001: Can't reach database server`
> або збере сайт без товарів. Тому спочатку міграції й наповнення — потім збірка.

```bash
cd /srv/smartecopack/repo
sudo -u smartecopack npm ci                 # postinstall сам виконає prisma generate
sudo -u smartecopack npm run db:migrate     # створює таблиці (3 міграції)
sudo -u smartecopack npm run db:seed        # каталог і статті блогу
```

Очікуваний вивід сідування:

```
групи: 6
категорії: 32
товари: 134
статті: 10
```

---

## 6. Збірка

```bash
cd /srv/smartecopack/repo
sudo -u smartecopack npm run build
```

Займає 1–3 хвилини. У кінці має бути список згенерованих сторінок і жодної
помилки. Якщо збірка впала — див. розділ «Типові помилки» нижче.

Next.js збирає застосунок у режимі `standalone`: у `.next/standalone` лежить
мінімальний сервер із потрібними модулями. Статику й `public` треба покласти
поруч — інакше сайт відкриється без стилів і зображень:

```bash
cd /srv/smartecopack/repo
sudo -u smartecopack cp -r public .next/standalone/
sudo -u smartecopack cp -r .next/static .next/standalone/.next/
sudo -u smartecopack cp -r prisma .next/standalone/

sudo ln -sfn /srv/smartecopack/repo/.next/standalone /srv/smartecopack/current
```

> Next копіює `.env` у standalone-збірку. Це безпечно, якщо ви збираєте
> на самому сервері (як у цій інструкції). Якщо ж збирати на своєму
> комп'ютері й переносити теку — разом із нею поїдуть локальні секрети.

---

## 7. Автозапуск через systemd

```bash
sudo cp /srv/smartecopack/repo/deploy/smartecopack.service /etc/systemd/system/

# юніт читає змінні з окремого файлу з правами 600
sudo install -m 600 /dev/null /etc/smartecopack.env
sudo tee /etc/smartecopack.env > /dev/null <<'ENV'
DATABASE_URL=postgresql://smartecopack:ВАШ_ПАРОЛЬ@localhost:5432/smartecopack
NEXT_PUBLIC_SITE_URL=https://smartecopack.com
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
LEAD_EMAIL_TO=sales@smartecopack.com
ADMIN_SESSION_SECRET=ТОЙ_САМИЙ_СЕКРЕТ_ЩО_Й_У_.env
ENV

sudo systemctl daemon-reload
sudo systemctl enable --now smartecopack
sudo systemctl status smartecopack --no-pager
```

Перевірка, що застосунок відповідає локально:

```bash
curl -I http://127.0.0.1:3000/
curl -s http://127.0.0.1:3000/robots.txt
```

Логи:

```bash
sudo journalctl -u smartecopack -f
```

---

## 8. nginx і HTTPS

У файлі `deploy/nginx.conf` домен прописаний як `smartecopack.com`.
Якщо ваш домен інший — замініть його в усіх трьох блоках `server_name`.

```bash
sudo cp /srv/smartecopack/repo/deploy/nginx.conf /etc/nginx/sites-available/smartecopack
sudo ln -sfn /etc/nginx/sites-available/smartecopack /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

sudo nginx -t          # перевірка синтаксису
sudo systemctl reload nginx
```

Сертифікат Let's Encrypt:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d smartecopack.com -d www.smartecopack.com
```

> Конфіг nginx уже посилається на шляхи сертифікатів
> `/etc/letsencrypt/live/…`. Тому при першому запуску `nginx -t` **до**
> certbot може скаржитись на відсутні файли сертифіката — це нормально.
> Або спершу отримайте сертифікат у режимі `certbot certonly --nginx`,
> або тимчасово закоментуйте рядки `ssl_certificate*` і поверніть їх після.

---

## 9. Обліковий запис адміністратора

```bash
cd /srv/smartecopack/repo
sudo -u smartecopack npm run admin:create -- sales@smartecopack.com "надійний-пароль" "Менеджер"
```

Пароль — мінімум 10 символів. Далі паролі змінюються в самій адмінці:
`https://ваш-домен/admin`. Адмінка закрита від індексації (`robots.txt`
і мета-теги), але це не заміна надійному паролю.

---

## 10. Перевірка після розгортання

```bash
# головна віддає 200 і містить заголовок
curl -s https://smartecopack.com/ | grep -o "<title>.*</title>"

# карта сайту й robots
curl -s https://smartecopack.com/sitemap.xml | head -5
curl -s https://smartecopack.com/robots.txt

# сторінка категорії з товарами й фото
curl -s https://smartecopack.com/catalog/stakany-paperovi/ | grep -c "Фото зі складу"
```

У браузері варто пройти: головна → каталог → категорія → картка товару →
кошик → оформлення заявки. Заявка має з'явитися в адмінці (і в Telegram,
якщо токен заповнений).

Вбудовані перевірки якості контенту й мета-тегів (не обов'язкові, але корисні
перед публікацією) запускаються проти працюючого сайту:

```bash
cd /srv/smartecopack/repo
npx next start -p 3400 &          # окремий порт, щоб не чіпати бойовий процес
npm run check:meta                # довжини title/description по всіх сторінках
npm run check:content             # унікальність SEO-текстів категорій
kill %1
```

---

## 11. Оновлення сайту

```bash
cd /srv/smartecopack/repo

# 1. Розпакувати новий архів поверх (або git pull, якщо працюєте з репозиторію)
sudo -u smartecopack tar -xzf /tmp/smartecopack-site-новий.tar.gz -C /srv/smartecopack/repo

# 2. Залежності й міграції — ДО збірки
sudo -u smartecopack npm ci
sudo -u smartecopack npm run db:migrate

# 3. Збірка й розкладка статики
sudo -u smartecopack npm run build
sudo -u smartecopack cp -r public .next/standalone/
sudo -u smartecopack cp -r .next/static .next/standalone/.next/

# 4. Перезапуск
sudo systemctl restart smartecopack
```

`npm run db:seed` при оновленні **не потрібен** — він перезаписує каталог.
Запускайте його лише свідомо, коли оновили дані каталогу в коді.

---

## 12. Резервне копіювання

База — єдине сховище каталогу, заявок і статей. Щоденний дамп у cron:

```bash
sudo crontab -e
```

```cron
0 3 * * * sudo -u postgres pg_dump -Fc smartecopack > /var/backups/sep-$(date +\%F).dump
0 4 * * 0 find /var/backups -name 'sep-*.dump' -mtime +30 -delete
```

Відновлення:

```bash
sudo -u postgres pg_restore -d smartecopack --clean /var/backups/sep-2026-09-13.dump
```

Перевіряйте відновлення хоча б раз на квартал — дамп, який ніхто не
відновлював, резервною копією не є.

---

## 13. Типові помилки

**`Error: P1001: Can't reach database server`** під час `npm run build`
Збірка читає каталог з бази. Перевірте, що PostgreSQL запущений
(`systemctl status postgresql`), а `DATABASE_URL` у `.env` правильний —
включно з паролем і портом. Найчастіша причина — забули зробити міграції
й сідування до збірки.

**Сайт відкривається без стилів і картинок**
Не скопійовані `public` і `.next/static` у теку `.next/standalone`
(крок 6). Це не автоматично — Next навмисно лишає це на розгортання.

**`sudo systemctl status smartecopack` показує `status=203/EXEC`**
Юніт не знайшов `server.js`. Перевірте, що symlink `/srv/smartecopack/current`
веде саме на `.next/standalone`, а в ньому є `server.js`.

**Зображення товарів не оптимізуються / віддаються великими**
Оптимізатор Next потребує пакета `sharp`. Він ставиться разом із
залежностями, але standalone-збірка інколи його не переносить:

```bash
cd /srv/smartecopack/repo/.next/standalone && npm install sharp
sudo systemctl restart smartecopack
```

**Заявки не приходять у Telegram**
Перевірте `TELEGRAM_BOT_TOKEN` і `TELEGRAM_CHAT_ID` у `/etc/smartecopack.env`
(саме там, а не лише в `.env` — юніт читає окремий файл), і що бот доданий
у потрібний чат. Заявка в базі все одно збережеться — подивіться в адмінці.

**Помилка 502 від nginx**
Застосунок не піднявся або слухає інший порт. `journalctl -u smartecopack -n 50`
покаже причину. Юніт слухає `127.0.0.1:3000`, конфіг nginx проксіює туди ж.

**Після зміни домену в canonical лишився старий**
`NEXT_PUBLIC_SITE_URL` вшивається у збірку. Змініть значення в `.env`
і в `/etc/smartecopack.env`, потім **перезберіть** сайт (крок 6).

---

## Що перевірено, а що ні

Перевірено в середовищі розробки: `npm ci`, міграції, сідування, `npm run build`
(258 сторінок), `next start`, `check:meta`, `check:content`, робота сайту
в браузері.

Не перевірено на реальному сервері: systemd-юніт, конфіг nginx, випуск
сертифіката й збірка Docker-образу (у середовищі розробки не було
запущеного демона Docker). Це стандартні конфігурації, але перший запуск
краще робити на тестовому сервері, а не одразу на бойовому.
