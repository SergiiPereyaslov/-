@props(['product'])

@php
    use App\Support\Url;

    /*
     * Ціна перераховується на льоту, коли відвідувач міняє кількість пачок:
     * оптовий щабель має бути видно ще до переходу в кошик, інакше вигода
     * від опту лишається невидимою саме там, де приймається рішення.
     *
     * Щаблі віддаються в Alpine, а не рахуються запитом на кожне натискання.
     */
    $tiers = array_map(fn (array $t): array => [
        'minPacks' => (int) $t['minPacks'],
        'perUnit' => (float) $t['perUnit'],
    ], $product->tiers ?? []);

    // Перший щабель — найближчий до клієнта; показуємо саме його, а не
    // максимальну знижку: вона однакова в усіх товарів і нічого не каже.
    $firstTier = $tiers[0] ?? null;

    $href = Url::to('/product/'.$product->slug.'/');
@endphp

<article {{ $attributes->merge(['class' => 'card group flex flex-col overflow-hidden transition hover:border-primary/40']) }}
         x-data="productCard({{ Js::from([
             'slug' => $product->slug,
             'unitsPerPack' => $product->unitsPerPack,
             'priceRetail' => (float) $product->priceRetail,
             'tiers' => $tiers,
         ]) }})">

    <a href="{{ $href }}" class="relative block aspect-square">
        <x-placeholder :shape="$product->shape ?? 'box'" class="h-full w-full" />
        @if ($product->brandable)
            <span class="absolute right-2 top-2 rounded-full border border-border bg-surface px-2 py-0.5 text-[11px] font-medium">
                ⌗ logo
            </span>
        @endif
    </a>

    <div class="flex flex-1 flex-col p-3">
        <a href="{{ $href }}" class="hover:text-primary">
            <h3 class="line-clamp-2 text-[15px] font-semibold leading-snug">{{ $product->name }}</h3>
        </a>

        <p class="mt-1 text-xs text-muted tnum">
            {{ $product->unitsPerPack }} {{ __('site.common.pcs') }} / {{ __('site.common.inPack') }}
        </p>

        <div class="mt-3 flex items-baseline gap-2">
            <span class="font-display text-xl font-bold tnum" x-text="packPrice.toFixed(2) + ' {{ __('site.common.uah') }}'"></span>
            <span class="text-xs text-muted tnum" x-text="unitPrice.toFixed(2) + ' / {{ __('site.common.pcs') }}'"></span>
        </div>

        @if ($firstTier)
            <p class="mt-1 text-xs font-medium text-accent tnum">
                {{ __('site.product.wholesale') }}
                {{ str_replace('{n}', (string) $firstTier['minPacks'], __('site.product.wholesaleFrom')) }}
                — {{ number_format($firstTier['perUnit'], 2, '.', '') }}
                {{ __('site.common.uah') }}/{{ __('site.common.pcs') }}
            </p>
        @endif

        <div class="mt-3 flex items-center gap-2 pt-1">
            <x-qty-stepper :compact="true" />
            <button type="button" class="btn btn-primary !min-h-9 flex-1 !px-2 !text-[13px]" @click="addToCart()">
                <span x-show="!inCart">{{ __('site.common.addToCart') }}</span>
                <span x-show="inCart" x-cloak>{{ __('site.common.inCart') }}</span>
            </button>
        </div>
    </div>
</article>
