# Розгортання сайту SmartEcoPack з архіву

Інструкція для Ubuntu 24.04 LTS. На Debian 12 усе те саме, крім джерела
пакетів PHP (див. крок 1).

Стек: **nginx → PHP-FPM 8.4 → Laravel 13 → PostgreSQL 16**. Окремої
служби застосунку немає: nginx віддає файли з `public/` сам, а решту
передає в PHP-FPM через unix-сокет.

Читайте підряд і виконуйте команди по черзі. Кроки 1–9 — перше
розгортання, крок 11 — оновлення. Разом близько 40 хвилин, з них
більшість — очікування apt і certbot.

Скрізь замініть `smartecopack.com.ua` на свій домен і `ВАШ_СЕРВЕР` на
IP сервера.

---

## 0. Що потрібно мати до початку

- Сервер з Ubuntu 24.04, мінімум 2 ГБ пам'яті, доступ по SSH з правами root
- Домен, у якого A-запис уже вказує на IP сервера (перевірити:
  `dig +short smartecopack.com.ua` має віддати саме цей IP)
- Відкриті порти 80 і 443
- Архів `smartecopack-php.tar.gz`

Заздалегідь підготуйте (знадобляться на кроці 4):

- пароль до бази — придумайте довгий випадковий
- дані SMTP, з якого підуть листи про заявки
- токен Telegram-бота й ID чату, якщо хочете дублювати заявки туди

---

## 1. Базове ПЗ

```bash
apt update && apt upgrade -y

# PHP 8.4 немає в репозиторії Ubuntu 24.04 — потрібен PPA ondrej.
# На Debian замість цього: sources.list.d/php.list від deb.sury.org
apt install -y software-properties-common
add-apt-repository -y ppa:ondrej/php
apt update

apt install -y nginx postgresql postgresql-contrib certbot python3-certbot-nginx \
  php8.4-fpm php8.4-cli php8.4-pgsql php8.4-mbstring php8.4-xml \
  php8.4-curl php8.4-zip php8.4-gd php8.4-intl php8.4-opcache \
  unzip git curl

# Composer
curl -sS https://getcomposer.org/installer | php -- \
  --install-dir=/usr/local/bin --filename=composer

# Node.js 22 LTS — потрібен тільки для збірки CSS і JS (Vite).
# Якщо збиратимете на своєму комп'ютері й вивантажуватимете готовий
# public/build — на сервері Node не потрібен узагалі.
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs

# Перевірка версій
php -v        # має бути 8.4.x
composer -V
psql --version
```

Якщо `php -v` показує 8.3 — активний інший пакет. Виправити:
`update-alternatives --set php /usr/bin/php8.4`

---

## 2. База даних

Ролей дві, і це принципово. Власник схеми створює таблиці й проганяє
міграції; застосунок працює від окремої ролі, яка вміє лише читати й
писати рядки. Якщо сайт зламають, зловмисник не зможе ані видалити
таблицю, ані створити функцію — він упреться в права.

```bash
sudo -u postgres psql <<'SQL'
-- Власник схеми: від нього йдуть міграції
CREATE ROLE smartecopack_owner LOGIN PASSWORD 'ПАРОЛЬ_ВЛАСНИКА';

-- Роль застосунку: тільки рядки, без DDL
CREATE ROLE smartecopack_app LOGIN PASSWORD 'ПАРОЛЬ_ЗАСТОСУНКУ';

CREATE DATABASE smartecopack OWNER smartecopack_owner ENCODING 'UTF8'
  LC_COLLATE 'uk_UA.UTF-8' LC_CTYPE 'uk_UA.UTF-8' TEMPLATE template0;

-- Публічна схема не має бути відкрита всім підряд
\c smartecopack
REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO smartecopack_app;
GRANT ALL ON SCHEMA public TO smartecopack_owner;
SQL
```

Якщо `CREATE DATABASE` скаржиться на локаль — згенеруйте її:
`locale-gen uk_UA.UTF-8 && systemctl restart postgresql`, потім
повторіть.

Права для ролі застосунку видаються **після** міграцій (крок 5): зараз
таблиць ще немає.

---

## 3. Користувач системи й розпакування архіву

```bash
# Окремий користувач без оболонки: від нього працюватиме PHP-FPM
adduser --system --group --home /var/www/smartecopack --shell /usr/sbin/nologin smartecopack

# завантажте архів на сервер (scp з вашого комп'ютера):
#   scp smartecopack-php.tar.gz root@ВАШ_СЕРВЕР:/tmp/

cd /var/www/smartecopack
tar xzf /tmp/smartecopack-php.tar.gz --strip-components=1
chown -R smartecopack:smartecopack /var/www/smartecopack
```

Права робимо асиметричними навмисно: код доступний на читання, але не
на запис, а писати можна тільки у два каталоги. Це означає, що навіть
знайдена вразливість завантаження файлів не дозволить перезаписати
`.php` у коді сайту.

```bash
cd /var/www/smartecopack
find . -type d -exec chmod 755 {} \;
find . -type f -exec chmod 644 {} \;
chmod -R 775 storage bootstrap/cache
chown -R smartecopack:smartecopack storage bootstrap/cache
```

---

## 4. Змінні оточення

```bash
cd /var/www/smartecopack
cp .env.example .env
nano .env
```

Заповніть (решта коментарів — прямо у файлі):

```ini
APP_ENV=production
APP_DEBUG=false
APP_URL=https://smartecopack.com.ua
SITE_URL=https://smartecopack.com.ua

DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=smartecopack
DB_USERNAME=smartecopack_app
DB_PASSWORD=ПАРОЛЬ_ЗАСТОСУНКУ

SESSION_SECURE_COOKIE=true

MAIL_HOST=smtp.вашдомен
MAIL_USERNAME=site@smartecopack.com.ua
MAIL_PASSWORD=ПАРОЛЬ_ПОШТИ
LEAD_EMAIL_TO=sales@smartecopack.com.ua

TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
```

`APP_DEBUG=false` — не формальність. З `true` будь-яка помилка віддає
відвідувачу трасування стека з іменами файлів, запитами до бази й
фрагментами цього ж `.env`.

Файл містить паролі, тож закриваємо його від усіх, крім власника:

```bash
chmod 640 .env
chown smartecopack:smartecopack .env

# Ключ шифрування сесій і cookie. Без нього застосунок не запуститься.
sudo -u smartecopack php artisan key:generate
```

---

## 5. Залежності, міграції, наповнення бази

```bash
cd /var/www/smartecopack

# --no-dev прибирає інструменти розробки. Серед них і Laravel Boost,
# який у режимі розробки вставляє в сторінки власний скрипт.
sudo -u smartecopack composer install --no-dev --optimize-autoloader --no-interaction

# Міграції — від власника схеми, не від ролі застосунку. Пароль
# передається лише на час команди й не лишається ані в .env, ані в
# історії оболонки (рядок починається з пробілу).
 sudo -u smartecopack env DB_USERNAME=smartecopack_owner DB_PASSWORD='ПАРОЛЬ_ВЛАСНИКА' \
   php artisan migrate --force

# Каталог: групи, категорії, товари, статті
 sudo -u smartecopack env DB_USERNAME=smartecopack_owner DB_PASSWORD='ПАРОЛЬ_ВЛАСНИКА' \
   php artisan db:seed --force
```

Тепер, коли таблиці існують, видаємо права ролі застосунку:

```bash
sudo -u postgres psql -d smartecopack <<'SQL'
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO smartecopack_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO smartecopack_app;

-- Щоб майбутні міграції не вимагали повторювати GRANT вручну
ALTER DEFAULT PRIVILEGES FOR ROLE smartecopack_owner IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO smartecopack_app;
ALTER DEFAULT PRIVILEGES FOR ROLE smartecopack_owner IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO smartecopack_app;
SQL
```

Перевірка, що поділ ролей справді працює — роль застосунку має
**отримати відмову**:

```bash
PGPASSWORD='ПАРОЛЬ_ЗАСТОСУНКУ' psql -h 127.0.0.1 -U smartecopack_app -d smartecopack \
  -c 'CREATE TABLE proba (id int);'
# очікується: ERROR: permission denied for schema public
```

Якщо таблиця створилася — права видані надто широко, поверніться на
крок вище.

---

## 6. Збірка CSS і JS

```bash
cd /var/www/smartecopack
sudo -u smartecopack npm ci
sudo -u smartecopack npm run build

# node_modules більше не потрібні: у public/build уже лежить результат
rm -rf node_modules
```

Потім кешуємо конфігурацію, маршрути й шаблони — це помітно прискорює
кожен запит:

```bash
sudo -u smartecopack php artisan config:cache
sudo -u smartecopack php artisan route:cache
sudo -u smartecopack php artisan view:cache
```

Ці три команди доведеться повторювати після **кожної** зміни `.env`
або коду. Якщо забути — сайт працюватиме на старих значеннях і ви
шукатимете помилку не там.

---

## 7. PHP-FPM

```bash
cp /var/www/smartecopack/deploy/php-fpm-pool.conf \
   /etc/php/8.4/fpm/pool.d/smartecopack.conf

# Стандартний пул не потрібен: два пули слухатимуть різні сокети,
# і ви правитимете не той
mv /etc/php/8.4/fpm/pool.d/www.conf /etc/php/8.4/fpm/pool.d/www.conf.disabled

mkdir -p /var/log/php-fpm
chown smartecopack:smartecopack /var/log/php-fpm

# Обмеження на рівні systemd — третій рубіж після прав і open_basedir
mkdir -p /etc/systemd/system/php8.4-fpm.service.d
cp /var/www/smartecopack/deploy/php8.4-fpm-hardening.conf \
   /etc/systemd/system/php8.4-fpm.service.d/hardening.conf

systemctl daemon-reload
systemctl restart php8.4-fpm
systemctl status php8.4-fpm --no-pager
ls -l /run/php/smartecopack.sock   # сокет має існувати
```

---

## 8. nginx і HTTPS

```bash
cp /var/www/smartecopack/deploy/nginx.conf /etc/nginx/sites-available/smartecopack
nano /etc/nginx/sites-available/smartecopack   # замініть домен

ln -sf /etc/nginx/sites-available/smartecopack /etc/nginx/sites-enabled/smartecopack
rm -f /etc/nginx/sites-enabled/default

nginx -t
```

Файл посилається на сертифікати, яких ще немає, тож `nginx -t` на
цьому кроці впаде — це очікувано. Спершу отримайте сертифікат:

```bash
certbot --nginx -d smartecopack.com.ua -d www.smartecopack.com.ua
nginx -t && systemctl reload nginx
```

Certbot сам пропише шляхи до сертифікатів і налаштує автопродовження.
Перевірити, що продовження справді працюватиме:
`certbot renew --dry-run`

---

## 9. Обліковий запис адміністратора

```bash
cd /var/www/smartecopack
sudo -u smartecopack php artisan admin:create
```

Команда спитає e-mail, ім'я й пароль. Пароль не відображається під час
введення й не потрапляє в історію оболонки.

Вхід: `https://smartecopack.com.ua/admin/`

---

## 10. Перевірка після розгортання

```bash
# головна віддає 200
curl -sI https://smartecopack.com.ua/ | head -1

# карта сайту й robots
curl -s https://smartecopack.com.ua/sitemap.xml | head -5
curl -s https://smartecopack.com.ua/robots.txt

# сторінка категорії з товарами й фото
curl -s https://smartecopack.com.ua/catalog/stakany-paperovi/ | grep -c 'data-product'

# завершальний слеш додається одним переходом, не двома
curl -sI https://smartecopack.com.ua/catalog/stakany-paperovi | grep -i location
```

### Перевірка захисту

```bash
# Заголовки безпеки. Їх ставить і застосунок, і nginx, тож вони мають
# бути на місці, навіть якщо хтось згодом перепише конфіг проксі.
curl -sI https://smartecopack.com.ua/ | \
  grep -iE 'content-security-policy|x-content-type|referrer-policy|x-frame|permissions-policy|strict-transport'
# очікується 6 рядків

# Версія PHP не має світитись назовні — має бути порожньо
curl -sI https://smartecopack.com.ua/ | grep -i x-powered-by

# У CSP не має бути 'unsafe-inline' для скриптів. 'unsafe-eval' там є
# навмисно — без нього не працює Alpine; подробиці в коментарі до
# app/Http/Middleware/SecurityHeaders.php
curl -sI https://smartecopack.com.ua/ | grep -i content-security-policy

# .env недосяжний ззовні — має бути 403 або 404, але не 200
curl -s -o /dev/null -w '%{http_code}\n' https://smartecopack.com.ua/.env

# Неіснуючий слаг має давати 404, а не 500
for u in /catalog/nemaye/ /product/nemaye/ /blog/nemaye/ /dlya/nemaye/ /ru/catalog/nemaye/; do
  curl -s -o /dev/null -w "$u %{http_code}\n" "https://smartecopack.com.ua$u"
done

# Адмінка не кешується й не індексується
curl -sI https://smartecopack.com.ua/admin/ | grep -iE 'cache-control|x-robots-tag'

# Обмеження частоти: 12 запитів поспіль до приймання заявок.
# Перші кілька — 422 (payload навмисно невалідний, нічого не
# збережеться), далі мають піти 429. Якщо 429 не з'явився — limit_req
# не підхопився, перевірте, що зони оголошені саме в контексті http.
for i in $(seq 1 12); do
  curl -s -o /dev/null -w '%{http_code} ' -X POST \
    -H 'Content-Type: application/json' -d '{"phone":"ні"}' \
    https://smartecopack.com.ua/api/lead
done; echo

# Канал для дослідників безпеки
curl -s https://smartecopack.com.ua/.well-known/security.txt
```

---

## 11. Оновлення сайту

```bash
cd /var/www/smartecopack

# 1. Розпакувати новий архів поверх
tar xzf /tmp/smartecopack-php.tar.gz --strip-components=1
chown -R smartecopack:smartecopack .
chmod -R 775 storage bootstrap/cache

# 2. Залежності й міграції — міграції від власника схеми
sudo -u smartecopack composer install --no-dev --optimize-autoloader --no-interaction
 sudo -u smartecopack env DB_USERNAME=smartecopack_owner DB_PASSWORD='ПАРОЛЬ_ВЛАСНИКА' \
   php artisan migrate --force

# 3. Збірка
sudo -u smartecopack npm ci && sudo -u smartecopack npm run build && rm -rf node_modules

# 4. Перезбирання кешів
sudo -u smartecopack php artisan config:cache
sudo -u smartecopack php artisan route:cache
sudo -u smartecopack php artisan view:cache
sudo -u smartecopack php artisan cache:clear

# 5. Перезапуск PHP — обов'язково.
# У пулі стоїть opcache.validate_timestamps=0: без перезапуску сайт
# працюватиме на старому коді, і ви шукатимете помилку в новому.
systemctl reload php8.4-fpm
```

---

## 12. Резервне копіювання

Копіювати треба дві речі: базу й `.env`. Решта — код, фото каталогу,
картки для соцмереж — лежить в архіві й відновлюється з нього.
Завантажень від користувачів сайт не зберігає взагалі: CSV імпорту
читається з тимчасового файлу й не лишається на диску.

```bash
mkdir -p /var/backups/smartecopack
cat > /usr/local/bin/smartecopack-backup <<'SH'
#!/bin/bash
set -e
D=$(date +%F)
B=/var/backups/smartecopack

sudo -u postgres pg_dump smartecopack | gzip > "$B/db-$D.sql.gz"
cp /var/www/smartecopack/.env "$B/env-$D"

# Зберігаємо 14 днів
find "$B" -type f -mtime +14 -delete
SH
chmod +x /usr/local/bin/smartecopack-backup

# Щодня о 3:30
echo '30 3 * * * root /usr/local/bin/smartecopack-backup' > /etc/cron.d/smartecopack-backup
```

Копії містять персональні дані: у таблиці заявок лежать імена,
телефони й адреси клієнтів. Каталог `/var/backups/smartecopack` має
бути закритий (`chmod 700`), а якщо копії їдуть у хмару — шифруйте їх
перед відправкою. Незашифрована копія бази в чужому сховищі — це той
самий витік, тільки повільніший.

```bash
chmod 700 /var/backups/smartecopack
```

Перевірте відновлення хоча б раз, поки не припекло:

```bash
sudo -u postgres createdb proba_restore
gunzip -c /var/backups/smartecopack/db-*.sql.gz | sudo -u postgres psql proba_restore
sudo -u postgres psql proba_restore -c 'SELECT count(*) FROM products;'
sudo -u postgres dropdb proba_restore
```

---

## 13. Типові помилки

**502 Bad Gateway**
nginx не достукався до PHP-FPM. Перевірте, що сокет існує
(`ls -l /run/php/smartecopack.sock`) і що шлях у `fastcgi_pass`
збігається з `listen` у пулі. Логи: `journalctl -u php8.4-fpm -n 50`.

**500 на всіх сторінках, у логах «Permission denied» для storage**
Права на `storage/` і `bootstrap/cache/` загубились після розпакування:
```bash
chmod -R 775 /var/www/smartecopack/storage /var/www/smartecopack/bootstrap/cache
chown -R smartecopack:smartecopack /var/www/smartecopack/storage /var/www/smartecopack/bootstrap/cache
```

**«No application encryption key has been specified»**
Не виконано `php artisan key:generate` (крок 4) або `.env` недоступний
користувачу `smartecopack`.

**Зміни в `.env` не діють**
Активний кеш конфігурації. Після кожної правки:
`php artisan config:cache`.

**Нова версія коду не підхоплюється**
`opcache.validate_timestamps=0` у пулі. Потрібен
`systemctl reload php8.4-fpm` — крок 11.5.

**Стилі поїхали, у консолі 404 на `/build/...`**
Не виконано `npm run build`, або `public/build` не потрапив в архів.

**Сторінки віддають стару ціну після правки в адмінці**
Кеш сторінок не скинувся. `php artisan cache:clear` і перевірте
заголовок `X-Page-Cache` — на свіжій сторінці його бути не повинно.

**`SQLSTATE[42501]: Insufficient privilege` під час міграції**
Міграція запущена від ролі застосунку. Вона навмисно не має прав на
DDL — запускайте від `smartecopack_owner` (крок 5).

**500 на всіх сторінках, у логу PHP «Call to undefined function proc_open()»**
Composer поставив залежності розробки. У пулі навмисно вимкнені
функції запуску зовнішніх команд (`disable_functions`), а автозавантажувач
PHPUnit смикає `proc_open` ще до старту застосунку. На проді цього файлу
бути не повинно взагалі:
```bash
cd /var/www/smartecopack
sudo -u smartecopack composer install --no-dev --optimize-autoloader
systemctl reload php8.4-fpm
```
Не прибирайте `proc_open` зі списку — саме ця функція є в більшості
готових веб-шелів, і її вимкнення робить їх безкорисними.

**Листи про заявки не приходять**
Заявка все одно збережена в базі — подивіться в `/admin/leads/`.
Помилку надсилання шукайте в `storage/logs/laravel.log`: збій пошти
навмисно не ламає приймання заявки.

---

## Що перевірено, а що ні

Чесно про межі цієї інструкції.

**Перевірено на справжньому стеку nginx + PHP-FPM.** Не «за
документацією»: конфіги з `deploy/` було запущено на чистій копії
сайту, зібраній так само, як описано вище — `git archive`,
`composer install --no-dev`, `npm run build`, `config:cache`. Саме на
цьому стенді:

- `nginx -t` проходить; конфіг завантажується й обслуговує запити
- усі основні сторінки віддають 200: головна, каталог, категорія,
  картка товару, блог, контакти, кошик, гео-посадкова, російська
  версія, `sitemap.xml`, `robots.txt`, `rss.xml`, `security.txt`
- `.env` ззовні недосяжний — 403 і за прямою адресою, і через `../`
- заголовки безпеки на місці, `X-Powered-By` відсутній
- `/admin/` і `/koshyk/` віддають `no-store` і `noindex, nofollow`,
  а головна — ні
- неіснуючі слаги дають 404, не 500 — п'ять адрес
- завершальний слеш додається одним 301, без другого переходу
- **`limit_req` справді працює**: 40 запитів до `/admin/` — 31 пройшов,
  далі 429; 20 запитів до `/api/lead` — 6 пройшло, далі 429. Рівно
  стільки, скільки задано `burst`
- пул PHP-FPM працює з усіма обмеженнями: `open_basedir`,
  `disable_functions`, `opcache.validate_timestamps=0`

Окремо, на рівні застосунку: 135 автоматичних тестів і перевірка CSP
у справжньому браузері на семи сторінках — 0 порушень політики.

**Не перевірено, бо неможливо в цьому середовищі:**

- послідовність команд саме на чистій Ubuntu 24.04: тут немає systemd,
  тож `systemctl`, `adduser --system` і підключення PPA написані за
  документацією, а не виконані
- обмеження systemd (`ProtectSystem`, `SystemCallFilter`) з
  `php8.4-fpm-hardening.conf`: systemd немає. Після розгортання
  перевірте оцінку: `systemd-analyze security php8.4-fpm`
- отримання сертифіката certbot і автопродовження
- HTTPS як такий: стенд працював по http, бо сертифіката для
  `127.0.0.1` не буває. Директиви `ssl_*` перевірені лише синтаксично
- поведінка під реальним навантаженням: `pm.max_children = 20`
  розраховано на 2 ГБ пам'яті, але не заміряно

**Знайдено під час цієї перевірки — і вже виправлено:**

- `http2 on;` не працює на nginx 1.24, який постачає Ubuntu 24.04:
  директива з'явилась лише в 1.25. Замінено на прапорець у `listen`
- `add_header` у `location /admin/` не спрацьовував узагалі:
  `try_files` робить внутрішній редирект у локацію для `.php`, і
  заголовки додає вже вона. Перенесено в застосунок
- `disable_functions` з `proc_open` валить сайт, якщо на сервері
  встановлені dev-залежності (див. «типові помилки» нижче)

Якщо на якомусь кроці команда впаде — не обходьте її, а перевірте
попередній крок: майже всі збої тут через пропущений `chown`, забутий
`config:cache` або невідповідність шляху в двох файлах.
