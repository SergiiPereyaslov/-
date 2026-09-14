@extends('admin.layout')
@section('title', __('admin.nav.products'))

@section('content')
<h1 class="font-display text-2xl font-bold">{{ __('admin.nav.products') }}</h1>

<form method="get" class="mt-4 flex gap-2">
    <input type="search" name="q" value="{{ $q }}" class="field max-w-sm" placeholder="Пошук за назвою або артикулом">
    <button type="submit" class="btn btn-secondary">Знайти</button>
</form>

<table class="mt-5 w-full text-sm">
    <thead class="text-left text-xs uppercase text-muted">
        <tr><th class="py-2">Товар</th><th>Артикул</th><th class="text-right">Ціна</th><th>Наявність</th><th>Хіт</th><th></th></tr>
    </thead>
    <tbody class="divide-y divide-border">
        @foreach ($products as $product)
            <tr>
                {{--
                    Швидка правка просто зі списку: ціна, наявність і
                    «хіт» — це те, що змінюється щодня, і заради цього не
                    варто відкривати повну картку.
                --}}
                <form method="post" action="/admin/products/{{ $product->slug }}/quick" id="quick-{{ $product->slug }}">
                    @csrf
                    @method('put')
                </form>
                <td class="py-2">
                    <a href="/admin/products/{{ $product->slug }}/" class="font-medium text-primary">{{ $product->nameUk }}</a>
                    <span class="block text-xs text-muted">{{ $product->categorySlug }}</span>
                </td>
                <td class="text-muted tnum">{{ $product->sku }}</td>
                <td class="text-right">
                    <input form="quick-{{ $product->slug }}" name="priceRetail" type="text" inputmode="decimal"
                           value="{{ number_format((float) $product->priceRetail, 2, '.', '') }}"
                           class="field !min-h-8 !w-24 !py-1 text-right text-sm tnum">
                </td>
                <td><input form="quick-{{ $product->slug }}" type="checkbox" name="inStock" value="1"
                           @checked($product->inStock) class="h-4 w-4 accent-[var(--primary)]"></td>
                <td><input form="quick-{{ $product->slug }}" type="checkbox" name="featured" value="1"
                           @checked($product->featured) class="h-4 w-4 accent-[var(--primary)]"></td>
                <td class="text-right">
                    <button form="quick-{{ $product->slug }}" type="submit" class="btn btn-secondary !min-h-8 !px-3 !text-[13px]">Зберегти</button>
                </td>
            </tr>
        @endforeach
    </tbody>
</table>

<div class="mt-4">{{ $products->links() }}</div>
@endsection
