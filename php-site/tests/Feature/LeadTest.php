<?php

namespace Tests\Feature;

use App\Models\Lead;
use App\Services\LeadNotifier;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

/**
 * Приймання заявок.
 *
 * Форма публічна, тож усе, що сюди приходить, — недовірений ввід.
 * Більшість перевірок нижче закривають знахідки аудиту Next-версії:
 * без обмежень на розмір полів у заявку можна було покласти мегабайт
 * тексту, а від'ємну чи астрономічну суму — записати як є.
 */
class LeadTest extends TestCase
{
    /*
     * Транзакція, а не RefreshDatabase: той перезапускає міграції й
     * витирає наповнений каталог, на який спираються інші тести.
     * Тут достатньо відкотити те, що створив сам тест.
     */
    use DatabaseTransactions;

    protected function setUp(): void
    {
        parent::setUp();

        // Жодних справжніх звернень до Telegram чи пошти з тестів
        Http::preventStrayRequests();
        Http::fake();
        Mail::fake();
    }

    private function payload(array $overrides = []): array
    {
        return array_merge(['phone' => '+380501234567'], $overrides);
    }

    public function test_lead_is_stored_and_returns_a_number(): void
    {
        $response = $this->postJson('/api/lead', $this->payload([
            'name' => 'Олена',
            'comment' => 'Потрібен прайс на стакани',
        ]))->assertOk()->assertJsonPath('ok', true);

        $lead = Lead::firstOrFail();

        $this->assertSame('Олена', $lead->name);
        $this->assertSame('+380501234567', $lead->phone);
        $this->assertSame($lead->number, $response->json('number'));
        $this->assertMatchesRegularExpression('/^SEP-[A-Z0-9]{6,8}$/', $lead->number);
    }

    /** Без телефону заявка безкорисна — це єдине обов'язкове поле. */
    public function test_phone_is_required_and_validated(): void
    {
        $this->postJson('/api/lead', [])->assertStatus(422);
        $this->postJson('/api/lead', ['phone' => 'не телефон'])->assertStatus(422);
        $this->postJson('/api/lead', ['phone' => '+1 202 555 0100'])->assertStatus(422);

        $this->assertSame(0, Lead::count());
    }

    /** Пробіли й дужки в номері — звичка людей, а не помилка. */
    public function test_phone_is_normalised(): void
    {
        $this->postJson('/api/lead', ['phone' => '+38 (050) 123-45-67'])->assertOk();

        $this->assertSame('+380501234567', Lead::firstOrFail()->phone);
    }

    /**
     * Перенос рядка в номері не пройде: інакше значення могло б поїхати
     * в тему листа й розбити заголовки.
     */
    public function test_phone_cannot_carry_a_newline(): void
    {
        $this->postJson('/api/lead', ['phone' => "+380501234567\nBcc: victim@example.com"])
            ->assertStatus(422);
    }

    /** Довгі поля відхиляються, а не мовчки ріжуться. */
    public function test_oversized_fields_are_rejected(): void
    {
        $this->postJson('/api/lead', $this->payload(['name' => str_repeat('а', 5000)]))
            ->assertStatus(422)
            ->assertJsonValidationErrors('name');

        $this->postJson('/api/lead', $this->payload(['comment' => str_repeat('а', 5000)]))
            ->assertStatus(422);
    }

    /** Від'ємна й астрономічна сума — сміття або помилка, не замовлення. */
    public function test_absurd_totals_are_rejected(): void
    {
        $this->postJson('/api/lead', $this->payload(['total' => -100]))->assertStatus(422);
        $this->postJson('/api/lead', $this->payload(['total' => 1_000_000_000]))->assertStatus(422);
    }

    /** Кошик такого розміру ніхто не збирає руками. */
    public function test_too_many_items_are_rejected(): void
    {
        $items = array_fill(0, 300, ['sku' => 'X', 'name' => 'Товар', 'packs' => 1, 'sum' => 10]);

        $this->postJson('/api/lead', $this->payload(['items' => $items]))
            ->assertStatus(422)
            ->assertJsonValidationErrors('items');
    }

    /**
     * Позиції лягають у базу як JSON, тому кожне поле обмежується
     * окремо: ліміт на кількість позицій не рятує від мегабайта тексту
     * в назві одного товару.
     */
    public function test_item_fields_are_bounded(): void
    {
        $this->postJson('/api/lead', $this->payload([
            'items' => [['sku' => 'X', 'name' => str_repeat('а', 5000), 'packs' => 1, 'sum' => 10]],
        ]))->assertStatus(422);

        $this->postJson('/api/lead', $this->payload([
            'items' => [['sku' => 'X', 'name' => 'Товар', 'packs' => 99_000_000, 'sum' => 10]],
        ]))->assertStatus(422);
    }

    /** Позиція без артикула й назви нічого не означає — відкидається. */
    public function test_empty_items_are_dropped(): void
    {
        $this->postJson('/api/lead', $this->payload([
            'items' => [
                ['sku' => '', 'name' => '', 'packs' => 5, 'sum' => 0],
                ['sku' => 'SEP-1', 'name' => 'Стакан', 'packs' => 2, 'sum' => 50],
            ],
        ]))->assertOk();

        $items = Lead::firstOrFail()->items;

        $this->assertCount(1, $items);
        $this->assertSame('SEP-1', $items[0]['sku']);
    }

    /** Невідомий тип заявки не має ламати запит — береться типовий. */
    public function test_unknown_kind_is_rejected(): void
    {
        $this->postJson('/api/lead', $this->payload(['kind' => 'hack']))->assertStatus(422);

        $this->postJson('/api/lead', $this->payload())->assertOk();
        $this->assertSame('quote', Lead::firstOrFail()->kind);
    }

    /**
     * Заявка зберігається, навіть коли сповістити менеджера не вдалось.
     *
     * Це головна причина саме такого порядку дій: падіння Telegram не
     * має втрачати звернення клієнта.
     */
    public function test_lead_survives_a_failing_notification_channel(): void
    {
        $this->mock(LeadNotifier::class, function ($mock): void {
            $mock->shouldReceive('notify')->andThrow(new \RuntimeException('Telegram недоступний'));
        });

        $this->postJson('/api/lead', $this->payload())->assertOk();

        $lead = Lead::firstOrFail();

        $this->assertFalse($lead->notified);
        $this->assertStringContainsString('Telegram недоступний', (string) $lead->notifyError);
    }

    /** Без налаштованих каналів заявка теж зберігається, з поміткою. */
    public function test_missing_channels_are_recorded_not_thrown(): void
    {
        config(['services.telegram.token' => null, 'mail.mailers.smtp.host' => null]);

        $this->postJson('/api/lead', $this->payload())->assertOk();

        $lead = Lead::firstOrFail();

        $this->assertFalse($lead->notified);
        $this->assertStringContainsString('не налаштовані', (string) $lead->notifyError);
    }

    /**
     * Текст сповіщення йде без розмітки, тож ім'я чи коментар клієнта
     * не можуть нічого зламати в чаті менеджера.
     */
    public function test_notification_text_contains_the_essentials(): void
    {
        $lead = Lead::create([
            'number' => 'SEP-TEST01',
            'kind' => 'order',
            'phone' => '+380501234567',
            'name' => 'Олена',
            'items' => [['sku' => 'SEP-1', 'name' => 'Стакан', 'packs' => 2, 'sum' => 50.0]],
            'total' => 50.0,
        ]);

        $text = app(LeadNotifier::class)->format($lead);

        $this->assertStringContainsString('SEP-TEST01', $text);
        $this->assertStringContainsString('Олена', $text);
        $this->assertStringContainsString('+38 (50) 123 45 67', $text);
        $this->assertStringContainsString('Стакан', $text);
        $this->assertStringContainsString('Разом: 50.00 грн', $text);
    }
}
