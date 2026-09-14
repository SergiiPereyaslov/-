<!DOCTYPE html>
<html lang="uk">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ __('admin.login.title') }}</title>
    <meta name="robots" content="noindex, nofollow">
    @vite(['resources/css/app.css'])
</head>
<body class="flex min-h-screen items-center justify-center px-4">
    <form method="post" action="/admin/" class="card w-full max-w-sm p-6">
        @csrf

        <h1 class="font-display text-xl font-bold">{{ __('admin.login.title') }}</h1>

        @if ($errors->any())
            {{--
                Одне повідомлення на всі випадки: «невірний пароль» і
                «такого користувача немає» мають бути нерозрізнимі,
                інакше форму можна використати для перевірки адрес.
            --}}
            <p class="mt-3 rounded-md border border-danger px-3 py-2 text-sm text-danger">{{ $errors->first() }}</p>
        @endif

        <label class="mt-4 block">
            <span class="mb-1 block text-sm font-medium">{{ __('admin.login.email') }}</span>
            <input type="email" name="email" class="field" required autocomplete="username"
                   value="{{ old('email') }}" autofocus>
        </label>

        <label class="mt-3 block">
            <span class="mb-1 block text-sm font-medium">{{ __('admin.login.password') }}</span>
            <input type="password" name="password" class="field" required autocomplete="current-password">
        </label>

        <button type="submit" class="btn btn-primary mt-5 w-full">{{ __('admin.login.submit') }}</button>
    </form>
</body>
</html>
