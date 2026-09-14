@extends('layouts.site')

@php
    use App\Support\Url;

    $l = app()->getLocale();
    $name = $city['name'][$l];
    $locative = $city['locative'][$l];
    $h1 = $l === 'uk' ? "Упаковка для їжі {$locative}" : "Упаковка для еды {$locative}";
    $paragraphs = array_map(fn (array $p): string => $p[$l] ?? $p['uk'], $city['body']);
@endphp

@section('title', $h1.' — '.config('site.name'))
@section('description', \Illuminate\Support\Str::limit($city['intro'][$l], 155))

@section('content')
<div class="container-page pb-12">
    <x-breadcrumbs :items="[
        ['label' => __('site.nav.home'), 'href' => '/'],
        ['label' => $name],
    ]" />

    <h1 class="text-3xl">{{ $h1 }}</h1>
    <p class="mt-3 max-w-3xl text-lg leading-relaxed text-muted">{{ $city['intro'][$l] }}</p>

    {{-- Умови доставки — головне, заради чого відкривають цю сторінку --}}
    <div class="mt-6 flex flex-wrap gap-3">
        <span class="chip">{{ $city['delivery'][$l] }}</span>
        <span class="chip">{{ $city['leadTime'][$l] }}</span>
        @if ($city['home'])
            <span class="chip text-primary">{{ __('site.product.deliveryNote') }}</span>
        @endif
    </div>

    <section class="mt-10">
        <h2 class="text-2xl">{{ __('site.catalog.title') }}</h2>
        <div class="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            @foreach ($groups as $group)
                <a href="{{ Url::to('/catalog/'.$group->slug.'/') }}"
                   class="card group flex items-center gap-3 p-4 transition hover:border-primary/50">
                    <x-placeholder :shape="config('site.group_shapes.'.$group->slug, 'box')" class="h-14 w-14 shrink-0 rounded" />
                    <div class="min-w-0">
                        <h3 class="font-semibold leading-snug group-hover:text-primary">{{ $group->name }}</h3>
                        @if (isset($minPrices[$group->slug]))
                            <p class="mt-0.5 text-xs text-muted tnum">
                                {{ __('site.common.from') }} {{ number_format($minPrices[$group->slug], 2, '.', '') }} {{ __('site.common.uah') }}
                            </p>
                        @endif
                    </div>
                </a>
            @endforeach
        </div>
    </section>

    <div class="mt-12 grid gap-8 lg:grid-cols-[1fr_380px] lg:items-start">
        <x-prose :paragraphs="$paragraphs" class="max-w-3xl" />
        <x-quote-form :source="'city-'.$city['slug']" />
    </div>
</div>
@endsection
