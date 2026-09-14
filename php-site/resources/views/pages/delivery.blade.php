@extends('layouts.site')

@section('title', __('pages.delivery.meta.title'))
@section('description', __('pages.delivery.meta.description'))

@section('content')
<div class="container-page pb-12">
    <x-breadcrumbs :items="[
        ['label' => __('site.nav.home'), 'href' => '/'],
        ['label' => __('site.nav.delivery')],
    ]" />

    <h1 class="text-3xl">{{ $t['h1'] }}</h1>
    <p class="mt-3 max-w-3xl text-lg leading-relaxed text-muted">{{ $t['lead'] }}</p>

    <div class="mt-10 max-w-3xl space-y-10">
        @foreach ([['deliveryTitle', 'delivery'], ['paymentTitle', 'payment'], ['orderTitle', 'order']] as [$titleKey, $listKey])
            <section>
                <h2 class="text-2xl">{{ $t[$titleKey] }}</h2>
                <ul class="mt-4 space-y-3">
                    @foreach ($t[$listKey] as $row)
                        <li class="card p-4">
                            @if (is_array($row))
                                <h3 class="font-display font-bold">{{ $row[0] }}</h3>
                                <p class="mt-1 text-sm leading-snug text-muted">{{ $row[1] }}</p>
                            @else
                                <p class="text-sm leading-snug text-muted">{{ $row }}</p>
                            @endif
                        </li>
                    @endforeach
                </ul>
            </section>
        @endforeach

        <x-faq :items="$faq" :title="$t['faqTitle']" />
    </div>
</div>
@endsection
