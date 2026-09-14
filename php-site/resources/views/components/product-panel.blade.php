@props(['product'])

@php
    $tiers = array_map(fn (array $t): array => [
        'minPacks' => (int) $t['minPacks'],
        'perUnit' => (float) $t['perUnit'],
    ], $product->tiers ?? []);

    // Найкращий щабель — останній: саме він показує стелю вигоди
    $bestTier = $tiers ? end($tiers) : null;
    $maxDiscount = $bestTier && (float) $product->priceRetail > 0
        ? (int) round((1 - $bestTier['perUnit'] / (float) $product->priceRetail) * 100)
        : 0;
@endphp

<div class="card p-5"
     x-data="productPanel({{ Js::from([
         'slug' => $product->slug,
         'unitsPerPack' => $product->unitsPerPack,
         'priceRetail' => (float) $product->priceRetail,
         'tiers' => $tiers,
         // Формулювання лишається у словнику, а не дублюється в JS
         'totalForTemplate' => __('site.product.totalFor'),
     ]) }})">

    <div class="flex items-center gap-3 text-sm">
        <span class="text-muted tnum">{{ __('site.common.sku') }} {{ $product->sku }}</span>
        <span class="{{ $product->inStock ? 'text-primary' : 'text-muted' }}">
            {{ $product->inStock ? '✔ '.__('site.common.inStock') : __('site.common.outOfStock') }}
        </span>
    </div>

    <div class="mt-4 space-y-2 border-y border-border py-4">
        <div class="flex items-baseline justify-between gap-3">
            <span class="text-sm text-muted">{{ __('site.product.retail') }}</span>
            <span class="tnum">
                <b class="font-display text-lg">{{ number_format((float) $product->priceRetail, 2, '.', '') }}</b>
                <span class="text-sm text-muted">{{ __('site.common.uah') }}/{{ __('site.common.pcs') }}</span>
            </span>
        </div>

        @foreach ($tiers as $tier)
            <div class="flex items-baseline justify-between gap-3">
                <span class="text-sm text-muted">
                    {{ __('site.product.wholesale') }}
                    {{ str_replace('{n}', (string) $tier['minPacks'], __('site.product.wholesaleFrom')) }}
                </span>
                <span class="tnum">
                    <b class="font-display text-lg text-primary">{{ number_format($tier['perUnit'], 2, '.', '') }}</b>
                    <span class="text-sm text-muted">{{ __('site.common.uah') }}/{{ __('site.common.pcs') }}</span>
                </span>
            </div>
        @endforeach

        @if ($maxDiscount > 0)
            <p class="pt-1 text-xs text-accent">
                {{ str_replace('{n}', (string) $maxDiscount, __('site.product.youSave')) }}
            </p>
        @endif
    </div>

    <div class="mt-4">
        <label class="mb-2 block text-sm font-medium">{{ __('site.product.quantity') }}</label>
        <div class="flex items-center gap-3">
            <x-qty-stepper />
            <span class="text-sm text-muted tnum">= <span x-text="packs * {{ $product->unitsPerPack }}"></span> {{ __('site.common.pcs') }}</span>
        </div>

        <p class="mt-3 flex items-baseline justify-between gap-3 rounded-md bg-kraft px-3 py-2.5">
            <span class="text-sm" x-text="totalLabel"></span>
            <b class="font-display text-xl tnum" x-text="total.toFixed(2) + ' {{ __('site.common.uah') }}'"></b>
        </p>

        <button type="button" class="btn btn-primary mt-3 w-full" @click="addToCart()">
            <span x-show="!inCart">{{ __('site.common.addToCart') }}</span>
            <span x-show="inCart" x-cloak>{{ __('site.common.inCart') }}</span>
        </button>

        <a href="{{ config('site.telegram') }}" class="btn btn-secondary mt-2 w-full"
           target="_blank" rel="noopener noreferrer">
            {{ __('site.product.writeTelegram') }}
        </a>
    </div>

    <ul class="mt-4 space-y-1.5 text-sm text-muted">
        <li>🚚 {{ __('site.product.deliveryNote') }}</li>
        @if ($product->brandable)
            <li>🏷 {{ str_replace('{n}', (string) config('site.branding_min_units'), __('site.product.brandable')) }}</li>
        @endif
    </ul>
</div>
