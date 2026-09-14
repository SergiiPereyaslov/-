@php use App\Support\Url; @endphp
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
@foreach ($urls as $url)
    <url>
        <loc>{{ Url::canonical($url['path'], 'uk') }}</loc>
        {{-- Пара іншою мовою: без цього дві версії вважались би дублями --}}
        <xhtml:link rel="alternate" hreflang="uk" href="{{ Url::canonical($url['path'], 'uk') }}" />
        <xhtml:link rel="alternate" hreflang="ru" href="{{ Url::canonical($url['path'], 'ru') }}" />
        <xhtml:link rel="alternate" hreflang="x-default" href="{{ Url::canonical($url['path'], 'uk') }}" />
@if (! empty($url['lastmod']))
        <lastmod>{{ $url['lastmod'] }}</lastmod>
@endif
        <changefreq>{{ $url['changefreq'] }}</changefreq>
        <priority>{{ $url['priority'] }}</priority>
    </url>
@endforeach
</urlset>
