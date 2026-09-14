@extends('layouts.site')

@section('title', $blocks['title'] ?? $title)
@section('description', $blocks['title'] ?? $title)

@section('content')
<div class="container-page pb-12">
    <x-breadcrumbs :items="[
        ['label' => __('site.nav.home'), 'href' => '/'],
        ['label' => $blocks['title'] ?? $title],
    ]" />

    <h1 class="text-3xl">{{ $blocks['title'] ?? $title }}</h1>

    @if (! empty($blocks['updated']))
        <p class="mt-2 text-sm text-muted">Оновлено: {{ $blocks['updated'] }}</p>
    @endif

    <div class="prose-uk mt-8 max-w-3xl">
        @foreach ($blocks['sections'] ?? [] as $section)
            <h2>{{ $section['h'] }}</h2>
            @foreach ($section['p'] as $paragraph)
                <p>{{ $paragraph }}</p>
            @endforeach
        @endforeach
    </div>
</div>
@endsection
