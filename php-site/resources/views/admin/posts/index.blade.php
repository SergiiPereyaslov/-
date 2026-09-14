@extends('admin.layout')
@section('title', __('admin.nav.posts'))

@section('content')
<div class="flex items-center justify-between gap-4">
    <h1 class="font-display text-2xl font-bold">{{ __('admin.nav.posts') }}</h1>
    <a href="/admin/posts/new/" class="btn btn-primary !min-h-9">Нова стаття</a>
</div>

<table class="mt-5 w-full text-sm">
    <thead class="text-left text-xs uppercase text-muted">
        <tr><th class="py-2">Заголовок</th><th>Дата</th><th>Стан</th><th class="text-right">Категорій</th></tr>
    </thead>
    <tbody class="divide-y divide-border">
        @foreach ($posts as $post)
            <tr>
                <td class="py-2"><a href="/admin/posts/{{ $post->slug }}/" class="font-medium text-primary">{{ $post->titleUk }}</a></td>
                <td class="text-muted tnum">{{ $post->publishedAt->format('d.m.Y') }}</td>
                <td>
                    @if (! $post->published)
                        <span class="chip !py-0.5 !text-[11px]">чернетка</span>
                    @elseif ($post->publishedAt->isFuture())
                        <span class="chip !py-0.5 !text-[11px] border-accent text-accent">відкладена</span>
                    @else
                        <span class="chip !py-0.5 !text-[11px] border-primary text-primary">на сайті</span>
                    @endif
                </td>
                <td class="text-right tnum">{{ count($post->related) }}</td>
            </tr>
        @endforeach
    </tbody>
</table>
@endsection
