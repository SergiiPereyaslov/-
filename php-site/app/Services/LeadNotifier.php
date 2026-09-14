<?php

namespace App\Services;

use App\Models\Lead;
use App\Support\Format;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

/**
 * Сповіщення менеджера про нову заявку.
 *
 * Обидва канали необов'язкові й вмикаються наявністю змінних оточення.
 * Помилка каналу ніколи не валить запит: заявка вже збережена в базі, а
 * причина невдачі пишеться в поле notifyError, щоб її було видно в
 * адмінці й не довелось шукати в журналах.
 */
class LeadNotifier
{
    private const KIND_LABELS = [
        'quote' => 'Запит прайсу',
        'order' => 'Замовлення',
        'branding' => 'Брендування',
    ];

    private const DELIVERY_LABELS = [
        'pickup' => 'Самовивіз',
        'city' => 'Доставка по Дніпру',
        'np' => 'Нова пошта',
    ];

    /** Telegram не має тримати запит клієнта довше, ніж кілька секунд. */
    private const TIMEOUT_SECONDS = 8;

    /**
     * Надсилає в усі налаштовані канали.
     *
     * @return array{delivered: list<string>, error: string|null}
     */
    public function notify(Lead $lead): array
    {
        $text = $this->format($lead);
        $subject = sprintf(
            '%s %s — %s',
            self::KIND_LABELS[$lead->kind] ?? 'Заявка',
            $lead->number,
            Format::phone($lead->phone),
        );

        $delivered = [];
        $errors = [];

        foreach (['telegram' => fn () => $this->sendTelegram($text),
            'email' => fn () => $this->sendEmail($subject, $text)] as $channel => $send) {
            try {
                if ($send()) {
                    $delivered[] = $channel;
                }
            } catch (Throwable $e) {
                $errors[] = "{$channel}: {$e->getMessage()}";
                Log::warning("Не вдалось сповістити через {$channel}", ['lead' => $lead->number]);
            }
        }

        if ($delivered === [] && $errors === []) {
            return [
                'delivered' => [],
                'error' => 'Канали сповіщень не налаштовані (TELEGRAM_BOT_TOKEN / MAIL_HOST)',
            ];
        }

        return [
            'delivered' => $delivered,
            'error' => $errors === [] ? null : implode(' | ', $errors),
        ];
    }

    /**
     * Один текст для Telegram і для листа — щоб вони не розходились.
     *
     * Розмітки навмисно немає: повідомлення йде без parse_mode, а лист —
     * без HTML-частини. Ім'я чи коментар клієнта не може нічого зламати
     * в чаті менеджера, бо все це звичайний текст.
     */
    public function format(Lead $lead): string
    {
        $rows = array_filter([
            sprintf('%s %s', self::KIND_LABELS[$lead->kind] ?? $lead->kind, $lead->number),
            '',
            $this->line('Імʼя', $lead->name),
            'Телефон: '.Format::phone($lead->phone),
            $this->line('E-mail', $lead->email),
            $this->line('Заклад', $lead->company),
            $this->line('Отримання', $lead->delivery
                ? (self::DELIVERY_LABELS[$lead->delivery] ?? $lead->delivery)
                : null),
            $this->line('Місто/відділення', $lead->city),
            $this->line('Тип клієнта', match ($lead->customerType) {
                'company' => 'ФОП / ТОВ',
                null, '' => null,
                default => 'Фізична особа',
            }),
            $this->line('Джерело', $lead->source),
            $this->line('Мова', $lead->locale),
            $this->line('Коментар', $lead->comment),
        ], fn ($row): bool => $row !== null);

        $items = $lead->items ?? [];

        if ($items !== []) {
            $rows[] = '';
            $rows[] = 'Замовлення:';

            foreach ($items as $item) {
                $rows[] = sprintf(
                    '  • %s — %d пач. = %.2f грн (%s)',
                    $item['name'] ?? '',
                    $item['packs'] ?? 0,
                    $item['sum'] ?? 0,
                    $item['sku'] ?? '',
                );
            }

            if ($lead->total !== null) {
                $rows[] = sprintf('Разом: %.2f грн', (float) $lead->total);
            }
        }

        return implode("\n", $rows);
    }

    private function line(string $label, ?string $value): ?string
    {
        return $value ? "{$label}: {$value}" : null;
    }

    private function sendTelegram(string $text): bool
    {
        $token = config('services.telegram.token');
        $chatId = config('services.telegram.chat_id');

        if (! $token || ! $chatId) {
            return false;
        }

        $response = Http::timeout(self::TIMEOUT_SECONDS)
            ->post("https://api.telegram.org/bot{$token}/sendMessage", [
                'chat_id' => $chatId,
                'text' => $text,
                'disable_web_page_preview' => true,
            ]);

        $response->throw();

        return true;
    }

    private function sendEmail(string $subject, string $text): bool
    {
        $to = config('services.lead_email_to') ?: config('site.email');

        if (! config('mail.mailers.smtp.host') || ! $to) {
            return false;
        }

        Mail::raw($text, function ($message) use ($to, $subject): void {
            $message->to($to)->subject($subject);
        });

        return true;
    }
}
