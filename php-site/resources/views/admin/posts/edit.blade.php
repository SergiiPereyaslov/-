@extends('admin.layout')
@section('title', $isNew ? 'Нова стаття' : $post->titleUk)

@php
    $bodyUk = implode("\n\n", array_column($post->body ?? [], 'uk'));
    $bodyRu = implode("\n\n", array_column($post->body ?? [], 'ru'));
@endphp

@section('content')
<a href="/admin/posts/" class="text-sm text-primary">← {{ __('admin.nav.posts') }}</a>

<h1 class="mt-2 font-display text-2xl font-bold">{{ $isNew ? 'Нова стаття' : $post->titleUk }}</h1>

<form method="post" action="{{ $isNew ? '/admin/posts/' : '/admin/posts/'.$post->slug.'/' }}" class="mt-5 max-w-3xl space-y-4">
    @csrf
    @unless ($isNew) @method('put') @endunless

    <label class="block">
        <span class="mb-1 block text-sm font-medium">Слаг</span>
        <span class="mb-1 block text-xs text-muted">
            @if ($isNew)
                Порожній — згенерується з заголовка
            @else
                Не змінюється: адреса вже в індексі пошуку
            @endif
        </span>
        <input type="text" name="slug" class="field" value="{{ old('slug', $post->slug) }}"
               @readonly(! $isNew) pattern="[a-z0-9-]*">
    </label>

    <div class="grid gap-4 sm:grid-cols-2">
        @foreach (['titleUk' => 'Заголовок (укр)', 'titleRu' => 'Заголовок (рос)'] as $field => $label)
            <label class="block">
                <span class="mb-1 block text-sm font-medium">{{ $label }}</span>
                <input type="text" name="{{ $field }}" class="field" value="{{ old($field, $post->$field) }}" maxlength="200" required>
            </label>
        @endforeach
    </div>

    <div class="grid gap-4 sm:grid-cols-2">
        @foreach (['excerptUk' => 'Анонс (укр)', 'excerptRu' => 'Анонс (рос)'] as $field => $label)
            <label class="block">
                <span class="mb-1 block text-sm font-medium">{{ $label }}</span>
                <textarea name="{{ $field }}" class="field min-h-24" maxlength="1000" required>{{ old($field, $post->$field) }}</textarea>
            </label>
        @endforeach
    </div>

    <div class="grid gap-4 sm:grid-cols-2">
        <label class="block">
            <span class="mb-1 block text-sm font-medium">Текст (укр)</span>
            <textarea name="bodyUk" class="field min-h-80">{{ old('bodyUk', $bodyUk) }}</textarea>
        </label>
        <label class="block">
            <span class="mb-1 block text-sm font-medium">Текст (рос)</span>
            <textarea name="bodyRu" class="field min-h-80">{{ old('bodyRu', $bodyRu) }}</textarea>
        </label>
    </div>

    <div class="grid gap-4 sm:grid-cols-2">
        <label class="block">
            <span class="mb-1 block text-sm font-medium">Дата публікації</span>
            <span class="mb-1 block text-xs text-muted">Майбутня дата — відкладена публікація</span>
            <input type="date" name="publishedAt" class="field"
                   value="{{ old('publishedAt', $post->publishedAt?->toDateString()) }}">
        </label>
        <label class="block">
            <span class="mb-1 block text-sm font-medium">Категорії каталогу</span>
            <span class="mb-1 block text-xs text-muted">Слаги через кому — звідси береться перелінковка в обидва боки</span>
            <input type="text" name="related" class="field" value="{{ old('related', implode(', ', $post->related ?? [])) }}">
        </label>
    </div>

    <label class="flex items-center gap-2 text-sm">
        <input type="checkbox" name="published" value="1" @checked($post->published ?? true) class="h-4 w-4 accent-[var(--primary)]">
        <span>Опублікована</span>
    </label>

    <div class="flex gap-2">
        <button type="submit" class="btn btn-primary">Зберегти</button>
    </div>
</form>

@unless ($isNew)
    <form method="post" action="/admin/posts/{{ $post->slug }}/" class="mt-8"
          onsubmit="return confirm('Видалити статтю? Цю дію не скасувати.')">
        @csrf
        @method('delete')
        <button type="submit" class="btn btn-ghost !text-danger">Видалити статтю</button>
    </form>
@endunless
@endsection
