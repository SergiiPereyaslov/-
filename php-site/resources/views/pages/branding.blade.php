@extends('layouts.site')
@php use App\Support\Url; @endphp

@section('title', __('pages.branding.meta.title'))
@section('description', __('pages.branding.meta.description'))

@section('content')
<div class="container-page pb-12">
    <x-breadcrumbs :items="[
        ['label' => __('site.nav.home'), 'href' => '/'],
        ['label' => __('site.nav.branding')],
    ]" />

    <h1 class="text-3xl">{{ $t['h1'] }}</h1>
    <p class="mt-3 max-w-3xl text-lg leading-relaxed text-muted">{{ $t['lead'] }}</p>

    <div class="mt-10 grid gap-8 lg:grid-cols-[1fr_380px] lg:items-start">
        <div class="space-y-10">
            <section>
                <h2 class="text-2xl">{{ $t['whyTitle'] }}</h2>
                <ul class="mt-4 grid gap-3 sm:grid-cols-2">
                    @foreach ($t['why'] as [$title, $body])
                        <li class="card p-4">
                            <h3 class="font-display font-bold">{{ $title }}</h3>
                            <p class="mt-1 text-sm leading-snug text-muted">{{ $body }}</p>
                        </li>
                    @endforeach
                </ul>
            </section>

            <section>
                <h2 class="text-2xl">{{ $t['stepsTitle'] }}</h2>
                <ol class="mt-4 space-y-3">
                    @foreach ($t['steps'] as $i => [$title, $body])
                        <li class="flex gap-4">
                            <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary font-display text-sm font-bold text-on-primary tnum">{{ $i + 1 }}</span>
                            <div>
                                <h3 class="font-display font-bold">{{ $title }}</h3>
                                <p class="mt-0.5 text-sm leading-snug text-muted">{{ $body }}</p>
                            </div>
                        </li>
                    @endforeach
                </ol>
            </section>

            <section>
                <h2 class="text-2xl">{{ $t['reqTitle'] }}</h2>
                <ul class="mt-4 space-y-1.5 text-sm text-muted">
                    @foreach ($t['req'] as $line)
                        <li class="flex gap-2"><span class="text-primary">·</span><span>{{ $line }}</span></li>
                    @endforeach
                </ul>
            </section>

            {{--
                Окремі сторінки під друк на стаканах і на пакетах, а не
                якорі: у пошуку це різні запити з різною конкуренцією.
            --}}
            <section>
                <h2 class="text-2xl">{{ $t['whatTitle'] }}</h2>
                <div class="mt-4 grid gap-3 sm:grid-cols-2">
                    @foreach (__('pages.brandingPages.pages') as $slug => $page)
                        <a href="{{ Url::to('/brenduvannya/'.$slug.'/') }}"
                           class="card p-4 transition hover:border-primary/50">
                            <h3 class="font-display font-bold">{{ $page['h1'] }}</h3>
                            <p class="mt-1 line-clamp-2 text-sm text-muted">{{ $page['description'] }}</p>
                        </a>
                    @endforeach
                </div>
            </section>

            <div class="max-w-3xl">
                <x-faq :items="$faq" :title="$t['faqTitle']" />
            </div>
        </div>

        <x-quote-form source="branding" kind="branding" />
    </div>
</div>
@endsection
