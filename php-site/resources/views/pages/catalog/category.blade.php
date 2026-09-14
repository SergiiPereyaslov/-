@extends('layouts.site')

@php use App\Support\Url; @endphp

@section('title', $category->h1.' — '.config('site.name'))
@section('description', \Illuminate\Support\Str::limit($category->intro, 155))

@section('content')
<div class="container-page pb-12">
    <x-breadcrumbs :items="array_values(array_filter([
        ['label' => __('site.nav.home'), 'href' => '/'],
        ['label' => __('site.catalog.title'), 'href' => '/catalog/'],
        $category->group ? ['label' => $category->group->name, 'href' => '/catalog/'.$category->group->slug.'/'] : null,
        ['label' => $category->name],
    ]))" />

    <h1 class="text-3xl">{{ $category->h1 }}</h1>
    <p class="mt-2 max-w-3xl leading-relaxed text-muted">{{ $category->intro }}</p>

    <x-category-view :products="$products" :category="$category" />

    <x-photo-gallery :photos="$photos" :title="__('site.catalog.realPhotos')" />

    <x-prose :paragraphs="$category->seo_paragraphs" class="mt-12 max-w-3xl" />

    <div class="max-w-3xl">
        <x-faq :items="$category->faq_pairs" :title="__('site.catalog.faq')" />
    </div>

    @if ($articles->isNotEmpty())
        {{--
            Зворотна перелінковка: статті вже вели в категорії через поле
            related, але назад посилань не було — граф виходив
            односпрямованим, і вага з каталогу в блог не переходила.
        --}}
        <nav class="mt-10 max-w-3xl border-t border-border pt-5">
            <h2 class="mb-2 text-sm font-bold">{{ __('site.catalog.readAbout') }}</h2>
            <ul class="space-y-1.5 text-sm">
                @foreach ($articles as $post)
                    <li>
                        <a href="{{ Url::to('/blog/'.$post->slug.'/') }}" class="text-primary hover:underline">{{ $post->title }}</a>
                        <span class="ml-2 text-muted">{{ $post->excerpt }}</span>
                    </li>
                @endforeach
            </ul>
        </nav>
    @endif
</div>
@endsection
