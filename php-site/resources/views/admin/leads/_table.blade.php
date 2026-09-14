@if ($leads->isEmpty())
    <p class="mt-3 text-sm text-muted">Заявок немає.</p>
@else
    <table class="mt-3 w-full text-sm">
        <thead class="text-left text-xs uppercase text-muted">
            <tr><th class="py-2">Номер</th><th>Дата</th><th>Клієнт</th><th>Телефон</th><th class="text-right">Сума</th><th>Стан</th></tr>
        </thead>
        <tbody class="divide-y divide-border">
            @foreach ($leads as $lead)
                <tr>
                    <td class="py-2"><a href="/admin/leads/{{ $lead->id }}/" class="font-medium text-primary">{{ $lead->number }}</a></td>
                    <td class="text-muted tnum">{{ $lead->createdAt->format('d.m.Y H:i') }}</td>
                    <td>{{ $lead->name ?: '—' }}</td>
                    <td class="tnum">{{ $lead->phone }}</td>
                    <td class="text-right tnum">{{ $lead->total ? number_format((float) $lead->total, 2, '.', ' ') : '—' }}</td>
                    <td>
                        <span class="chip !py-0.5 !text-[11px] {{ $lead->status === 'new' ? 'border-primary text-primary' : '' }}">
                            {{ $lead->status }}
                        </span>
                        @unless ($lead->notified)
                            <span class="ml-1 text-[11px] text-danger" title="{{ $lead->notifyError }}">не доставлено</span>
                        @endunless
                    </td>
                </tr>
            @endforeach
        </tbody>
    </table>
@endif
