<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreLeadRequest;
use App\Models\Lead;
use App\Services\AbCounter;
use App\Services\LeadNotifier;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Приймання заявок.
 *
 * Порядок дій навмисний: спершу запис у базу, і лише потім спроба
 * сповістити менеджера. Якщо Telegram недоступний або пошта відмовила,
 * заявка все одно збережена — її видно в адмінці з поміткою про невдалу
 * доставку. Зворотний порядок означав би, що падіння зовнішнього сервісу
 * втрачає звернення клієнта.
 */
class LeadController extends Controller
{
    public function __construct(
        private readonly LeadNotifier $notifier,
        private readonly AbCounter $ab,
    ) {}

    public function __invoke(StoreLeadRequest $request): JsonResponse
    {
        try {
            $lead = Lead::create([
                'number' => Lead::nextNumber(),
                'kind' => $request->validated('kind') ?? 'quote',
                'phone' => $request->validated('phone'),
                'name' => $request->validated('name'),
                'email' => $request->validated('email'),
                'company' => $request->validated('company'),
                'comment' => $request->validated('comment'),
                'delivery' => $request->validated('delivery'),
                'customerType' => $request->validated('customer'),
                'city' => $request->validated('city'),
                'requisites' => $request->validated('requisites'),
                'source' => $request->validated('source'),
                'locale' => $request->validated('locale') ?? 'uk',
                'abVariant' => $request->validated('abVariant'),
                'items' => $request->items(),
                'total' => $request->validated('total'),
            ]);
        } catch (Throwable $e) {
            Log::error('Не вдалось зберегти заявку', ['exception' => $e]);

            return response()->json(['ok' => false, 'error' => 'storage_failed'], 500);
        }

        $this->deliver($lead);

        /*
         * Заявка — ключова метрика A/B-тесту. Рахуємо тут, а не на
         * клієнті: сторінка «дякуємо» може не відкритись, а заявка вже є.
         */
        if ($lead->abVariant) {
            $this->ab->bump($lead->abVariant, 'leads');
        }

        return response()->json(['ok' => true, 'number' => $lead->number]);
    }

    /**
     * Сповіщення поза критичним шляхом відповіді клієнту: що б тут не
     * сталось, відвідувач уже отримав підтвердження, а заявка збережена.
     */
    private function deliver(Lead $lead): void
    {
        try {
            $result = $this->notifier->notify($lead);

            $lead->update([
                'notified' => $result['delivered'] !== [],
                'notifyError' => $result['error'],
            ]);
        } catch (Throwable $e) {
            $lead->update([
                'notified' => false,
                'notifyError' => mb_substr($e->getMessage(), 0, 2000),
            ]);
        }
    }
}
