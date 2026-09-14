@php
    use App\Support\Format;
    use App\Support\Url;

    $locale = app()->getLocale();
@endphp

<footer class="mt-16 band-deep">
    <div class="container-page grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div class="sm:col-span-2 lg:col-span-4">
            <x-logo class="h-14 w-14" />
        </div>

        <div>
            <h2 class="mb-3 text-sm font-bold uppercase tracking-wide">{{ __('site.footer.catalogTitle') }}</h2>
            <ul class="space-y-2 text-sm opacity-85">
                @foreach ($navGroups as $group)
                    <li><a href="{{ Url::to('/catalog/'.$group['slug'].'/') }}" class="hover:opacity-70">{{ $group['name'] }}</a></li>
                @endforeach
            </ul>
        </div>

        {{-- Другий вхід у каталог — за типом закладу. У шапці його немає навмисно. --}}
        <div class="ab-b">
            <h2 class="mb-3 text-sm font-bold uppercase tracking-wide">Для кого</h2>
            <ul class="space-y-2 text-sm opacity-85">
                @foreach (config('sectors') as $sector)
                    <li>
                        <a href="{{ Url::to('/dlya/'.$sector['slug'].'/') }}" class="hover:opacity-70">
                            {{ $sector['forWhom'][$locale] }}
                        </a>
                    </li>
                @endforeach
            </ul>
        </div>

        <div>
            <h2 class="mb-3 text-sm font-bold uppercase tracking-wide">{{ __('site.footer.companyTitle') }}</h2>
            <ul class="space-y-2 text-sm opacity-85">
                <li><a href="{{ Url::to('/pro-nas/') }}" class="hover:opacity-70">{{ __('site.nav.about') }}</a></li>
                <li><a href="{{ Url::to('/blog/') }}" class="hover:opacity-70">{{ __('site.nav.blog') }}</a></li>
                <li><a href="{{ Url::to('/kontakty/') }}" class="hover:opacity-70">{{ __('site.nav.contacts') }}</a></li>
            </ul>

            <h2 class="mb-3 mt-6 text-sm font-bold uppercase tracking-wide">Доставка</h2>
            <ul class="space-y-2 text-sm opacity-85">
                @foreach (config('cities') as $city)
                    <li>
                        <a href="{{ Url::to('/upakovka/'.$city['slug'].'/') }}" class="hover:opacity-70">
                            {{ $city['name'][$locale] }}
                        </a>
                    </li>
                @endforeach
            </ul>
        </div>

        <div>
            <h2 class="mb-3 text-sm font-bold uppercase tracking-wide">{{ __('site.footer.customersTitle') }}</h2>
            <ul class="space-y-2 text-sm opacity-85">
                <li><a href="{{ Url::to('/dostavka-i-oplata/') }}" class="hover:opacity-70">{{ __('site.nav.delivery') }}</a></li>
                <li><a href="{{ Url::to('/brenduvannya/') }}" class="hover:opacity-70">{{ __('site.nav.branding') }}</a></li>
                <li><a href="{{ Url::to('/polityka-konfidentsiynosti/') }}" class="hover:opacity-70">{{ __('site.footer.privacy') }}</a></li>
                <li><a href="{{ Url::to('/publichna-oferta/') }}" class="hover:opacity-70">{{ __('site.footer.offer') }}</a></li>
            </ul>
        </div>

        <div>
            <h2 class="mb-3 text-sm font-bold uppercase tracking-wide">{{ __('site.footer.contactsTitle') }}</h2>
            <ul class="space-y-2 text-sm opacity-85">
                @foreach (config('site.phones') as $phone)
                    <li><a href="tel:{{ $phone }}" class="font-semibold hover:opacity-70 tnum">{{ Format::phone($phone) }}</a></li>
                @endforeach
                <li><a href="mailto:{{ config('site.email') }}" class="hover:opacity-70">{{ config('site.email') }}</a></li>
                <li class="pt-1">{{ config('site.address.city.'.$locale) }}, {{ config('site.address.street.'.$locale) }}</li>
                <li>{{ config('site.hours.'.$locale) }}</li>
            </ul>
        </div>
    </div>

    <div class="border-t border-white/15">
        <div class="container-page flex flex-col gap-2 py-4 text-xs opacity-75 sm:flex-row sm:items-center sm:justify-between">
            <span>© {{ date('Y') }} {{ config('site.legal_name') }} · ЄДРПОУ {{ config('site.edrpou') }}</span>
            <span>{{ __('site.footer.rights') }}</span>
        </div>
    </div>
</footer>
