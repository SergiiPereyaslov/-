<?php

namespace App\Http\Requests;

use App\Models\AbStat;
use App\Models\Lead;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Заявка з форми або кошика.
 *
 * Форма публічна, тож усе, що сюди приходить, — недовірений ввід. Обсяг
 * кожного поля обмежений окремо: позиції кошика лягають у базу як JSON,
 * і без обмеження на кожне поле в заявку можна було б покласти мегабайт
 * тексту в назві товару — ліміт на кількість позицій від цього не рятує.
 */
class StoreLeadRequest extends FormRequest
{
    /** Верхня межа суми: більше за це — не замовлення, а сміття або помилка. */
    public const MAX_TOTAL = 100_000_000;

    /** Кошик такого розміру ніхто не збирає руками. */
    public const MAX_ITEMS = 200;

    /** Пачок в одній позиції: мільйон — уже явно помилка чи підробка. */
    public const MAX_PACKS = 1_000_000;

    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'kind' => ['nullable', 'string', 'in:'.implode(',', Lead::KINDS)],
            /*
             * Телефон — єдине обов'язкове поле: без нього заявка
             * безкорисна, а все інше менеджер з'ясує в розмові.
             * Регулярний вираз заякорений з обох боків, тож перенос
             * рядка в нього не пройде — інакше значення могло б поїхати
             * в тему листа й розбити заголовки.
             */
            'phone' => ['required', 'string', 'regex:/^\+?380\d{9}$/'],
            'name' => ['nullable', 'string', 'max:120'],
            'email' => ['nullable', 'string', 'max:160'],
            'company' => ['nullable', 'string', 'max:160'],
            'comment' => ['nullable', 'string', 'max:4000'],
            'delivery' => ['nullable', 'string', 'max:32'],
            'customer' => ['nullable', 'string', 'max:32'],
            'city' => ['nullable', 'string', 'max:160'],
            'requisites' => ['nullable', 'string', 'max:4000'],
            'source' => ['nullable', 'string', 'max:64'],
            'locale' => ['nullable', 'string', 'in:uk,ru'],
            'abVariant' => ['nullable', 'string', 'in:'.implode(',', AbStat::VARIANTS)],

            'items' => ['nullable', 'array', 'max:'.self::MAX_ITEMS],
            'items.*.sku' => ['nullable', 'string', 'max:64'],
            'items.*.name' => ['nullable', 'string', 'max:200'],
            'items.*.packs' => ['nullable', 'integer', 'min:0', 'max:'.self::MAX_PACKS],
            'items.*.sum' => ['nullable', 'numeric', 'min:0', 'max:'.self::MAX_TOTAL],

            'total' => ['nullable', 'numeric', 'min:0', 'max:'.self::MAX_TOTAL],
        ];
    }

    /** Пробіли, дужки й дефіси в номері — звичка людей, а не помилка. */
    protected function prepareForValidation(): void
    {
        if ($this->has('phone')) {
            $this->merge([
                'phone' => preg_replace('/[\s()\-]/', '', (string) $this->input('phone')),
            ]);
        }
    }

    /**
     * Позиції кошика, приведені до однакового вигляду.
     *
     * Суми тут — заявлені клієнтом, а не перераховані сервером: менеджер
     * усе одно підтверджує рахунок вручну, і в адмінці вони підписані
     * саме так. Перераховувати їх тут означало б мовчки розійтися з тим,
     * що відвідувач бачив на екрані.
     *
     * @return list<array{sku: string, name: string, packs: int, sum: float}>
     */
    public function items(): array
    {
        $items = [];

        foreach ((array) $this->validated('items', []) as $item) {
            if (! is_array($item)) {
                continue;
            }

            $sku = trim((string) ($item['sku'] ?? ''));
            $name = trim((string) ($item['name'] ?? ''));

            // Позиція без артикула й без назви нічого не означає
            if ($sku === '' && $name === '') {
                continue;
            }

            $items[] = [
                'sku' => $sku,
                'name' => $name,
                'packs' => (int) ($item['packs'] ?? 0),
                'sum' => round((float) ($item['sum'] ?? 0), 2),
            ];
        }

        return $items;
    }
}
