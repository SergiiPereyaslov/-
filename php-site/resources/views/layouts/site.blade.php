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

    <link rel="canonical" href="@yield('canonical', Url::canonical(request()->getPathInfo()))">

    {{-- Обидві мови рівноправні для пошуку; x-default веде на українську --}}
    @php $bare = $locale === 'ru' ? (substr(request()->getPathInfo(), 3) ?: '/') : request()->getPathInfo(); @endphp
    <link rel="alternate" hreflang="uk" href="{{ Url::canonical($bare, 'uk') }}">
    <link rel="alternate" hreflang="ru" href="{{ Url::canonical($bare, 'ru') }}">
    <link rel="alternate" hreflang="x-default" href="{{ Url::canonical($bare, 'uk') }}">

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
