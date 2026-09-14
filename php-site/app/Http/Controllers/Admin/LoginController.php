<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminUser;
use Illuminate\Contracts\View\View;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Вхід в адмінку.
 *
 * Два рубежі проти перебору пароля. Ліміт частоти в nginx відсікає
 * навалу ще до PHP; блокування акаунта тут зупиняє повільний перебір,
 * який під ліміт не потрапляє.
 */
class LoginController extends Controller
{
    public function show(): View|RedirectResponse
    {
        return Auth::check() ? redirect('/admin/dashboard/') : view('admin.login');
    }

    public function store(Request $request): RedirectResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'string', 'email', 'max:160'],
            'password' => ['required', 'string', 'max:200'],
        ]);

        $user = AdminUser::where('email', $credentials['email'])->first();

        if ($user?->isLocked()) {
            throw ValidationException::withMessages([
                'email' => __('admin.login.locked', ['minutes' => AdminUser::LOCK_MINUTES]),
            ]);
        }

        /*
         * Хеш рахується завжди — навіть коли такого e-mail немає.
         *
         * Без цього відповідь для неіснуючої адреси поверталась би за
         * мілісекунди замість ~300 мс, і за одним лише часом відповіді
         * можна було б з'ясувати, які адреси зареєстровані. Саме це
         * знайшов аудит Next-версії.
         */
        $hash = $user?->passwordHash ?? $this->dummyHash();
        $ok = Hash::check($credentials['password'], $hash);

        if (! $ok || $user === null) {
            $this->registerFailure($user);

            throw ValidationException::withMessages(['email' => __('admin.login.failed')]);
        }

        $user->forceFill(['failedAttempts' => 0, 'lockedUntil' => null])->save();

        Auth::login($user, remember: false);

        // Нова сесія після входу: підкинутий заздалегідь ідентифікатор
        // сесії стає недійсним
        $request->session()->regenerate();

        return redirect('/admin/dashboard/');
    }

    public function destroy(Request $request): RedirectResponse
    {
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/admin/');
    }

    /**
     * Хеш-пустушка тієї ж вартості, що й справжні паролі.
     *
     * Раніше вона була зашита в конфіг рядком. Це працювало, поки
     * вартість bcrypt збігалась із тією, якою її згенерували: варто
     * комусь змінити BCRYPT_ROUNDS — і перевірка пустушки знову стала б
     * помітно швидшою або повільнішою за справжню, тобто повернула б
     * той самий витік, який вона й мала закрити.
     *
     * Тепер вона створюється з поточним налаштуванням і кешується під
     * ключем, у якому ця вартість є. Пароля, який би їй підійшов, не
     * існує: це хеш випадкового рядка, який ніде не зберігається.
     */
    private function dummyHash(): string
    {
        $rounds = config('hashing.bcrypt.rounds', 12);

        return Cache::rememberForever(
            "admin.dummy_hash.{$rounds}",
            fn (): string => Hash::make(Str::random(40)),
        );
    }

    private function registerFailure(?AdminUser $user): void
    {
        if ($user === null) {
            return;
        }

        $attempts = $user->failedAttempts + 1;

        $user->forceFill([
            'failedAttempts' => $attempts,
            'lockedUntil' => $attempts >= AdminUser::MAX_ATTEMPTS
                ? now()->addMinutes(AdminUser::LOCK_MINUTES)
                : $user->lockedUntil,
        ])->save();
    }
}
