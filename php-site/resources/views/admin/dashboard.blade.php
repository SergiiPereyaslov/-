@extends('admin.layout')
@section('title', __('admin.nav.dashboard'))

@section('content')
<h1 class="font-display text-2xl font-bold">{{ __('admin.nav.dashboard') }}</h1>

<div class="mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
    @foreach ([
        'Нові заявки' => $counts['new'],
        'Усього заявок' => $counts['leads'],
        'Товарів' => $counts['products'],
        'Категорій' => $counts['categories'],
        'Статей' => $counts['posts'],
    ] as $label => $value)
        <div class="card p-4">
            <b class="font-display text-2xl tnum">{{ $value }}</b>
            <p class="mt-0.5 text-xs text-muted">{{ $label }}</p>
        </div>
    @endforeach
</div>

@if ($undelivered->isNotEmpty())
    {{--
        Заявки, які не вдалось доставити менеджеру. Показуються першими:
        така заявка вже в базі, але про неї ніхто не знає — саме її можна
        втратити.
    --}}
    <section class="mt-8">
        <h2 class="font-display text-lg font-bold text-danger">Не доставлені менеджеру</h2>
        <ul class="mt-3 space-y-2">
            @foreach ($undelivered as $lead)
                <li class="card p-3 text-sm">
                    <a href="/admin/leads/{{ $lead->id }}/" class="font-medium text-primary">{{ $lead->number }}</a>
                    <span class="ml-2 text-muted">{{ $lead->phone }}</span>
                    <p class="mt-1 text-xs text-danger">{{ \Illuminate\Support\Str::limit($lead->notifyError, 200) }}</p>
                </li>
            @endforeach
        </ul>
    </section>
@endif

<section class="mt-8">
    <h2 class="font-display text-lg font-bold">Останні заявки</h2>
    @include('admin.leads._table', ['leads' => $recent])
</section>

<section class="mt-8">
    <h2 class="font-display text-lg font-bold">{{ __('admin.nav.ab') }}</h2>
    @if (! $abEnabled)
        <p class="mt-2 text-sm text-muted">Тест вимкнений — усі бачать варіант «b».</p>
    @elseif ($ab->isEmpty())
        <p class="mt-2 text-sm text-muted">Даних ще немає.</p>
    @else
        <table class="mt-3 w-full text-sm">
            <thead class="text-left text-xs uppercase text-muted">
                <tr>
                    <th class="py-2">День</th><th>Варіант</th><th class="text-right">Сесії</th>
                    <th class="text-right">Каталог</th><th class="text-right">Кошик</th>
                    <th class="text-right">Пошук</th><th class="text-right">Заявки</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-border">
                @foreach ($ab as $row)
                    <tr class="tnum">
                        <td class="py-2">{{ $row->day->format('d.m.Y') }}</td>
                        <td class="font-semibold">{{ $row->variant }}</td>
                        <td class="text-right">{{ $row->sessions }}</td>
                        <td class="text-right">{{ $row->catalog }}</td>
                        <td class="text-right">{{ $row->cart }}</td>
                        <td class="text-right">{{ $row->search }}</td>
                        <td class="text-right font-semibold">{{ $row->leads }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    @endif
</section>
@endsection
