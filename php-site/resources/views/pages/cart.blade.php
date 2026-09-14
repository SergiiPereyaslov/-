@extends('layouts.site')

@php use App\Support\Url; @endphp

@section('title', __('site.cart.title').' — '.config('site.name'))
@section('description', __('site.cart.note'))

@push('head')
    {{-- Кошик не має потрапляти в індекс: у кожного відвідувача він свій --}}
    <meta name="robots" content="noindex, nofollow">
@endpush

@section('content')
<div class="container-page pb-12" x-data="cartView({{ Js::from(['tierHint' => __('site.cart.tierHint')]) }})">
    <x-breadcrumbs :items="[
        ['label' => __('site.nav.home'), 'href' => '/'],
        ['label' => __('site.cart.title')],
    ]" />

    <h1 class="text-3xl">{{ __('site.cart.title') }}</h1>

    <p class="py-10 text-muted" x-show="!ready">{{ __('site.common.loading') }}</p>

    <div class="card mt-6 p-10 text-center" x-show="ready && lines.length === 0" x-cloak>
        <p class="font-display text-lg font-bold">{{ __('site.cart.empty') }}</p>
        <p class="mt-2 text-sm text-muted">{{ __('site.cart.emptyHint') }}</p>
        <a href="{{ Url::to('/catalog/') }}" class="btn btn-primary mt-5">{{ __('site.cart.goToCatalog') }}</a>
    </div>

    <div class="mt-6 grid gap-8 lg:grid-cols-[1fr_340px] lg:items-start"
         x-show="ready && lines.length > 0" x-cloak>
        <ul class="space-y-3">
            <template x-for="line in lines" :key="line.slug">
                <li class="card p-3 sm:p-4">
                    <div class="flex gap-3">
                        <a :href="'{{ Url::to('/product/') }}' + line.slug + '/'" class="shrink-0">
                            <div class="flex h-20 w-20 items-center justify-center rounded bg-accent-soft">
                                <svg viewBox="0 0 80 80" class="h-1/2 w-1/2 text-primary opacity-40" fill="none"
                                     stroke="currentColor" stroke-width="2.5" stroke-linecap="round">
                                    <path d="M14 32h52v30a4 4 0 0 1-4 4H18a4 4 0 0 1-4-4z" />
                                </svg>
                            </div>
                        </a>

                        <div class="min-w-0 flex-1">
                            <a :href="'{{ Url::to('/product/') }}' + line.slug + '/'"
                               class="font-medium hover:text-primary" x-text="line.name"></a>
                            <p class="mt-0.5 text-xs text-muted tnum">
                                {{ __('site.common.sku') }} <span x-text="line.sku"></span> ·
                                <span x-text="line.unitsPerPack"></span> {{ __('site.common.pcs') }}/{{ __('site.common.packs') }}
                            </p>

                            <div class="mt-3 flex flex-wrap items-center gap-3">
                                <div class="flex items-center rounded-md border border-border">
                                    <button type="button" class="h-9 w-8 text-lg leading-none disabled:opacity-40"
                                            aria-label="{{ __('site.a11y.decrease') }}"
                                            :disabled="line.packs <= 1"
                                            @click="setPacks(line.slug, line.packs - 1)">−</button>
                                    <input type="text" inputmode="numeric"
                                           class="w-8 border-x border-border bg-transparent py-1 text-center text-sm tnum"
                                           :value="line.packs"
                                           @change="setPacks(line.slug, $event.target.value)">
                                    <button type="button" class="h-9 w-8 text-lg leading-none"
                                            aria-label="{{ __('site.a11y.increase') }}"
                                            @click="setPacks(line.slug, line.packs + 1)">+</button>
                                </div>

                                <span class="text-sm text-muted tnum"
                                      x-text="line.unitPrice.toFixed(2) + ' {{ __('site.common.uah') }}/{{ __('site.common.pcs') }}'"></span>

                                <span class="ml-auto font-display text-lg font-bold tnum"
                                      x-text="line.sum.toFixed(2) + ' {{ __('site.common.uah') }}'"></span>

                                <button type="button" class="text-muted hover:text-danger"
                                        aria-label="{{ __('site.cart.remove') }}"
                                        @click="$store.cart.remove(line.slug)">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                                        <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
                                    </svg>
                                </button>
                            </div>

                            <p class="mt-2 rounded-md bg-accent-soft px-2.5 py-1.5 text-xs font-medium text-accent"
                               x-show="line.nextTier" x-cloak x-text="line.nextTier && tierHint(line)"></p>
                        </div>
                    </div>
                </li>
            </template>
        </ul>

        <aside class="card sticky top-32 p-5">
            <div class="flex items-baseline justify-between">
                <span class="font-medium">{{ __('site.cart.total') }}</span>
                <b class="font-display text-2xl tnum" x-text="totalSum.toFixed(2) + ' {{ __('site.common.uah') }}'"></b>
            </div>
            <a href="{{ Url::to('/oformlennya/') }}" class="btn btn-primary mt-4 w-full">{{ __('site.cart.checkout') }}</a>
            <p class="mt-3 text-xs leading-snug text-muted">{{ __('site.cart.note') }}</p>
        </aside>
    </div>
</div>
@endsection
