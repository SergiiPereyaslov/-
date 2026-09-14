@php use App\Support\Url; @endphp
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
    <channel>
        <title>{{ config('site.name') }} — {{ __('site.nav.blog') }}</title>
        <link>{{ Url::canonical('/blog/') }}</link>
        <description>{{ __('pages.blog.meta.description') }}</description>
        <language>{{ app()->getLocale() }}</language>
        <atom:link href="{{ $selfUrl }}" rel="self" type="application/rss+xml" />
@foreach ($posts as $post)
        <item>
            <title>{{ $post->title }}</title>
            <link>{{ Url::canonical('/blog/'.$post->slug.'/') }}</link>
            <guid isPermaLink="true">{{ Url::canonical('/blog/'.$post->slug.'/') }}</guid>
            <pubDate>{{ $post->publishedAt->toRfc2822String() }}</pubDate>
            <description>{{ $post->excerpt }}</description>
        </item>
@endforeach
    </channel>
</rss>
