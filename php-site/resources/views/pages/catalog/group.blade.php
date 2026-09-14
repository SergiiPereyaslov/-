@extends('layouts.site')

@section('title', $group->h1.' — '.config('site.name'))
@section('description', \Illuminate\Support\Str::limit($group->intro, 155))

@section('content')
<div class="container-page pb-12">
    <x-breadcrumbs :items="[
        ['label' => __('site.nav.home'), 'href' => '/'],
        ['label' => __('site.catalog.title'), 'href' => '/catalog/'],
        ['label' => $group->name],
    ]" />

    <h1 class="text-3xl">{{ $group->h1 }}</h1>
    <p class="mt-2 max-w-3xl leading-relaxed text-muted">{{ $group->intro }}</p>

    <div class="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        @foreach ($group->categories as $category)
            @include('pages.catalog._category-card', [
                'category' => $category,
                'shape' => config('site.group_shapes.'.$group->slug, 'box'),
                'stats' => $counts[$category->slug] ?? ['count' => 0, 'min' => 0],
                'size' => 'h-16 w-16',
            ])
        @endforeach
    </div>

    @if ($topProducts->isNotEmpty())
        <section class="mt-12">
            <h2 class="text-xl">{{ __('site.catalog.title') }}</h2>
            <div class="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-4">
                @foreach ($topProducts as $product)
                    <x-product-card :product="$product" />
                @endforeach
            </div>
        </section>
    @endif

    <x-prose :paragraphs="$group->seo_paragraphs" class="mt-12 max-w-3xl" />
</div>
@endsection
