@php use App\Support\Url; @endphp

<a href="{{ Url::to('/catalog/'.$category->slug.'/') }}"
   class="card group flex items-center gap-3 p-3 transition hover:border-primary/50">
    <x-placeholder :shape="$shape" class="{{ $size }} shrink-0 rounded" />
    <div class="min-w-0">
        <h3 class="text-sm font-semibold leading-snug group-hover:text-primary">{{ $category->name }}</h3>
        <p class="mt-0.5 text-xs text-muted tnum">
            {{ $stats['count'] }} {{ __('site.common.products') }}
            @if ($stats['min'] > 0)
                · {{ __('site.common.from') }} {{ number_format($stats['min'], 2, '.', '') }} {{ __('site.common.uah') }}
            @endif
        </p>
    </div>
</a>
