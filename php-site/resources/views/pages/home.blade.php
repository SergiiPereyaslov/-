@extends('layouts.site')

@php
    use App\Support\Url;

    $t = __('pages.home.copy');
    $faq = array_map(fn (array $pair): array => ['q' => $pair[0], 'a' => $pair[1]], __('pages.home.faq'));
@endphp

@section('title', __('pages.home.meta.title'))
@section('description', __('pages.home.meta.description'))

@section('content')
<div class="container-page pb-12">

    {{-- Перший екран: обіцянка, а не слайдер. Аудиторія приходить по товар. --}}
    <section class="grid gap-8 py-10 lg:grid-cols-[1.15fr_1fr] lg:items-center lg:py-14">
        <div>
            <p class="text-sm font-semibold uppercase tracking-wide text-primary">{{ $t['eyebrow'] }}</p>
            <h1 class="mt-3 text-3xl leading-tight lg:text-[2.5rem]">{{ $t['h1'] }}</h1>
            <p class="mt-4 max-w-xl text-lg leading-relaxed text-muted">{{ $t['lead'] }}</p>

            <div class="mt-6 flex flex-wrap gap-3">
                <a href="{{ Url::to('/catalog/') }}" class="btn btn-primary">{{ $t['toCatalog'] }}</a>
                <a href="#prays" class="btn btn-secondary">{{ $t['getPrice'] }}</a>
            </div>
        </div>

        {{-- Чотири цифри замість абзацу переваг: їх читають, абзац — ні --}}
        <ul class="grid grid-cols-2 gap-3">
            @foreach ($t['advantages'] as [$value, $label])
                <li class="card p-4">
                    <b class="font-display text-xl text-primary tnum">{{ $value }}</b>
                    <p class="mt-1 text-sm leading-snug text-muted">{{ $label }}</p>
                </li>
            @endforeach
        </ul>
    </section>

    <section class="mt-6">
        <h2 class="text-2xl">{{ $t['groupsTitle'] }}</h2>
        <p class="mt-1 max-w-2xl text-muted">{{ $t['groupsLead'] }}</p>

        <div class="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            @foreach ($groups as $group)
                <a href="{{ Url::to('/catalog/'.$group->slug.'/') }}"
                   class="card group flex items-center gap-4 p-4 transition hover:border-primary/50">
                    <x-placeholder :shape="config('site.group_shapes.'.$group->slug, 'box')" class="h-16 w-16 shrink-0 rounded" />
                    <div class="min-w-0">
                        <h3 class="font-display font-bold leading-snug group-hover:text-primary">{{ $group->name }}</h3>
                        <p class="mt-0.5 line-clamp-2 text-xs text-muted">{{ $group->intro }}</p>
                    </div>
                </a>
            @endforeach
        </div>
    </section>

    @if ($hits->isNotEmpty())
        <section class="mt-12">
            <h2 class="text-2xl">{{ $t['hitsTitle'] }}</h2>
            <div class="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-4">
                @foreach ($hits as $product)
                    <x-product-card :product="$product" />
                @endforeach
            </div>
        </section>
    @endif

    {{-- Другий вхід у каталог: за типом закладу, а не за видом товару --}}
    <section class="mt-12 ab-b">
        <h2 class="text-2xl">{{ $t['audienceTitle'] }}</h2>
        <p class="mt-1 max-w-2xl text-muted">{{ $t['audienceLead'] }}</p>

        <div class="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            @foreach (config('sectors') as $sector)
                <a href="{{ Url::to('/dlya/'.$sector['slug'].'/') }}"
                   class="card p-4 transition hover:border-primary/50">
                    <h3 class="font-display font-bold">{{ $sector['forWhom'][app()->getLocale()] }}</h3>
                    <p class="mt-1 line-clamp-3 text-sm text-muted">{{ $sector['intro'][app()->getLocale()] }}</p>
                </a>
            @endforeach
        </div>
    </section>

    <section class="mt-12 grid gap-6 rounded-lg border border-border bg-kraft p-6 lg:grid-cols-[1.2fr_1fr] lg:items-center lg:p-8">
        <div>
            <h2 class="text-2xl">{{ $t['brandTitle'] }}</h2>
            <p class="mt-2 leading-relaxed text-muted">{{ $t['brandLead'] }}</p>
            <a href="{{ Url::to('/brenduvannya/') }}" class="btn btn-primary mt-5">{{ $t['brandCta'] }}</a>
        </div>
    </section>

    <section class="mt-12">
        <h2 class="text-2xl">{{ $t['stepsTitle'] }}</h2>
        <ol class="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            @foreach ($t['steps'] as $i => [$title, $body])
                <li class="card p-4">
                    <span class="font-display text-sm font-bold text-primary tnum">{{ $i + 1 }}</span>
                    <h3 class="mt-1 font-display font-bold">{{ $title }}</h3>
                    <p class="mt-1 text-sm leading-snug text-muted">{{ $body }}</p>
                </li>
            @endforeach
        </ol>
    </section>

    <div class="mt-12 grid gap-8 lg:grid-cols-[1fr_380px] lg:items-start">
        <div class="max-w-3xl">
            <x-faq :items="$faq" :title="$t['faqTitle']" />
        </div>

        <div id="prays" class="lg:mt-12">
            <x-quote-form source="home" />
        </div>
    </div>

    <x-json-ld :data="$localBusiness" />
</div>
@endsection
