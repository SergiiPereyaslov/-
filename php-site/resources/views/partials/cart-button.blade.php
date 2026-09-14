@php use App\Support\Url; @endphp

{{--
    Кошик у шапці. Лічильник бере значення зі стану кошика в localStorage,
    тому число з'являється лише після гідратації — інакше воно різнилося б
    між закешованою сторінкою і тим, що насправді в кошику відвідувача.
--}}
<a href="{{ Url::to('/koshyk/') }}" class="btn btn-ghost !min-h-10 !px-2.5"
   aria-label="{{ __('site.header.cart') }}" x-data x-cloak>
    <span class="relative">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6" />
            <circle cx="10" cy="20" r="1.4" />
            <circle cx="18" cy="20" r="1.4" />
        </svg>
        <span x-show="$store.cart.totalPacks > 0"
              x-text="$store.cart.totalPacks"
              class="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-on-primary tnum"></span>
    </span>
</a>
