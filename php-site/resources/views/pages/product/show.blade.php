@extends('layouts.site')

@php use App\Support\Url; @endphp

@section('title', $product->name.' — '.number_format((float) $product->priceRetail * $product->unitsPerPack, 2, '.', '').' грн')
@section('description', \Illuminate\Support\Str::limit($product->description ?: $product->spec, 155))

@section('content')
<div class="container-page pb-12">
    <x-breadcrumbs :items="array_values(array_filter([
        ['label' => __('site.nav.home'), 'href' => '/'],
        ['label' => __('site.catalog.title'), 'href' => '/catalog/'],
        $group ? ['label' => $group->name, 'href' => '/catalog/'.$group->slug.'/'] : null,
        $category ? ['label' => $category->name, 'href' => '/catalog/'.$category->slug.'/'] : null,
        ['label' => $product->name],
    ]))" />

    <div class="grid gap-8 lg:grid-cols-[1fr_400px]">
        <div>
            <x-placeholder :shape="$product->shape ?? 'box'" class="aspect-square w-full rounded-lg border border-border" />
            <div class="mt-3 grid grid-cols-4 gap-2">
                @for ($i = 0; $i < 4; $i++)
                    <x-placeholder :shape="$product->shape ?? 'box'" class="aspect-square rounded border border-border" />
                @endfor
            </div>
        </div>

        <div>
            <h1 class="text-2xl leading-tight lg:text-[1.75rem]">{{ $product->name }}</h1>
            <p class="mt-1.5 text-sm text-muted">{{ $product->spec }}</p>
            <div class="mt-5">
                <x-product-panel :product="$product" />
            </div>
        </div>
    </div>

    <div class="mt-10 grid gap-8 lg:grid-cols-[1fr_400px]">
        <div class="space-y-8">
            @if (count($product->specs))
                <section>
                    <h2 class="mb-3 text-xl">{{ __('site.product.specs') }}</h2>
                    <dl class="divide-y divide-border overflow-hidden rounded-md border border-border">
                        @foreach ($product->specs as $row)
                            <div class="flex justify-between gap-4 bg-surface px-4 py-2.5 text-sm">
                                <dt class="text-muted">{{ $row['label'] }}</dt>
                                <dd class="text-right font-medium tnum">{{ $row['value'] }}</dd>
                            </div>
                        @endforeach
                    </dl>
                </section>
            @endif

            @if ($product->description)
                <section>
                    <h2 class="mb-3 text-xl">{{ __('site.product.description') }}</h2>
                    <p class="leading-relaxed text-muted">{{ $product->description }}</p>
                </section>
            @endif
        </div>
    </div>

    {{-- Крос-продаж за таблицею сумісності стакан ↔ кришка --}}
    @if ($compatible->isNotEmpty())
        <section class="mt-12">
            <h2 class="mb-4 text-xl">
                {{ $product->shape === 'lid' ? __('site.product.compatibleCups') : __('site.product.compatibleLids') }}
            </h2>
            <div class="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-4">
                @foreach ($compatible as $item)
                    <x-product-card :product="$item" />
                @endforeach
            </div>
        </section>
    @endif

    @if ($related->isNotEmpty())
        <section class="mt-12">
            <h2 class="mb-4 text-xl">{{ __('site.product.related') }}</h2>
            <div class="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-4">
                @foreach ($related as $item)
                    <x-product-card :product="$item" />
                @endforeach
            </div>
        </section>
    @endif

    @if ($category)
        <p class="mt-10">
            <a href="{{ Url::to('/catalog/'.$category->slug.'/') }}" class="text-sm text-primary">← {{ $category->name }}</a>
        </p>
    @endif

    <x-json-ld :data="[
        '@context' => 'https://schema.org',
        '@type' => 'Product',
        'name' => $product->name,
        'sku' => $product->sku,
        'description' => $product->description,
        'brand' => ['@type' => 'Brand', 'name' => config('site.name')],
        'offers' => [
            '@type' => 'Offer',
            'url' => Url::canonical('/product/'.$product->slug.'/'),
            'priceCurrency' => 'UAH',
            'price' => number_format((float) $product->priceRetail, 2, '.', ''),
            'availability' => $product->inStock ? 'https://schema.org/InStock' : 'https://schema.org/PreOrder',
            'seller' => ['@id' => rtrim(config('site.url'), '/').'/#organization'],
        ],
    ]" />
</div>
@endsection
