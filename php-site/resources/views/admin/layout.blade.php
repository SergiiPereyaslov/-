<!DOCTYPE html>
<html lang="uk">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>@yield('title', 'Адмінка') — SmartEcoPack</title>
    {{-- Панель не має потрапляти в індекс за жодних обставин --}}
    <meta name="robots" content="noindex, nofollow">
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body class="flex min-h-screen flex-col">
    <header class="border-b border-border bg-surface">
        <div class="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4">
            <a href="/admin/dashboard/" class="font-display font-bold">
                Smart<span class="text-primary">Eco</span>Pack
            </a>

            <nav class="flex flex-1 flex-wrap gap-1">
                @foreach ([
                    '/admin/dashboard/' => __('admin.nav.dashboard'),
                    '/admin/leads/' => __('admin.nav.leads'),
                    '/admin/products/' => __('admin.nav.products'),
                    '/admin/categories/' => __('admin.nav.categories'),
                    '/admin/posts/' => __('admin.nav.posts'),
                    '/admin/import/' => __('admin.nav.import'),
                    '/admin/ab/' => __('admin.nav.ab'),
                ] as $href => $label)
                    <a href="{{ $href }}" class="btn btn-ghost !min-h-8 !px-2.5 !text-[13px]">
                        {{ $label }}
                        @if ($href === '/admin/leads/' && ($newLeads ?? 0) > 0)
                            <span class="ml-1 rounded-full bg-accent px-1.5 text-[11px] font-bold text-white tnum">{{ $newLeads }}</span>
                        @endif
                    </a>
                @endforeach
            </nav>

            <span class="hidden text-xs text-muted sm:block">{{ auth()->user()?->name }}</span>

            <form method="post" action="/admin/logout">
                @csrf
                <button type="submit" class="btn btn-secondary !min-h-8 !px-3 !text-[13px]">{{ __('admin.nav.logout') }}</button>
            </form>
        </div>
    </header>

    <main class="mx-auto w-full max-w-7xl flex-1 px-4 py-6">
        @if (session('status'))
            <p class="mb-4 rounded-md bg-accent-soft px-4 py-2.5 text-sm font-medium text-accent">{{ session('status') }}</p>
        @endif

        @if ($errors->any())
            <ul class="mb-4 rounded-md border border-danger px-4 py-2.5 text-sm text-danger">
                @foreach ($errors->all() as $error)
                    <li>{{ $error }}</li>
                @endforeach
            </ul>
        @endif

        @yield('content')
    </main>

    <footer class="border-t border-border px-4 py-3 text-center text-xs text-muted">
        <a href="/" target="_blank" rel="noopener" class="hover:text-primary">{{ __('admin.nav.site') }} ↗</a>
    </footer>
</body>
</html>
