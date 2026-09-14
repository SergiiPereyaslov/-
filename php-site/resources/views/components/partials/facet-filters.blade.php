{{--
    Набір фільтрів категорії.

    Значення, під якими немає жодного товару, не показуються взагалі:
    фільтр, що гарантовано дає порожню видачу, тільки заважає.
--}}
<div class="space-y-5">
    @foreach ($facets as $facet)
        <fieldset>
            <legend class="mb-2 text-sm font-bold">{{ $pick($facet['label']) }}</legend>
            <div class="space-y-1.5">
                @foreach ($facet['values'] as $value)
                    @php $n = $counts[$facet['key']][$value['value']] ?? 0; @endphp
                    @if ($n > 0)
                        <label class="flex cursor-pointer items-center gap-2.5 text-sm">
                            <input type="checkbox" class="h-4 w-4 shrink-0 accent-[var(--primary)]"
                                   value="{{ $value['value'] }}"
                                   @change="toggle('{{ $facet['key'] }}', '{{ $value['value'] }}')"
                                   :checked="isSelected('{{ $facet['key'] }}', '{{ $value['value'] }}')">
                            <span class="flex-1">{{ $pick($value['label']) }}</span>
                            <span class="text-xs text-muted tnum">{{ $n }}</span>
                        </label>
                    @endif
                @endforeach
            </div>
        </fieldset>
    @endforeach
</div>
