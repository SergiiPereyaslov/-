@extends('layouts.site')

@php
    use App\Support\Url;

    $l = app()->getLocale();
    $paragraphs = array_map(fn (array $p): string => $p[$l] ?? $p['uk'], $sector['body']);
    $faq = array_map(fn (array $item): array => [
        'q' => $item['q'][$l] ?? $item['q']['uk'],
        'a' => $item['a'][$l] ?? $item['a']['uk'],
    ], $sector['faq']);
@endphp

@section('title', $sector['h1'][$l].' — '.config('site.name'))
@section('description', \Illuminate\Support\Str::limit($sector['intro'][$l], 155))

@section('content')
<div class="container-page pb-12">
    <x-breadcrumbs :items="[
        ['label' => __('site.nav.home'), 'href' => '/'],
        ['label' => $sector['forWhom'][$l]],
    ]" />

    <h1 class="text-3xl">{{ $sector['h1'][$l] }}</h1>
    <p class="mt-3 max-w-3xl text-lg leading-relaxed text-muted">{{ $sector['intro'][$l] }}</p>

    {{--
        Стартовий комплект у порядку, у якому його зазвичай замовляють.
        Кожна позиція — з поясненням, навіщо вона: це і є відповідь на
        запит «що потрібно для закладу», заради якої сюди й заходять.
    --}}
    <section class="mt-10">
        <h2 class="text-2xl">{{ __('site.catalog.title') }}</h2>
        <ol class="mt-4 space-y-3">
            @foreach ($sector['kit'] as $i => $item)
                @php $category = $categories[$item['category']] ?? null; @endphp
                @if ($category)
                    <li class="card flex gap-4 p-4">
                        <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary font-display text-sm font-bold text-on-primary tnum">{{ $i + 1 }}</span>
                        <div class="min-w-0 flex-1">
                            <h3 class="font-display font-bold">
                                <a href="{{ Url::to('/catalog/'.$category->slug.'/') }}" class="hover:text-primary">{{ $category->name }}</a>
                                <span class="ml-2 text-xs font-normal text-muted tnum">
                                    {{ $counts[$category->slug] ?? 0 }} {{ __('site.common.products') }}
                                </span>
                            </h3>
                            <p class="mt-1 text-sm leading-snug text-muted">{{ $item['why'][$l] ?? $item['why']['uk'] }}</p>
                        </div>
                    </li>
                @endif
            @endforeach
        </ol>
    </section>

    <div class="mt-12 grid gap-8 lg:grid-cols-[1fr_380px] lg:items-start">
        <div class="max-w-3xl">
            <x-prose :paragraphs="$paragraphs" />
            <x-faq :items="$faq" :title="__('site.catalog.faq')" />
        </div>
        <x-quote-form :source="'sector-'.$sector['slug']" />
    </div>
</div>
@endsection
