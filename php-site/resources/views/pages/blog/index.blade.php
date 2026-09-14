@extends('layouts.site')
@php use App\Support\Url; @endphp

@section('title', __('pages.blog.meta.title'))
@section('description', __('pages.blog.meta.description'))

@push('head')
    <link rel="alternate" type="application/rss+xml" title="{{ config('site.name') }}"
          href="{{ Url::canonical('/blog/rss.xml') }}">
@endpush

@section('content')
<div class="container-page pb-12">
    <x-breadcrumbs :items="[
        ['label' => __('site.nav.home'), 'href' => '/'],
        ['label' => __('site.nav.blog')],
    ]" />

    <h1 class="text-3xl">{{ __('site.nav.blog') }}</h1>

    <div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        @foreach ($posts as $post)
            <article class="card flex flex-col p-5 transition hover:border-primary/50">
                <time class="text-xs text-muted tnum" datetime="{{ $post->publishedAt->toDateString() }}">
                    {{ $post->publishedAt->format('d.m.Y') }}
                </time>
                <h2 class="mt-2 font-display text-lg font-bold leading-snug">
                    <a href="{{ Url::to('/blog/'.$post->slug.'/') }}" class="hover:text-primary">{{ $post->title }}</a>
                </h2>
                <p class="mt-2 flex-1 text-sm leading-relaxed text-muted">{{ $post->excerpt }}</p>
            </article>
        @endforeach
    </div>
</div>
@endsection
