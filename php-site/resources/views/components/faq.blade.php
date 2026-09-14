@props(['items', 'title'])

@php use App\Support\Schema; @endphp

{{--
    Часті питання. Крім самого блоку дає розмітку FAQPage — вона показує
    відповіді прямо у видачі, ще до переходу на сайт.
--}}
@if (count($items))
    <section class="mt-12">
        <h2 class="text-xl">{{ $title }}</h2>
        <div class="mt-4 divide-y divide-border border-y border-border">
            @foreach ($items as $item)
                <details class="group py-3">
                    <summary class="flex cursor-pointer items-center justify-between gap-3 font-semibold marker:content-none">
                        {{ $item['q'] }}
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                             stroke-width="2.5" class="shrink-0 transition-transform group-open:rotate-180">
                            <path d="M6 9l6 6 6-6" />
                        </svg>
                    </summary>
                    <p class="mt-2 leading-relaxed text-muted">{{ $item['a'] }}</p>
                </details>
            @endforeach
        </div>
    </section>

    <x-json-ld :data="Schema::faq($items)" />
@endif
