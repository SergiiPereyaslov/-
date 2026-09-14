@props(['class' => '', 'title' => 'SmartEcoPack'])

{{--
    Знак бренду: контур пакета з написом у три рядки.

    Наближення до чинного логотипа, зроблене по скріншоту. Коли надійде
    векторний оригінал, цей файл замінюється на нього — решта верстки
    не змінюється.
--}}
<svg viewBox="0 0 72 72" class="{{ $class }}" role="img" aria-label="{{ $title }}">
    {{-- ручка пакета --}}
    <path d="M28 16c0-4.4 3.6-8 8-8s8 3.6 8 8"
          fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
    {{-- корпус --}}
    <rect x="8" y="16" width="56" height="48" rx="6" fill="none" stroke="currentColor" stroke-width="3" />
    <text x="36" y="34" text-anchor="middle" fill="currentColor"
          font-size="11" font-family="Bitter, system-ui, sans-serif" font-weight="600">smart</text>
    <text x="36" y="47" text-anchor="middle" fill="currentColor"
          font-size="13" font-family="Bitter, system-ui, sans-serif" font-weight="700">eco</text>
    <text x="36" y="59" text-anchor="middle" fill="currentColor"
          font-size="11" font-family="Bitter, system-ui, sans-serif" font-weight="600">pack</text>
</svg>
