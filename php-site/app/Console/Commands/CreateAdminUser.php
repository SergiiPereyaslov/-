<?php

namespace App\Console\Commands;

use App\Models\AdminUser;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * Створення адміністратора панелі.
 *
 * Окремою командою, а не сідером: адміністратор — це не дані каталогу,
 * і він не має з'являтись автоматично при кожному наповненні бази.
 *
 *   php artisan admin:create sales@smartecopack.com "Олена"
 *
 * Пароль генерується й показується один раз. Приймати його аргументом
 * не варто: він лишився б в історії командного рядка сервера.
 */
class CreateAdminUser extends Command
{
    protected $signature = 'admin:create {email} {name} {--password= : Задати пароль замість згенерованого}';

    protected $description = 'Створити адміністратора панелі';

    public function handle(): int
    {
        $email = mb_strtolower(trim((string) $this->argument('email')));

        if (! filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $this->components->error('Некоректний e-mail');

            return self::FAILURE;
        }

        if (AdminUser::where('email', $email)->exists()) {
            $this->components->error("Адміністратор {$email} уже існує");

            return self::FAILURE;
        }

        $password = (string) ($this->option('password') ?: Str::password(16));

        AdminUser::create([
            'email' => $email,
            'name' => (string) $this->argument('name'),
            'passwordHash' => Hash::make($password),
        ]);

        $this->components->info("Створено {$email}");

        if (! $this->option('password')) {
            $this->newLine();
            $this->components->warn('Пароль показується один раз — збережіть його зараз:');
            $this->line("  {$password}");
            $this->newLine();
        }

        return self::SUCCESS;
    }
}
