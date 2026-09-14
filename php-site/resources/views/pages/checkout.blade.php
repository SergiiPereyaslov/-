@extends('layouts.site')

@php use App\Support\Url; @endphp

@section('title', __('site.checkout.title').' — '.config('site.name'))

@push('head')
    <meta name="robots" content="noindex, nofollow">
@endpush

@section('content')
<div class="container-page pb-12" x-data="cartView({{ Js::from(['tierHint' => __('site.cart.tierHint')]) }})">
    <x-breadcrumbs :items="[
        ['label' => __('site.nav.home'), 'href' => '/'],
        ['label' => __('site.cart.title'), 'href' => '/koshyk/'],
        ['label' => __('site.checkout.title')],
    ]" />

    <h1 class="text-3xl">{{ __('site.checkout.title') }}</h1>

    <div class="card mt-6 p-10 text-center" x-show="ready && lines.length === 0" x-cloak>
        <p class="font-display text-lg font-bold">{{ __('site.cart.empty') }}</p>
        <a href="{{ Url::to('/catalog/') }}" class="btn btn-primary mt-5">{{ __('site.cart.goToCatalog') }}</a>
    </div>

    <div class="mt-6 grid gap-8 lg:grid-cols-[1fr_340px] lg:items-start" x-show="ready && lines.length > 0" x-cloak>
        <form class="space-y-5"
              x-data="leadForm({{ Js::from([
                  'kind' => 'order',
                  'source' => 'checkout',
                  'locale' => app()->getLocale(),
                  'withCart' => true,
                  'redirectTo' => \App\Support\Url::to('/dyakuyemo/'),
                  'messages' => [
                      'sent' => __('site.forms.sent'),
                      'error' => __('site.forms.error'),
                      'phoneInvalid' => __('site.checkout.phoneInvalid'),
                  ],
              ]) }})"
              @submit.prevent="submit()">

            <div class="grid gap-3 sm:grid-cols-2">
                <label class="block">
                    <span class="mb-1 block text-sm font-medium">{{ __('site.checkout.name') }}</span>
                    <input type="text" class="field" x-model="form.name" autocomplete="name" maxlength="120">
                </label>
                <label class="block">
                    <span class="mb-1 block text-sm font-medium">{{ __('site.checkout.phone') }} *</span>
                    <input type="tel" class="field" x-model="form.phone" required
                           autocomplete="tel" placeholder="+380 50 123 45 67">
                </label>
                <label class="block">
                    <span class="mb-1 block text-sm font-medium">{{ __('site.checkout.email') }}</span>
                    <input type="email" class="field" x-model="form.email" autocomplete="email" maxlength="160">
                </label>
                <label class="block">
                    <span class="mb-1 block text-sm font-medium">{{ __('site.checkout.company') }}</span>
                    <input type="text" class="field" x-model="form.company" autocomplete="organization" maxlength="160">
                </label>
            </div>

            <fieldset>
                <legend class="mb-2 text-sm font-medium">{{ __('site.checkout.deliveryMethod') }}</legend>
                <div class="space-y-1.5">
                    @foreach (['pickup' => __('site.checkout.pickup'), 'city' => __('site.checkout.cityDelivery'), 'np' => __('site.checkout.novaPoshta')] as $value => $label)
                        <label class="flex cursor-pointer items-center gap-2.5 text-sm">
                            <input type="radio" name="delivery" value="{{ $value }}"
                                   class="h-4 w-4 accent-[var(--primary)]" x-model="form.delivery">
                            <span>{{ $label }}</span>
                        </label>
                    @endforeach
                </div>
            </fieldset>

            {{-- Поле відділення потрібне лише для Нової пошти --}}
            <label class="block" x-show="form.delivery === 'np'" x-cloak>
                <span class="mb-1 block text-sm font-medium">{{ __('site.checkout.city') }}</span>
                <input type="text" class="field" x-model="form.city" maxlength="160">
            </label>

            <fieldset>
                <legend class="mb-2 text-sm font-medium">{{ __('site.checkout.customerType') }}</legend>
                <div class="space-y-1.5">
                    @foreach (['individual' => __('site.checkout.individual'), 'company' => __('site.checkout.company_')] as $value => $label)
                        <label class="flex cursor-pointer items-center gap-2.5 text-sm">
                            <input type="radio" name="customer" value="{{ $value }}"
                                   class="h-4 w-4 accent-[var(--primary)]" x-model="form.customer">
                            <span>{{ $label }}</span>
                        </label>
                    @endforeach
                </div>
            </fieldset>

            {{-- Реквізити питаємо тільки в тих, кому потрібен рахунок --}}
            <label class="block" x-show="form.customer === 'company'" x-cloak>
                <span class="mb-1 block text-sm font-medium">{{ __('site.checkout.requisites') }}</span>
                <textarea class="field min-h-24" x-model="form.requisites" maxlength="4000"></textarea>
            </label>

            <label class="block">
                <span class="mb-1 block text-sm font-medium">{{ __('site.checkout.comment') }}</span>
                <textarea class="field min-h-24" x-model="form.comment" maxlength="4000"></textarea>
            </label>

            <button type="submit" class="btn btn-primary w-full" :disabled="sending">
                <span x-show="!sending">{{ __('site.checkout.submit') }}</span>
                <span x-show="sending" x-cloak>{{ __('site.checkout.submitting') }}</span>
            </button>

            <p class="text-sm text-danger" x-show="error" x-cloak x-text="error"></p>
            <p class="text-xs leading-snug text-muted">{{ __('site.checkout.agree') }}</p>
        </form>

        <aside class="card sticky top-32 p-5">
            <h2 class="font-display font-bold">{{ __('site.cart.title') }}</h2>
            <ul class="mt-3 space-y-2 text-sm">
                <template x-for="line in lines" :key="line.slug">
                    <li class="flex justify-between gap-3">
                        <span class="min-w-0">
                            <span class="block truncate" x-text="line.name"></span>
                            <span class="text-xs text-muted tnum" x-text="line.packs + ' {{ __('site.common.packs') }}'"></span>
                        </span>
                        <span class="shrink-0 tnum" x-text="line.sum.toFixed(2)"></span>
                    </li>
                </template>
            </ul>
            <div class="mt-4 flex items-baseline justify-between border-t border-border pt-3">
                <span class="font-medium">{{ __('site.cart.total') }}</span>
                <b class="font-display text-xl tnum" x-text="totalSum.toFixed(2) + ' {{ __('site.common.uah') }}'"></b>
            </div>
        </aside>
    </div>
</div>
@endsection
