@php
    use App\Support\Url;

    $locale = app()->getLocale();
    $gaId = config('site.ga_id');
@endphp
<!DOCTYPE html>
<html lang="{{ $locale }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <title>@yield('title', config('site.name'))</title>
    <meta name="description" content="@yield('description')">

    {{--
        Шлях без мовного префікса. Url::canonical() додає префікс сам, тож
        передавати йому адресу, у якій префікс уже є, означало б отримати
        /ru/ru/… — і кожна російська сторінка канонізувалась би на
        неіснуючу адресу.
    --}}
    @php $bare = $locale === 'ru' ? (substr(request()->getPathInfo(), 3) ?: '/') : request()->getPathInfo(); @endphp

    <link rel="canonical" href="@yield('canonical', Url::canonical($bare))">

    {{-- Обидві мови рівноправні для пошуку; x-default веде на українську --}}
    <link rel="alternate" hreflang="uk" href="{{ Url::canonical($bare, 'uk') }}">
    <link rel="alternate" hreflang="ru" href="{{ Url::canonical($bare, 'ru') }}">
    <link rel="alternate" hreflang="x-default" href="{{ Url::canonical($bare, 'uk') }}">

    {{--
        Картка для соцмереж і месенджерів. Посилання на сайт найчастіше
        кидають саме в них, тож без цих тегів у чаті замість картки
        з'являвся б голий URL.
    --}}
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="{{ config('site.name') }}">
    <meta property="og:locale" content="{{ $locale === 'ru' ? 'ru_RU' : 'uk_UA' }}">
    <meta property="og:title" content="@yield('title', config('site.name'))">
    <meta property="og:description" content="@yield('description')">
    <meta property="og:url" content="@yield('canonical', Url::canonical($bare))">
    <meta property="og:image" content="{{ rtrim(config('site.url'), '/') }}/images/og-{{ $locale }}.png">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta name="twitter:card" content="summary_large_image">

    <link rel="icon" href="/favicon.ico" sizes="any">

    @stack('head')

    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body class="flex min-h-screen flex-col">
    {{--
        Тема ставиться першим скриптом у body: він виконується до парсингу
        решти розмітки, тому спалаху світлої теми при темній немає.
        Той самий прийом і з тієї ж причини — для варіанта навігації:
        обидва варіанти є в розмітці, атрибут на <html> вирішує, який
        показати, і робить це до першого фарбування.
    --}}
    @include('partials.inline-scripts')

    <a href="#main"
       class="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded focus:bg-primary focus:px-4 focus:py-2 focus:text-on-primary">
        {{ __('site.a11y.skipToContent') }}
    </a>

    @include('partials.header')

    <main id="main" class="flex-1">
        @yield('content')
    </main>

    @include('partials.footer')
    @include('partials.floating-contacts')

    <x-json-ld :data="$organizationLd ?? \App\Support\Schema::organization()" />

    @if ($gaId)
        @include('partials.analytics', ['gaId' => $gaId])
    @endif
</body>
</html>
