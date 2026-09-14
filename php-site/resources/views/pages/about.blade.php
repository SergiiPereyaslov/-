@extends('layouts.site')
@php use App\Support\Url; @endphp

@section('title', __('pages.about.meta.title'))
@section('description', __('pages.about.meta.description'))

@section('content')
<div class="container-page pb-12">
    <x-breadcrumbs :items="[
        ['label' => __('site.nav.home'), 'href' => '/'],
        ['label' => __('site.nav.about')],
    ]" />

    <h1 class="text-3xl">{{ $t['h1'] }}</h1>
    <p class="mt-3 max-w-3xl text-lg leading-relaxed text-muted">{{ $t['lead'] }}</p>

    <div class="mt-10 max-w-3xl space-y-10">
        <x-prose :paragraphs="(array) ($t['body'] ?? [])" />

        <section>
            <h2 class="text-2xl">{{ $t['factsTitle'] }}</h2>
            <ul class="mt-4 grid gap-3 sm:grid-cols-2">
                @foreach ($t['facts'] as $row)
                    <li class="card p-4">
                        @if (is_array($row))
                            <b class="font-display text-xl text-primary tnum">{{ $row[0] }}</b>
                            <p class="mt-1 text-sm leading-snug text-muted">{{ $row[1] }}</p>
                        @else
                            <p class="text-sm leading-snug text-muted">{{ $row }}</p>
                        @endif
                    </li>
                @endforeach
            </ul>
        </section>

        <section>
            <h2 class="text-2xl">{{ $t['valuesTitle'] }}</h2>
            <ul class="mt-4 space-y-3">
                @foreach ($t['values'] as $row)
                    <li class="card p-4">
                        @if (is_array($row))
                            <h3 class="font-display font-bold">{{ $row[0] }}</h3>
                            <p class="mt-1 text-sm leading-snug text-muted">{{ $row[1] }}</p>
                        @else
                            <p class="text-sm leading-snug text-muted">{{ $row }}</p>
                        @endif
                    </li>
                @endforeach
            </ul>
        </section>

        @if (! empty($t['showroom']))
            <section>
                <h2 class="text-2xl">{{ $t['reqTitle'] ?? '' }}</h2>
                <p class="mt-2 leading-relaxed text-muted">{{ is_array($t['showroom']) ? implode(' ', $t['showroom']) : $t['showroom'] }}</p>
            </section>
        @endif

        <a href="{{ Url::to('/catalog/') }}" class="btn btn-primary">{{ $t['catalogCta'] }}</a>
    </div>
</div>
@endsection
