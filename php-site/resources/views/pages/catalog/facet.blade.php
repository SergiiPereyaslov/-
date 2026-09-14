@extends('layouts.site')

@section('title', $category->name.' — '.$facet['label'].' — '.config('site.name'))
@section('description', \Illuminate\Support\Str::limit($category->intro, 155))

@section('content')
<div class="container-page pb-12">
    <x-breadcrumbs :items="array_values(array_filter([
        ['label' => __('site.nav.home'), 'href' => '/'],
        ['label' => __('site.catalog.title'), 'href' => '/catalog/'],
        $category->group ? ['label' => $category->group->name, 'href' => '/catalog/'.$category->group->slug.'/'] : null,
        ['label' => $category->name, 'href' => '/catalog/'.$category->slug.'/'],
        ['label' => $facet['label']],
    ]))" />

    <h1 class="text-3xl">{{ $category->name }} — {{ $facet['label'] }}</h1>
    <p class="mt-2 max-w-3xl leading-relaxed text-muted">{{ $category->intro }}</p>

    <x-category-view :products="$products" :category="$category" :locked-facet="$facet" />
</div>
@endsection
