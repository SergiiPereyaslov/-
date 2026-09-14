@props(['items', 'class' => 'py-3'])

@php
    use App\Support\Schema;
    use App\Support\Url;
@endphp

{{-- Хлібні крихти + розмітка BreadcrumbList одним компонентом --}}
<nav aria-label="{{ __('site.a11y.breadcrumb') }}" class="{{ $class }}">
    <ol class="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[13px] text-muted">
        @foreach ($items as $i => $crumb)
            <li class="flex items-center gap-1.5">
                @if (isset($crumb['href']))
                    <a href="{{ Url::to($crumb['href']) }}" class="hover:text-primary">{{ $crumb['label'] }}</a>
                @else
                    <span class="text-ink">{{ $crumb['label'] }}</span>
                @endif
                @if ($i < count($items) - 1)
                    <span aria-hidden="true">/</span>
                @endif
            </li>
        @endforeach
    </ol>
</nav>

<x-json-ld :data="Schema::breadcrumbs($items)" />
