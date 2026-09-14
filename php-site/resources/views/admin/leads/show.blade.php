@extends('admin.layout')
@section('title', $lead->number)

@section('content')
<a href="/admin/leads/" class="text-sm text-primary">← {{ __('admin.nav.leads') }}</a>

<h1 class="mt-2 font-display text-2xl font-bold">{{ $lead->number }}</h1>

<div class="mt-5 grid gap-6 lg:grid-cols-[1fr_340px] lg:items-start">
    <div class="space-y-6">
        <dl class="card divide-y divide-border">
            @foreach ([
                'Створено' => $lead->createdAt->format('d.m.Y H:i'),
                'Тип' => $lead->kind,
                'Імʼя' => $lead->name,
                'Телефон' => $lead->phone,
                'E-mail' => $lead->email,
                'Заклад' => $lead->company,
                'Отримання' => $lead->delivery,
                'Місто/відділення' => $lead->city,
                'Тип клієнта' => $lead->customerType,
                'Джерело' => $lead->source,
                'Мова' => $lead->locale,
                'Варіант тесту' => $lead->abVariant,
            ] as $label => $value)
                @if ($value)
                    <div class="flex flex-wrap justify-between gap-3 px-4 py-2.5 text-sm">
                        <dt class="text-muted">{{ $label }}</dt>
                        <dd class="text-right font-medium">{{ $value }}</dd>
                    </div>
                @endif
            @endforeach
        </dl>

        @if ($lead->comment)
            <div class="card p-4">
                <h2 class="text-sm font-bold">Коментар клієнта</h2>
                <p class="mt-1 whitespace-pre-line text-sm text-muted">{{ $lead->comment }}</p>
            </div>
        @endif

        @if ($lead->requisites)
            <div class="card p-4">
                <h2 class="text-sm font-bold">Реквізити</h2>
                <p class="mt-1 whitespace-pre-line text-sm text-muted">{{ $lead->requisites }}</p>
            </div>
        @endif

        @if ($lead->items)
            <div class="card p-4">
                <h2 class="text-sm font-bold">Замовлення</h2>
                {{--
                    Суми заявлені клієнтом, а не перераховані сервером:
                    менеджер підтверджує рахунок вручну, і підпис має це
                    називати прямо.
                --}}
                <p class="mt-0.5 text-xs text-muted">Суми з кошика клієнта на момент заявки</p>
                <table class="mt-3 w-full text-sm">
                    <tbody class="divide-y divide-border">
                        @foreach ($lead->items as $item)
                            <tr>
                                <td class="py-1.5">{{ $item['name'] ?? '' }}</td>
                                <td class="text-muted tnum">{{ $item['sku'] ?? '' }}</td>
                                <td class="text-right tnum">{{ $item['packs'] ?? 0 }} пач.</td>
                                <td class="text-right font-medium tnum">{{ number_format((float) ($item['sum'] ?? 0), 2, '.', ' ') }}</td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
                @if ($lead->total)
                    <p class="mt-3 text-right font-display text-lg font-bold tnum">
                        {{ number_format((float) $lead->total, 2, '.', ' ') }} грн
                    </p>
                @endif
            </div>
        @endif

        @unless ($lead->notified)
            <div class="card border-danger p-4">
                <h2 class="text-sm font-bold text-danger">Не доставлено менеджеру</h2>
                <p class="mt-1 text-xs text-muted">{{ $lead->notifyError }}</p>
            </div>
        @endunless
    </div>

    <form method="post" action="/admin/leads/{{ $lead->id }}/" class="card sticky top-4 p-5">
        @csrf
        @method('put')

        <label class="block">
            <span class="mb-1 block text-sm font-medium">Стан</span>
            <select name="status" class="field">
                @foreach (\App\Models\Lead::STATUSES as $value)
                    <option value="{{ $value }}" @selected($lead->status === $value)>{{ $value }}</option>
                @endforeach
            </select>
        </label>

        <label class="mt-3 block">
            <span class="mb-1 block text-sm font-medium">Нотатка менеджера</span>
            <textarea name="managerNote" class="field min-h-32" maxlength="4000">{{ old('managerNote', $lead->managerNote) }}</textarea>
        </label>

        <button type="submit" class="btn btn-primary mt-4 w-full">Зберегти</button>
    </form>
</div>
@endsection
