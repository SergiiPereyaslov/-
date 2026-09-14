@extends('layouts.site')

@section('title', $page['h1'].' — '.config('site.name'))
@section('description', \Illuminate\Support\Str::limit($page['description'], 155))

@section('content')
<div class="container-page pb-12">
    <x-breadcrumbs :items="[
        ['label' => __('site.nav.home'), 'href' => '/'],
        ['label' => __('site.nav.branding'), 'href' => '/brenduvannya/'],
        ['label' => $page['h1']],
    ]" />

    <h1 class="text-3xl">{{ $page['h1'] }}</h1>
    <p class="mt-3 max-w-3xl text-lg leading-relaxed text-muted">{{ $page['description'] }}</p>

    <div class="mt-10 grid gap-8 lg:grid-cols-[1fr_380px] lg:items-start">
        <x-prose :paragraphs="$page['body'] ?? []" class="max-w-3xl" />
        <x-quote-form :source="'branding-'.$slug" kind="branding" />
    </div>
</div>
@endsection
