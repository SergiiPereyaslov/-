@extends('admin.layout')
@section('title', __('admin.nav.import'))

@section('content')
<h1 class="font-display text-2xl font-bold">{{ __('admin.nav.import') }}</h1>

<p class="mt-2 max-w-2xl text-sm text-muted">
    CSV з колонками: артикул, назва, категорія, в пачці, ціна, ціна опт, розмір,
    опис, фасети, форма, діаметр, наявність, логотип, слаг. Заголовки приймаються
    українською й англійською, розділювач визначається автоматично.
</p>

<p class="mt-2 max-w-2xl text-sm text-muted">
    Якщо у файлі є хоч одна помилка, не записується нічого: половина
    імпортованого каталогу гірша за жодного.
</p>

<form method="post" action="/admin/import/" enctype="multipart/form-data" class="card mt-5 max-w-xl p-5">
    @csrf
    <input type="file" name="file" accept=".csv,text/csv" class="field" required>
    <button type="submit" class="btn btn-primary mt-4">Завантажити</button>
</form>

@if ($result)
    <div class="card mt-5 max-w-3xl p-5 {{ $result['status'] === 'error' ? 'border-danger' : '' }}">
        <p class="font-medium {{ $result['status'] === 'error' ? 'text-danger' : 'text-primary' }}">{{ $result['message'] }}</p>

        @if (! empty($result['errors']))
            <ul class="mt-3 space-y-1 text-sm text-danger">
                @foreach ($result['errors'] as $error)
                    <li>{{ $error }}</li>
                @endforeach
            </ul>
        @endif

        @if (! empty($result['warnings']))
            <h2 class="mt-4 text-sm font-bold">Попередження</h2>
            <ul class="mt-1 space-y-1 text-sm text-muted">
                @foreach ($result['warnings'] as $warning)
                    <li>{{ $warning }}</li>
                @endforeach
            </ul>
        @endif
    </div>
@endif
@endsection
