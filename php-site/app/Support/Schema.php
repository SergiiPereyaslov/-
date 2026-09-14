<?php

namespace App\Support;

/**
 * Розмітка schema.org.
 *
 * Зібрана в одному класі, а не розкидана шаблонами: NAP (назва, адреса,
 * телефон) має бути однаковий у розмітці, у підвалі й на сторінці
 * контактів — розбіжність між ними псує локальне SEO.
 */
class Schema
{
    /** @return array<string, mixed> */
    public static function organization(): array
    {
        $locale = app()->getLocale();

        return [
            '@context' => 'https://schema.org',
            '@type' => 'Organization',
            '@id' => rtrim(config('site.url'), '/').'/#organization',
            'name' => config('site.name'),
            'legalName' => config('site.legal_name'),
            'url' => config('site.url'),
            'email' => config('site.email'),
            'telephone' => config('site.phones'),
            'taxID' => config('site.edrpou'),
            'address' => [
                '@type' => 'PostalAddress',
                'streetAddress' => config("site.address.street.{$locale}"),
                'addressLocality' => config("site.address.city.{$locale}"),
                'addressRegion' => config('site.address.region'),
                'postalCode' => config('site.address.postal_code'),
                'addressCountry' => config('site.address.country'),
            ],
        ];
    }

    /**
     * Локальний бізнес — для видачі за запитами з прив'язкою до міста.
     *
     * Окремо від organization(): та описує юридичну особу, а ця —
     * конкретну точку з координатами й графіком, і саме її пошук
     * показує на карті.
     *
     * @return array<string, mixed>
     */
    public static function localBusiness(): array
    {
        $locale = app()->getLocale();

        return [
            '@context' => 'https://schema.org',
            '@type' => 'LocalBusiness',
            '@id' => rtrim(config('site.url'), '/').'/#local',
            'name' => config('site.name'),
            'url' => config('site.url'),
            'email' => config('site.email'),
            'telephone' => config('site.phones'),
            'priceRange' => '$$',
            'address' => [
                '@type' => 'PostalAddress',
                'streetAddress' => config("site.address.street.{$locale}"),
                'addressLocality' => config("site.address.city.{$locale}"),
                'addressRegion' => config('site.address.region'),
                'postalCode' => config('site.address.postal_code'),
                'addressCountry' => config('site.address.country'),
            ],
            'geo' => [
                '@type' => 'GeoCoordinates',
                'latitude' => config('site.address.lat'),
                'longitude' => config('site.address.lng'),
            ],
            'openingHours' => 'Mo-Fr 09:00-18:00',
        ];
    }

    /**
     * Хлібні крихти.
     *
     * @param  list<array{label: string, href?: string}>  $crumbs
     * @return array<string, mixed>
     */
    public static function breadcrumbs(array $crumbs): array
    {
        $items = [];

        foreach (array_values($crumbs) as $i => $crumb) {
            $item = [
                '@type' => 'ListItem',
                'position' => $i + 1,
                'name' => $crumb['label'],
            ];

            if (isset($crumb['href'])) {
                $item['item'] = Url::canonical($crumb['href']);
            }

            $items[] = $item;
        }

        return [
            '@context' => 'https://schema.org',
            '@type' => 'BreadcrumbList',
            'itemListElement' => $items,
        ];
    }

    /**
     * Часті питання.
     *
     * @param  list<array{q: string, a: string}>  $pairs
     * @return array<string, mixed>
     */
    public static function faq(array $pairs): array
    {
        return [
            '@context' => 'https://schema.org',
            '@type' => 'FAQPage',
            'mainEntity' => array_map(fn (array $pair): array => [
                '@type' => 'Question',
                'name' => $pair['q'],
                'acceptedAnswer' => ['@type' => 'Answer', 'text' => $pair['a']],
            ], $pairs),
        ];
    }
}
