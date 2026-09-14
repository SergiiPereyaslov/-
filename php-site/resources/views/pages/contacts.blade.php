@extends('layouts.site')
@php use App\Support\Format; @endphp

@section('title', __('pages.contacts.meta.title'))
@section('description', __('pages.contacts.meta.description'))

@section('content')
<div class="container-page pb-12">
    <x-breadcrumbs :items="[
        ['label' => __('site.nav.home'), 'href' => '/'],
        ['label' => __('site.nav.contacts')],
    ]" />

    <h1 class="text-3xl">{{ __('site.nav.contacts') }}</h1>

    <div class="mt-8 grid gap-8 lg:grid-cols-[1fr_380px] lg:items-start">
        <div class="space-y-6">
            <dl class="card divide-y divide-border">
                @foreach ([
                    ['Телефони', collect(config('site.phones'))->map(fn ($p) => Format::phone($p))->implode(' · ')],
                    ['E-mail', config('site.email')],
                    ['Адреса', config('site.address.city.'.app()->getLocale()).', '.config('site.address.street.'.app()->getLocale())],
                    ['Графік', config('site.hours.'.app()->getLocale())],
                    ['Компанія', config('site.legal_name').' · ЄДРПОУ '.config('site.edrpou')],
                ] as [$label, $value])
                    <div class="flex flex-wrap justify-between gap-3 px-4 py-3">
                        <dt class="text-sm text-muted">{{ $label }}</dt>
                        <dd class="text-right font-medium">{{ $value }}</dd>
                    </div>
                @endforeach
            </dl>

            <div class="flex flex-wrap gap-3">
                <a href="tel:{{ config('site.phones')[0] }}" class="btn btn-primary">{{ Format::phone(config('site.phones')[0]) }}</a>
                <a href="{{ config('site.telegram') }}" class="btn btn-secondary" target="_blank" rel="noopener noreferrer">Telegram</a>
                <a href="mailto:{{ config('site.email') }}" class="btn btn-secondary">{{ config('site.email') }}</a>
            </div>
        </div>

        <x-quote-form source="contacts" />
    </div>

    <x-json-ld :data="$localBusiness" />
</div>
@endsection
