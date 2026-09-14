@extends('layouts.site')
@php use App\Support\Url; @endphp

@section('title', $post->title.' — '.config('site.name'))
@section('description', \Illuminate\Support\Str::limit($post->excerpt, 155))

@section('content')
<div class="container-page pb-12">
    <x-breadcrumbs :items="[
        ['label' => __('site.nav.home'), 'href' => '/'],
        ['label' => __('site.nav.blog'), 'href' => '/blog/'],
        ['label' => $post->title],
    ]" />

    <article class="max-w-3xl">
        <time class="text-sm text-muted tnum" datetime="{{ $post->publishedAt->toDateString() }}">
            {{ $post->publishedAt->format('d.m.Y') }}
        </time>
        <h1 class="mt-2 text-3xl leading-tight">{{ $post->title }}</h1>
        <p class="mt-3 text-lg leading-relaxed text-muted">{{ $post->excerpt }}</p>

        <x-prose :paragraphs="$post->paragraphs" class="mt-8" />
    </article>

    {{-- Категорії, про які стаття: зв'язок веде і сюди, і назад із каталогу --}}
    @if ($related->isNotEmpty())
        <nav class="mt-10 max-w-3xl border-t border-border pt-5">
            <h2 class="mb-3 text-sm font-bold">{{ __('site.catalog.title') }}</h2>
            <div class="flex flex-wrap gap-2">
                @foreach ($related as $category)
                    <a href="{{ Url::to('/catalog/'.$category->slug.'/') }}"
                       class="chip hover:border-primary hover:text-primary">{{ $category->name }}</a>
                @endforeach
            </div>
        </nav>
    @endif

    @if ($more->isNotEmpty())
        <section class="mt-10 max-w-3xl">
            <h2 class="mb-3 text-sm font-bold">{{ __('site.catalog.readAbout') }}</h2>
            <ul class="space-y-1.5 text-sm">
                @foreach ($more as $item)
                    <li>
                        <a href="{{ Url::to('/blog/'.$item->slug.'/') }}" class="text-primary hover:underline">{{ $item->title }}</a>
                    </li>
                @endforeach
            </ul>
        </section>
    @endif

    <x-json-ld :data="[
        '@context' => 'https://schema.org',
        '@type' => 'Article',
        'headline' => $post->title,
        'description' => $post->excerpt,
        'datePublished' => $post->publishedAt->toIso8601String(),
        'mainEntityOfPage' => Url::canonical('/blog/'.$post->slug.'/'),
        'publisher' => ['@id' => rtrim(config('site.url'), '/').'/#organization'],
    ]" />
</div>
@endsection
