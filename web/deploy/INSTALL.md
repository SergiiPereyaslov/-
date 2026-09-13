# Розгортання сайту SmartEcoPack з архіву

Покрокова інструкція для чистого сервера Ubuntu 22.04/24.04.
Орієнтовний час — 30–40 хвилин.

Ця інструкція описує розгортання без Docker: Node + PostgreSQL + nginx.

> Docker-шлях зараз **неробочий**: збірка образу падає, бо `next build`
> потребує доступу до бази, а на етапі `docker build` його немає. Деталі
> й що саме треба полагодити — у [README.md](README.md). Користуйтесь цією
> інструкцією.

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

Створюємо **дві** ролі, а не одну:

```bash
sudo -u postgres psql <<'SQL'
-- Власник схеми: ним виконуються тільки міграції
CREATE USER sep_owner WITH PASSWORD 'ПАРОЛЬ_ВЛАСНИКА';
CREATE DATABASE smartecopack OWNER sep_owner ENCODING 'UTF8';

-- Роль застосунку: читає й пише дані, але не може змінювати схему
CREATE USER sep_app WITH PASSWORD 'ПАРОЛЬ_ЗАСТОСУНКУ';
SQL
```

Права для ролі застосунку (виконати вже в самій базі):

```bash
sudo -u postgres psql -d smartecopack <<'SQL'
GRANT CONNECT ON DATABASE smartecopack TO sep_app;
GRANT USAGE ON SCHEMA public TO sep_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO sep_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO sep_app;

-- Те саме автоматично для таблиць, які створять майбутні міграції
ALTER DEFAULT PRIVILEGES FOR ROLE sep_owner IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO sep_app;
ALTER DEFAULT PRIVILEGES FOR ROLE sep_owner IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO sep_app;
SQL
```

> **Навіщо дві ролі.** Якщо сайт працює власником бази, він має право
> `DROP TABLE` і `TRUNCATE` — а вони йому в роботі не потрібні жодного разу.
> Тоді будь-яка майбутня діра (вразливість у залежності, помилка в коді)
> дає зловмиснику не читання даних, а знищення бази. Розділення ролей
> коштує п'яти рядків і прибирає цілий клас наслідків.
>
> Порядок прав важливий: `GRANT ... ON ALL TABLES` діє лише на таблиці, що
> вже існують, тому цей блок виконують **після** міграцій (крок 5).
> `ALTER DEFAULT PRIVILEGES` закриває питання для наступних міграцій.

Перевірка підключення обома ролями:

```bash
psql "postgresql://sep_owner:ПАРОЛЬ_ВЛАСНИКА@localhost:5432/smartecopack" -c "select 1"
psql "postgresql://sep_app:ПАРОЛЬ_ЗАСТОСУНКУ@localhost:5432/smartecopack" -c "select 1"
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
DATABASE_URL="postgresql://sep_app:ПАРОЛЬ_ЗАСТОСУНКУ@localhost:5432/smartecopack"
NEXT_PUBLIC_SITE_URL="https://smartecopack.com"

TELEGRAM_BOT_TOKEN=""
TELEGRAM_CHAT_ID=""
SMTP_HOST=""
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASSWORD=""
LEAD_EMAIL_TO="sales@smartecopack.com"

NEXT_PUBLIC_GA_ID=""
ENV

sudo chmod 600 /srv/smartecopack/repo/.env
```

У `.env` іде **роль застосунку** (`sep_app`). Пароль власника (`sep_owner`)
на сервері не зберігається взагалі — його вводять руками тоді, коли треба
накотити міграції.

Що станеться, якщо пропустити необов'язкові значення:

- **без Telegram/SMTP** — заявки все одно зберігаються в базі й видно в адмінці,
  але менеджер не отримає миттєвого сповіщення;
- **без `NEXT_PUBLIC_GA_ID`** — скрипт аналітики просто не вантажиться;
- **без `NEXT_PUBLIC_AB_NAV=1`** — A/B-тест навігації вимкнений, усі бачать
  варіант B. Це нормальний стан за замовчуванням.

---

## 5. Залежності, міграції, наповнення бази

> **Порядок кроків важливий.** Збірка Next.js генерує 258 статичних сторінок
> і під час цього **читає каталог з бази**. Якщо база недоступна або порожня,
> `npm run build` впаде з помилкою `P1001: Can't reach database server`
> або збере сайт без товарів. Тому спочатку міграції й наповнення — потім збірка.

```bash
cd /srv/smartecopack/repo
sudo -u smartecopack npm ci                 # postinstall сам виконає prisma generate

# Міграції — від власника схеми. Пароль передається лише на час команди
# і не лишається ані в .env, ані в історії (рядок починається з пробілу).
 sudo -u smartecopack DATABASE_URL="postgresql://sep_owner:ПАРОЛЬ_ВЛАСНИКА@localhost:5432/smartecopack" npm run db:migrate
```

Тепер, коли таблиці існують, видаємо права ролі застосунку (блок із кроку 2):

```bash
sudo -u postgres psql -d smartecopack <<'SQL'
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO sep_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO sep_app;
SQL
```

Наповнення каталогу — уже звичайною роллю застосунку, це заодно перевіряє,
що прав їй вистачає:

```bash
sudo -u smartecopack npm run db:seed
```

Очікуваний вивід сідування:

```
групи: 6
категорії: 32
товари: 134
статті: 10
```

> **`npm ci` покаже «4 high severity vulnerabilities» — не «виправляйте» їх.**
> Вразливості у пакеті `mysql2`, який тягне за собою CLI Prisma як
> необов'язковий драйвер. Сайт працює на PostgreSQL і цей драйвер ніколи
> не завантажує. `npm audit fix --force` відкотить Prisma з 7 на 6 —
> це ламаюча зміна, після якої збірка впаде.

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
DATABASE_URL=postgresql://sep_app:ПАРОЛЬ_ЗАСТОСУНКУ@localhost:5432/smartecopack
NEXT_PUBLIC_SITE_URL=https://smartecopack.com
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
LEAD_EMAIL_TO=sales@smartecopack.com
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

Конфіг також містить обмеження частоти запитів (`limit_req`): вхід в адмінку —
60 запитів/хв з IP, форма заявки — 10/хв, пошук і лічильник A/B — 120/хв.
Перевищення повертає `429`. Якщо сайт стоятиме за Cloudflare або іншим
проксі, `$binary_remote_addr` буде адресою проксі, а не відвідувача, —
тоді потрібен `real_ip_header` з `set_real_ip_from`, інакше ліміт рахуватиме
всіх відвідувачів як одного.

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

# 2. Залежності й міграції — ДО збірки, міграції від власника схеми
sudo -u smartecopack npm ci
 sudo -u smartecopack DATABASE_URL="postgresql://sep_owner:ПАРОЛЬ_ВЛАСНИКА@localhost:5432/smartecopack" npm run db:migrate

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

> **У дампі є персональні дані.** Заявки містять ім'я, телефон, e-mail і
> реквізити клієнтів. Тека `/var/backups` має бути доступна лише root
> (`chmod 700`), а якщо копії їдуть у хмару — шифруйте їх перед відправкою:
>
> ```bash
> pg_dump -Fc smartecopack | age -r ВАШ_ПУБЛІЧНИЙ_КЛЮЧ > sep-$(date +%F).dump.age
> ```

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

**«Забагато спроб. Спробуйте за N хв.» при вході в адмінку**
Спрацював захист від перебору: 10 невдалих спроб поспіль блокують вхід на
15 хвилин. Або зачекайте, або зніміть блокування вручну:

```bash
sudo -u postgres psql -d smartecopack \
  -c "UPDATE admin_users SET \"failedAttempts\"=0, \"lockedUntil\"=NULL;"
```

**`429 Too Many Requests` на сайті**
Спрацював `limit_req` у nginx. Для звичайного відвідувача це майже
неможливо; якщо ловите самі — перевірте, чи сайт не за проксі (див. крок 8),
і за потреби підніміть `rate` у `deploy/nginx.conf`.

**`permission denied for table …` у логах застосунку**
Роль `sep_app` не отримала прав на таблиці, які додала нова міграція.
Виконайте блок `GRANT` із кроку 5 ще раз — або переконайтесь, що
`ALTER DEFAULT PRIVILEGES` із кроку 2 виконувався **від імені `sep_owner`**.

---

## Що перевірено, а що ні

Кроки 3–9 цієї інструкції пройдені від початку до кінця саме з цього архіву:
розпакування в чисту теку, `cp .env.example .env`, `npm ci` (521 пакет),
`npm run db:migrate` на порожній базі, `npm run db:seed`, `npm run build`
(258 сторінок), розкладка `public` і `.next/static` у standalone, запуск
`node server.js`, створення адміністратора. Перевірено, що сайт віддає
сторінки, CSS, фото товарів і `sitemap.xml`, а `canonical` містить саме той
домен, що заданий у `NEXT_PUBLIC_SITE_URL` на момент збірки.

Не перевірено на реальному сервері: systemd-юніт, конфіг nginx, випуск
сертифіката й збірка Docker-образу (у середовищі розробки не було
запущеного демона Docker). Це стандартні конфігурації, але перший запуск
краще робити на тестовому сервері, а не одразу на бойовому.
