@extends('admin.layout')
@section('title', $category->nameUk)

@php
    // SEO-текст редагується як звичайний текст: порожній рядок розділяє
    // абзаци, «## » на початку робить підзаголовок
    $seoUk = implode("\n\n", array_column($category->seo ?? [], 'uk'));
    $seoRu = implode("\n\n", array_column($category->seo ?? [], 'ru'));
@endphp

@section('content')
<a href="/admin/categories/" class="text-sm text-primary">← {{ __('admin.nav.categories') }}</a>

<h1 class="mt-2 font-display text-2xl font-bold">{{ $category->nameUk }}</h1>
<p class="text-sm text-muted">/catalog/{{ $category->slug }}/</p>

<form method="post" action="/admin/categories/{{ $category->slug }}/" class="mt-5 max-w-3xl space-y-4">
    @csrf
    @method('put')

    <div class="grid gap-4 sm:grid-cols-2">
        @foreach ([
            'nameUk' => 'Назва (укр)', 'nameRu' => 'Назва (рос)',
            'h1Uk' => 'Заголовок H1 (укр)', 'h1Ru' => 'Заголовок H1 (рос)',
        ] as $field => $label)
            <label class="block">
                <span class="mb-1 block text-sm font-medium">{{ $label }}</span>
                <input type="text" name="{{ $field }}" class="field" value="{{ old($field, $category->$field) }}" maxlength="200">
            </label>
        @endforeach
    </div>

    <div class="grid gap-4 sm:grid-cols-2">
        @foreach (['introUk' => 'Вступ (укр)', 'introRu' => 'Вступ (рос)'] as $field => $label)
            <label class="block">
                <span class="mb-1 block text-sm font-medium">{{ $label }}</span>
                <textarea name="{{ $field }}" class="field min-h-24" maxlength="2000">{{ old($field, $category->$field) }}</textarea>
            </label>
        @endforeach
    </div>

    <div class="grid gap-4 sm:grid-cols-2">
        <label class="block">
            <span class="mb-1 block text-sm font-medium">SEO-текст (укр)</span>
            <span class="mb-1 block text-xs text-muted">Порожній рядок розділяє абзаци, «## » робить підзаголовок</span>
            <textarea name="seoUk" class="field min-h-64">{{ old('seoUk', $seoUk) }}</textarea>
        </label>
        <label class="block">
            <span class="mb-1 block text-sm font-medium">SEO-текст (рос)</span>
            <span class="mb-1 block text-xs text-muted">Абзаців має бути стільки ж, скільки в українському</span>
            <textarea name="seoRu" class="field min-h-64">{{ old('seoRu', $seoRu) }}</textarea>
        </label>
    </div>

    <label class="block">
        <span class="mb-1 block text-sm font-medium">Часті питання (JSON)</span>
        <span class="mb-1 block text-xs text-muted">[{"q": {"uk": "…", "ru": "…"}, "a": {"uk": "…", "ru": "…"}}]</span>
        <textarea name="faq" class="field min-h-48 font-mono text-xs">{{ old('faq', json_encode($category->faq ?? [], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT)) }}</textarea>
    </label>

    <button type="submit" class="btn btn-primary">Зберегти</button>
</form>
@endsection
