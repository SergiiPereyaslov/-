@props(['source' => 'page', 'kind' => 'quote'])

{{--
    Коротка форма запиту прайсу.

    Одне обов'язкове поле — телефон. Кожне зайве поле в такій формі
    відсікає частину звернень, а решту менеджер з'ясує в розмові.
--}}
<div class="card p-5" x-data="leadForm({{ Js::from([
    'kind' => $kind,
    'source' => $source,
    'locale' => app()->getLocale(),
    'messages' => [
        'sent' => __('site.forms.sent'),
        'error' => __('site.forms.error'),
        'phoneInvalid' => __('site.checkout.phoneInvalid'),
    ],
]) }})">
    <h2 class="font-display text-lg font-bold">{{ __('site.forms.quoteTitle') }}</h2>
    <p class="mt-1 text-sm text-muted">{{ __('site.forms.quoteBody') }}</p>

    <form class="mt-4 space-y-3" @submit.prevent="submit()" x-show="!done">
        <div>
            <label class="sr-only" :for="$id('phone')">{{ __('site.checkout.phone') }}</label>
            <input type="tel" class="field" required inputmode="tel"
                   :id="$id('phone')" x-model="form.phone"
                   placeholder="+380 50 123 45 67" autocomplete="tel">
        </div>
        <div>
            <label class="sr-only" :for="$id('name')">{{ __('site.checkout.name') }}</label>
            <input type="text" class="field" :id="$id('name')" x-model="form.name"
                   placeholder="{{ __('site.checkout.name') }}" autocomplete="name" maxlength="120">
        </div>

        <button type="submit" class="btn btn-primary w-full" :disabled="sending">
            <span x-show="!sending">{{ __('site.forms.quoteTitle') }}</span>
            <span x-show="sending" x-cloak>{{ __('site.checkout.submitting') }}</span>
        </button>

        <p class="text-xs text-danger" x-show="error" x-cloak x-text="error"></p>
        <p class="text-xs leading-snug text-muted">{{ __('site.checkout.agree') }}</p>
    </form>

    <p class="mt-4 rounded-md bg-accent-soft px-3 py-3 text-sm font-medium text-accent"
       x-show="done" x-cloak>
        {{ __('site.forms.sent') }} <span x-text="number"></span>
    </p>
</div>
