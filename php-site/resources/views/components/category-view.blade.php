@props(['products', 'category', 'lockedFacet' => null])

@php
    use App\Support\Schema;
    use App\Support\Url;

    /*
     * Фільтри працюють у браузері, а не запитом на сервер.
     *
     * У категорії рідко буває більше двох десятків позицій, і всі вони й
     * так у розмітці — заради відсіювання чотирьох товарів немає сенсу
     * ходити по мережі. Заразом уся категорія лишається в HTML, тобто
     * видимою для пошуку, а не підвантажується скриптом.
     *
     * Фасет, зафіксований адресою посадкової сторінки, з фільтрів
     * прибирається: він там уже застосований.
     */
    $visibleFacets = array_values(array_filter(
        $category->facets ?? [],
        fn (array $f): bool => $f['key'] !== ($lockedFacet['facet'] ?? null),
    ));

    // Скільки товарів під кожним значенням — рахуємо тут, щоб у розмітці
    // не було порожніх варіантів, які нічого не знаходять
    $counts = [];
    foreach ($visibleFacets as $facet) {
        foreach ($products as $product) {
            $value = $product->facets[$facet['key']] ?? null;
            if ($value !== null) {
                $counts[$facet['key']][$value] = ($counts[$facet['key']][$value] ?? 0) + 1;
            }
        }
    }

    $locale = app()->getLocale();
    $pick = fn (?array $pair): string => $pair[$locale] ?? $pair['uk'] ?? '';

    // Перший фасет із власними посадковими — для швидких посилань унизу
    $indexedFacet = null;
    foreach ($visibleFacets as $facet) {
        if (($facet['indexed'] ?? false) === true) {
            $indexedFacet = $facet;
            break;
        }
    }
@endphp

<div class="mt-6 lg:flex lg:gap-8" x-data="categoryView({{ $products->count() }})">

    {{-- Панель фільтрів: збоку на великому екрані, у шторці на малому --}}
    @php
        $filterPanel = view('components.partials.facet-filters', [
            'facets' => $visibleFacets,
            'counts' => $counts,
            'pick' => $pick,
        ]);
    @endphp

    <aside class="hidden w-60 shrink-0 lg:block">
        <div class="sticky top-32">
            <div class="mb-3 flex items-center justify-between">
                <h2 class="text-sm font-bold uppercase tracking-wide">{{ __('site.common.filters') }}</h2>
                <button type="button" class="text-xs text-primary" x-show="activeCount > 0" x-cloak @click="reset()">
                    {{ __('site.common.reset') }}
                </button>
            </div>
            {!! $filterPanel !!}
        </div>
    </aside>

    <div class="min-w-0 flex-1">
        <div class="flex flex-wrap items-center gap-3">
            <button type="button" class="btn btn-secondary !min-h-9 lg:hidden" @click="sheetOpen = true">
                {{ __('site.common.filters') }}
                <span x-show="activeCount > 0" x-cloak x-text="'(' + activeCount + ')'"></span>
            </button>

            <span class="text-sm text-muted tnum">
                <span x-text="visibleCount"></span> {{ __('site.common.products') }}
            </span>

            <label class="ml-auto flex items-center gap-2 text-sm">
                <span class="sr-only">{{ __('site.common.sort') }}</span>
                <select class="field !min-h-9 !w-auto !py-1.5 text-sm" x-model="sort" @change="apply()">
                    @foreach (['popular', 'price-asc', 'price-desc', 'name'] as $key)
                        <option value="{{ $key }}">{{ __('site.sort.'.$key) }}</option>
                    @endforeach
                </select>
            </label>
        </div>

        {{-- Обрані фільтри окремими чипами: видно, що саме звузило видачу --}}
        <div class="mt-3 flex flex-wrap gap-2" x-show="activeCount > 0" x-cloak>
            <template x-for="chip in chips" :key="chip.key + '-' + chip.value">
                <button type="button" class="chip hover:border-primary" @click="toggle(chip.key, chip.value)">
                    <span x-text="chip.label"></span>
                    <span aria-hidden="true">✕</span>
                </button>
            </template>
            <button type="button" class="chip text-primary" @click="reset()">{{ __('site.common.resetAll') }}</button>
        </div>

        <div class="mt-10 rounded-md border border-border bg-surface p-8 text-center" x-show="visibleCount === 0" x-cloak>
            <p class="font-semibold">{{ __('site.catalog.nothingFound') }}</p>
            <p class="mt-1 text-sm text-muted">{{ __('site.catalog.nothingFoundHint') }}</p>
            <button type="button" class="btn btn-secondary mt-4" @click="reset()">{{ __('site.common.resetAll') }}</button>
        </div>

        <div class="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-4" x-ref="grid">
            @foreach ($products as $product)
                <x-product-card :product="$product"
                                data-product="1"
                                data-facets="{{ json_encode($product->facets ?? [], JSON_UNESCAPED_UNICODE) }}"
                                data-price="{{ $product->priceRetail }}"
                                data-name="{{ $product->name }}"
                                data-featured="{{ $product->featured ? 1 : 0 }}" />
            @endforeach
        </div>

        <div class="mt-6 text-center" x-show="hasMore" x-cloak>
            <button type="button" class="btn btn-secondary" @click="showMore()">{{ __('site.common.showMore') }}</button>
        </div>

        {{-- Швидкі посилання на індексовані посадкові — і навігація, і перелінковка --}}
        @if ($indexedFacet && ! $lockedFacet)
            <nav class="mt-8 border-t border-border pt-5">
                <h2 class="mb-2 text-sm font-bold">{{ __('site.catalog.popularSizes') }}</h2>
                <div class="flex flex-wrap gap-2">
                    @foreach ($indexedFacet['values'] as $value)
                        @if (($counts[$indexedFacet['key']][$value['value']] ?? 0) > 0)
                            <a href="{{ Url::to('/catalog/'.$category->slug.'/'.$value['slug'].'/') }}"
                               class="chip hover:border-primary hover:text-primary">{{ $pick($value['label']) }}</a>
                        @endif
                    @endforeach
                </div>
            </nav>
        @endif
    </div>

    {{-- Мобільна шторка фільтрів --}}
    <div x-show="sheetOpen" x-cloak class="fixed inset-0 z-[60] lg:hidden">
        <div class="absolute inset-0 bg-black/40" @click="sheetOpen = false"></div>
        <div class="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-lg bg-surface p-4">
            <div class="mb-4 flex items-center justify-between">
                <h2 class="font-bold">{{ __('site.common.filters') }}</h2>
                <button type="button" class="btn btn-ghost !min-h-9 !px-3" @click="sheetOpen = false">
                    {{ __('site.header.close') }}
                </button>
            </div>
            {!! $filterPanel !!}
            <div class="mt-5 flex gap-2">
                <button type="button" class="btn btn-secondary flex-1" @click="reset()">{{ __('site.common.reset') }}</button>
                <button type="button" class="btn btn-primary flex-[2]" @click="sheetOpen = false">
                    {{ __('site.common.apply') }} (<span x-text="visibleCount"></span>)
                </button>
            </div>
        </div>
    </div>
</div>

{{-- Список товарів категорії — форма «сторінка-зведення» для пошуку --}}
<x-json-ld :data="[
    '@context' => 'https://schema.org',
    '@type' => 'ItemList',
    'name' => $category->h1,
    'numberOfItems' => $products->count(),
    'itemListElement' => $products->values()->map(fn ($p, $i) => [
        '@type' => 'ListItem',
        'position' => $i + 1,
        'url' => Url::canonical('/product/'.$p->slug.'/'),
    ])->all(),
]" />
