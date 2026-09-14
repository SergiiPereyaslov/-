@extends('layouts.site')

@php use App\Support\Url; @endphp

@section('title', __('site.thanks.title').' — '.config('site.name'))

@push('head')
    <meta name="robots" content="noindex, nofollow">
@endpush

@section('content')
<div class="container-page py-16">
    <div class="card mx-auto max-w-lg p-10 text-center">
        <h1 class="font-display text-2xl">{{ __('site.thanks.title') }}</h1>

        @if ($number)
            <p class="mt-3 text-sm text-muted">
                {{ __('site.thanks.orderNumber') }}:
                <b class="font-display text-base text-ink tnum">{{ $number }}</b>
            </p>
        @endif

        <p class="mt-4 leading-relaxed text-muted">{{ __('site.thanks.body') }}</p>

        <a href="{{ Url::to('/catalog/') }}" class="btn btn-primary mt-6">{{ __('site.cart.goToCatalog') }}</a>
    </div>
</div>
@endsection
