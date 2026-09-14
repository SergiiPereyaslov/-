@extends('admin.layout')
@section('title', $product->nameUk)

@section('content')
<a href="/admin/products/" class="text-sm text-primary">← {{ __('admin.nav.products') }}</a>

<h1 class="mt-2 font-display text-2xl font-bold">{{ $product->nameUk }}</h1>
<p class="text-sm text-muted tnum">{{ $product->sku }} · /product/{{ $product->slug }}/</p>

<form method="post" action="/admin/products/{{ $product->slug }}/" class="mt-5 max-w-3xl space-y-4">
    @csrf
    @method('put')

    <label class="block">
        <span class="mb-1 block text-sm font-medium">Категорія</span>
        <select name="categorySlug" class="field">
            @foreach ($categories as $category)
                <option value="{{ $category->slug }}" @selected($product->categorySlug === $category->slug)>
                    {{ $category->nameUk }}
                </option>
            @endforeach
        </select>
    </label>

    <div class="grid gap-4 sm:grid-cols-2">
        @foreach ([
            'nameUk' => 'Назва (укр)', 'nameRu' => 'Назва (рос)',
            'specUk' => 'Розмір (укр)', 'specRu' => 'Розмір (рос)',
        ] as $field => $label)
            <label class="block">
                <span class="mb-1 block text-sm font-medium">{{ $label }}</span>
                <input type="text" name="{{ $field }}" class="field" value="{{ old($field, $product->$field) }}" maxlength="200">
            </label>
        @endforeach
    </div>

    <div class="grid gap-4 sm:grid-cols-2">
        @foreach (['descriptionUk' => 'Опис (укр)', 'descriptionRu' => 'Опис (рос)'] as $field => $label)
            <label class="block">
                <span class="mb-1 block text-sm font-medium">{{ $label }}</span>
                <textarea name="{{ $field }}" class="field min-h-32" maxlength="8000">{{ old($field, $product->$field) }}</textarea>
            </label>
        @endforeach
    </div>

    <div class="grid gap-4 sm:grid-cols-4">
        <label class="block">
            <span class="mb-1 block text-sm font-medium">У пачці, шт</span>
            <input type="number" name="unitsPerPack" class="field tnum" value="{{ old('unitsPerPack', $product->unitsPerPack) }}" min="1">
        </label>
        <label class="block">
            <span class="mb-1 block text-sm font-medium">Ціна, грн/шт</span>
            <input type="text" name="priceRetail" class="field tnum" value="{{ number_format((float) $product->priceRetail, 2, '.', '') }}">
        </label>
        <label class="block">
            <span class="mb-1 block text-sm font-medium">Форма</span>
            <select name="shape" class="field">
                @foreach (['cup','lid','sleeve','holder','straw','box','round','bag','flat'] as $shape)
                    <option value="{{ $shape }}" @selected($product->shape === $shape)>{{ $shape }}</option>
                @endforeach
            </select>
        </label>
        <label class="block">
            <span class="mb-1 block text-sm font-medium">Діаметр вінця, мм</span>
            <input type="number" name="lidDiameter" class="field tnum" value="{{ old('lidDiameter', $product->lidDiameter) }}">
        </label>
    </div>

    <div class="flex flex-wrap gap-5">
        @foreach (['inStock' => 'У наявності', 'brandable' => 'Можна брендувати', 'featured' => 'Хіт продажів'] as $field => $label)
            <label class="flex items-center gap-2 text-sm">
                <input type="checkbox" name="{{ $field }}" value="1" @checked($product->$field) class="h-4 w-4 accent-[var(--primary)]">
                <span>{{ $label }}</span>
            </label>
        @endforeach
    </div>

    <button type="submit" class="btn btn-primary">Зберегти</button>
</form>
@endsection
