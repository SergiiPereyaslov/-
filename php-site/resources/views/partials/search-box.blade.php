@php use App\Support\Url; @endphp

{{--
    Пошук по каталогу.

    Аудиторія шукає за конкретним розміром («стакан 340») або артикулом,
    тому підказки показуються одразу під полем, а не на окремій сторінці.
--}}
<div class="relative" x-data="searchBox('{{ app()->getLocale() }}')" @click.outside="open = false">
    <label for="{{ $id }}" class="sr-only">{{ __('site.header.searchLabel') }}</label>
    <input id="{{ $id }}" type="search" autocomplete="off"
           class="field" placeholder="{{ __('site.header.searchPlaceholder') }}"
           x-model="query" @input="onInput()" @focus="hits.length && (open = true)">

    <div x-show="open && hits.length" x-cloak
         class="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-md border border-border bg-surface shadow-lg">
        <ul>
            <template x-for="hit in hits" :key="hit.slug">
                <li>
                    <a :href="'{{ Url::to('/product/') }}' + hit.slug + '/'"
                       class="flex items-center justify-between gap-3 px-3 py-2.5 hover:bg-kraft">
                        <span class="min-w-0">
                            <span class="block truncate text-sm" x-text="hit.name"></span>
                            <span class="block truncate text-xs text-muted" x-text="hit.spec"></span>
                        </span>
                        <span class="shrink-0 text-sm font-semibold tnum" x-text="hit.price + ' грн'"></span>
                    </a>
                </li>
            </template>
        </ul>
    </div>
</div>
