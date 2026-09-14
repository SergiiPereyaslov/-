# Розгортання

Коротка довідка для тих, хто вже розгортав Laravel. Якщо ставите з нуля
на чистий сервер — беріть покрокову інструкцію: **[INSTALL.md](INSTALL.md)**.

## Стек

```
nginx  →  PHP-FPM 8.4  →  Laravel 13  →  PostgreSQL 16
```

Окремої служби застосунку немає. nginx віддає файли з `public/` сам, а
решту передає в PHP-FPM через unix-сокет `/run/php/smartecopack.sock`.
Черг і планувальника немає — заявки надсилаються синхронно, тому
`queue:work` і `schedule:run` піднімати не треба.

## Файли в цьому каталозі

| Файл | Куди | Навіщо |
|---|---|---|
| `nginx.conf` | `/etc/nginx/sites-available/smartecopack` | HTTPS, статика, `limit_req` |
| `php-fpm-pool.conf` | `/etc/php/8.4/fpm/pool.d/smartecopack.conf` | окремий користувач, `open_basedir`, opcache |
| `php8.4-fpm-hardening.conf` | `/etc/systemd/system/php8.4-fpm.service.d/hardening.conf` | обмеження на рівні systemd |
| `INSTALL.md` | — | покрокова інструкція |

## Порядок кроків

Порядок має значення — переставляти не можна:

1. **База й дві ролі.** Власник схеми проганяє міграції, застосунок
   працює від ролі без прав на DDL.
2. **`composer install --no-dev`.** Саме `--no-dev`: із залежностями
   розробки сайт впаде з `Call to undefined function proc_open()` —
   у пулі ця функція вимкнена навмисно.
3. **Міграції й сідування — від власника схеми**, не від ролі застосунку.
4. **`GRANT` для ролі застосунку** — після міграцій, бо до них таблиць
   ще немає.
5. **`npm run build`** — CSS і JS. Потім `node_modules` можна видалити.
6. **`config:cache`, `route:cache`, `view:cache`** — останніми, вже з
   готовим `.env`.

## Швидкий старт

```bash
cp .env.example .env && nano .env      # паролі, SMTP, домен
php artisan key:generate
composer install --no-dev --optimize-autoloader
env DB_USERNAME=smartecopack_owner DB_PASSWORD='...' php artisan migrate --force
env DB_USERNAME=smartecopack_owner DB_PASSWORD='...' php artisan db:seed --force
npm ci && npm run build && rm -rf node_modules
php artisan config:cache route:cache view:cache
php artisan admin:create
```

## Оновлення

```bash
composer install --no-dev --optimize-autoloader
env DB_USERNAME=smartecopack_owner DB_PASSWORD='...' php artisan migrate --force
npm ci && npm run build && rm -rf node_modules
php artisan config:cache && php artisan route:cache && php artisan view:cache
php artisan cache:clear
systemctl reload php8.4-fpm     # обов'язково
```

Останній рядок не пропускати: у пулі стоїть
`opcache.validate_timestamps=0`, тож без перезавантаження PHP
працюватиме на старому коді.

## Що ламається найчастіше

- **502** — nginx не достукався до сокета: звірте `fastcgi_pass` у
  `nginx.conf` із `listen` у пулі
- **500 і `Permission denied` для storage** — загубились права після
  розпакування: `chmod -R 775 storage bootstrap/cache`
- **Зміни в `.env` не діють** — активний `config:cache`, перезберіть
- **Нова версія коду не підхопилась** — забутий `reload php8.4-fpm`
- **`SQLSTATE[42501]`** — міграція запущена від ролі застосунку
  замість власника схеми

Докладніший розбір і перевірки після розгортання — у
[INSTALL.md](INSTALL.md), розділи 10 і 13.
