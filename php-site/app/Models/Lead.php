<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

/**
 * Заявка з форми або кошика.
 *
 * Пишеться в базу до спроби надіслати в Telegram чи на пошту, щоб відмова
 * зовнішнього каналу не втрачала звернення клієнта. Що саме не вдалось,
 * лишається в notifyError — видно в адмінці, не треба лізти в журнали.
 *
 * @property string $id
 * @property array<int, array{sku: string, name: string, packs: int, sum: float}> $items
 */
class Lead extends Model
{
    use HasUuids;

    protected $table = 'leads';

    protected $keyType = 'string';

    public $incrementing = false;

    const CREATED_AT = 'createdAt';

    const UPDATED_AT = 'updatedAt';

    /** Типи заявок — перелічення PostgreSQL LeadKind. */
    public const KINDS = ['quote', 'order', 'branding'];

    /** Стани обробки — перелічення PostgreSQL LeadStatus. */
    public const STATUSES = ['new', 'in_progress', 'done', 'rejected'];

    protected $fillable = [
        'number', 'kind', 'status', 'name', 'phone', 'email', 'company',
        'comment', 'delivery', 'customerType', 'city', 'requisites',
        'locale', 'source', 'abVariant', 'items', 'total',
        'notified', 'notifyError', 'managerNote',
    ];

    protected function casts(): array
    {
        return [
            'items' => 'array',
            'total' => 'decimal:2',
            'notified' => 'boolean',
        ];
    }

    #[Scope]
    protected function newestFirst(Builder $query): Builder
    {
        return $query->orderByDesc('createdAt');
    }

    #[Scope]
    protected function withStatus(Builder $query, string $status): Builder
    {
        return $query->where('status', $status);
    }

    /**
     * Номер заявки виду SEP-K3X9F2.
     *
     * Час у 36-й системі дає зростаючий і короткий корінь, випадкова цифра
     * у хвості розводить заявки, створені в одну мілісекунду.
     */
    public static function nextNumber(): string
    {
        $stamp = strtoupper(base_convert((string) (int) (microtime(true) * 1000), 10, 36));

        return 'SEP-'.substr($stamp, -6).random_int(0, 9);
    }
}
