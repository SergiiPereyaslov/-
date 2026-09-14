@extends('layouts.site')

@php use App\Support\Url; @endphp

@section('title', __('site.catalog.title').' — '.config('site.name'))
@section('description', __('site.catalog.metaDescription', ['total' => $productCount, 'categories' => $categoryCount]))

@section('content')
<div class="container-page pb-12">
    <x-breadcrumbs :items="[
        ['label' => __('site.nav.home'), 'href' => '/'],
        ['label' => __('site.catalog.title')],
    ]" />

    <h1 class="text-3xl">{{ __('site.catalog.title') }}</h1>
    <p class="mt-2 max-w-2xl text-muted">
        {{ __('site.catalog.intro', ['groups' => $groups->count(), 'categories' => $categoryCount]) }}
    </p>

    <div class="mt-8 space-y-10">
        @foreach ($groups as $group)
            <section>
                <div class="mb-4 flex items-baseline justify-between gap-4 border-b border-border pb-2">
                    <h2 class="text-xl">
                        <a href="{{ Url::to('/catalog/'.$group->slug.'/') }}" class="hover:text-primary">{{ $group->name }}</a>
                    </h2>
                    <a href="{{ Url::to('/catalog/'.$group->slug.'/') }}" class="shrink-0 text-sm text-primary">
                        {{ __('site.common.all') }} →
                    </a>
                </div>

                <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    @foreach ($group->categories as $category)
                        @include('pages.catalog._category-card', [
                            'category' => $category,
                            'shape' => config('site.group_shapes.'.$group->slug, 'box'),
                            'stats' => $counts[$category->slug] ?? ['count' => 0, 'min' => 0],
                            'size' => 'h-14 w-14',
                        ])
                    @endforeach
                </div>
            </section>
        @endforeach
    </div>
</div>
@endsection
