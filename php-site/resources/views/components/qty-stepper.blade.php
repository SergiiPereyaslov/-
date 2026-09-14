@props(['compact' => false])

{{--
    Крок кількості пачок.

    Мінімум — одна пачка: поштучно товар не продається, і кнопка «мінус»
    на одиниці вимикається, а не обнуляє позицію.
--}}
<div class="flex items-center rounded-md border border-border {{ $compact ? '' : 'h-11' }}">
    <button type="button" class="{{ $compact ? 'h-9 w-8' : 'h-11 w-11' }} text-lg leading-none disabled:opacity-40"
            aria-label="{{ __('site.a11y.decrease') }}"
            :disabled="packs <= 1" @click="packs = Math.max(1, packs - 1)">−</button>
    <input type="text" inputmode="numeric"
           class="{{ $compact ? 'w-8' : 'w-12' }} border-x border-border bg-transparent py-1 text-center text-sm tnum"
           x-model.number="packs" @change="packs = Math.max(1, Math.min(1000, parseInt(packs) || 1))">
    <button type="button" class="{{ $compact ? 'h-9 w-8' : 'h-11 w-11' }} text-lg leading-none"
            aria-label="{{ __('site.a11y.increase') }}"
            @click="packs = Math.min(1000, packs + 1)">+</button>
</div>
