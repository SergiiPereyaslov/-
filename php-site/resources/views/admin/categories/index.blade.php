@extends('admin.layout')
@section('title', __('admin.nav.categories'))

@section('content')
<h1 class="font-display text-2xl font-bold">{{ __('admin.nav.categories') }}</h1>

<table class="mt-5 w-full text-sm">
    <thead class="text-left text-xs uppercase text-muted">
        <tr><th class="py-2">Категорія</th><th>Група</th><th>Слаг</th><th class="text-right">Абзаців SEO</th><th class="text-right">Питань</th></tr>
    </thead>
    <tbody class="divide-y divide-border">
        @foreach ($categories as $category)
            <tr>
                <td class="py-2"><a href="/admin/categories/{{ $category->slug }}/" class="font-medium text-primary">{{ $category->nameUk }}</a></td>
                <td class="text-muted">{{ $category->group?->nameUk }}</td>
                <td class="text-muted">{{ $category->slug }}</td>
                <td class="text-right tnum">{{ count($category->seo ?? []) }}</td>
                <td class="text-right tnum">{{ count($category->faq ?? []) }}</td>
            </tr>
        @endforeach
    </tbody>
</table>
@endsection
