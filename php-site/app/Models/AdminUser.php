<?php

namespace App\Models;

use Illuminate\Contracts\Auth\Authenticatable as AuthenticatableContract;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Foundation\Auth\User as Authenticatable;

/**
 * Адміністратор панелі.
 *
 * Таблиця успадкована від Next-версії, тому колонка пароля зветься
 * passwordHash, а не password — getAuthPassword() нижче показує це
 * стандартній автентифікації Laravel, і решта фреймворка працює як завжди.
 *
 * @property string $id
 * @property string $email
 * @property int $failedAttempts
 * @property \Illuminate\Support\Carbon|null $lockedUntil
 */
class AdminUser extends Authenticatable implements AuthenticatableContract
{
    use HasUuids;

    protected $table = 'admin_users';

    protected $keyType = 'string';

    public $incrementing = false;

    const CREATED_AT = 'createdAt';

    /** Таблиця не має updatedAt — у Next-версії користувачі не редагувались. */
    const UPDATED_AT = null;

    protected $fillable = ['email', 'name', 'passwordHash'];

    protected $hidden = ['passwordHash'];

    protected function casts(): array
    {
        return [
            'lockedUntil' => 'datetime',
            'failedAttempts' => 'integer',
        ];
    }

    /** Laravel шукає колонку password; у нас вона зветься інакше. */
    public function getAuthPassword(): string
    {
        return (string) $this->passwordHash;
    }

    /** Скільки невдалих спроб поспіль до блокування акаунта. */
    public const MAX_ATTEMPTS = 10;

    /** На скільки хвилин блокується акаунт після вичерпання спроб. */
    public const LOCK_MINUTES = 15;

    public function isLocked(): bool
    {
        return $this->lockedUntil !== null && $this->lockedUntil->isFuture();
    }
}
