<?php

/*
|--------------------------------------------------------------------------
| Мапа 301 зі старих URL
|--------------------------------------------------------------------------
|
| Джерело — краул старого сайту від 02.04.2025 (982 URL), не здогадки.
| Це найважливіший файл міграції: кожен рядок тут — збережена позиція в
| пошуку. Порожня або неточна мапа означає втрату трафіку, який набирався
| роками, тому правила перенесені з Next-версії дослівно.
|
| Ключі — без завершального слеша (він знімається перед пошуком),
| значення — цільові URL уже зі слешем, бо саме така канонічна форма.
|
*/

/**
 * Статті старого блогу, під які власного матеріалу немає.
 *
 * Ведемо на список блогу, а не на випадкову статтю: нерелевантна ціль
 * гірша за загальну сторінку — і для читача, і для пошуку. Коли статтю
 * буде переписано, рядок переїжджає в 'exact' із конкретним URL.
 */
$oldPosts = [
    'brenduvannya---imidzh-abo-vpiznavanist-brendu',
    'eko-pakuvannya-j-vazhlivi-dribnichki',
    'etapy-perehoda-na-ekologichnuyu-upakovku-dlya-vashego-biznesa',
    'innovatsii---kak-razvivaetsya-mir-upakovki',
    'osvizhayuchi-litni-tendentsii-u-sviti-pakuvannya-zminyuyuchisya-potrebi-ta-sezonni-prioriteti',
    'rozumna-upakovka---trend-na-efektivnit',
    'smartecopack-na-interpack2023-dyusseldorf',
];

$exact = [
    /* ── Категорії ──────────────────────────────────────────────────── */
    '/catalog/stakani-paperovi' => '/catalog/stakany-paperovi/',
    // Окрема категорія старого сайту; у нас одношарові живуть у «Стакани паперові»
    '/catalog/stakani-odnosharovi' => '/catalog/stakany-paperovi/',
    '/catalog/stakani-dvosharovi' => '/catalog/stakany-dvosharovi/',
    '/catalog/stakani-gofrovani' => '/catalog/stakany-gofrovani/',
    '/catalog/krishki-dlya-stakaniv' => '/catalog/kryshky-dlya-stakaniv/',
    '/catalog/termochohli' => '/catalog/termochokhly/',
    '/catalog/trimachi' => '/catalog/trymachi-dlya-stakaniv/',

    // «Паперові контейнери для їжі» — насправді група, а не категорія
    '/catalog/stolovij-posud' => '/catalog/konteynery/',
    '/catalog/Lanch-box' => '/catalog/lanch-boksy/',
    '/catalog/salatnik-z-plastikovoyu-krishkoyu' => '/catalog/salatnyky/',
    '/catalog/supnik' => '/catalog/supnyky/',
    '/catalog/alyuminievi-kontejneri' => '/catalog/konteynery-alyuminiyevi/',
    '/catalog/tarilka-pryamokutna' => '/catalog/tarilky-ta-sousnyky/',
    '/catalog/morozivnitsi' => '/catalog/morozyvnytsi/',

    '/catalog/upakovka-dlya-fast-fudu' => '/catalog/fastfud/',
    '/catalog/korobka-dlya-pitsi' => '/catalog/korobky-dlya-pitsy/',
    '/catalog/upakovka-dlya-gamburgeru' => '/catalog/burger-boksy/',
    '/catalog/korobka-dlya-sushi-shidnoi-kuhni' => '/catalog/upakovka-dlya-sushi-ta-vok/',
    // upakovka-dlya-kartopli-fri збігається зі старим слагом — правило не потрібне

    // «Крафт пакети оптом» — теж група, а не категорія
    '/catalog/paketi-paperovi' => '/catalog/pakety/',
    '/catalog/paket-z-ruchkami' => '/catalog/pakety-z-ruchkamy/',
    // Слаг оманливий: сторінка називається «Крафт пакети БЕЗ ручок»
    '/catalog/paket-z-ruchkami2' => '/catalog/pakety-bez-ruchok/',
    '/catalog/paket-sashe' => '/catalog/pakety-sashe/',

    '/catalog/suputni-tovari' => '/catalog/suputni-tovary/',
    '/catalog/trubochki-paperovi' => '/catalog/trubochky-paperovi/',
    '/catalog/trubochki-polimerni' => '/catalog/trubochky-polimerni/',
    '/catalog/mishalki' => '/catalog/mishalky/',
    '/catalog/servetki' => '/catalog/servetky/',
    '/catalog/filtr-paket' => '/catalog/filtr-pakety/',
    // «Цукор в стіках» під технічним слагом
    '/catalog/portsijni-tovari' => '/catalog/stiky-tsukru/',

    // «РЕТ посуд» — група; «Стакани з купольною кришкою» — категорія під нею
    '/catalog/stakani-pet' => '/catalog/pet-posud/',
    '/catalog/stakani-ret' => '/catalog/stakany-pet/',
    // Друкарська помилка в слагу, на старому сайті вже віддає 404
    '/catalog/stakani-rr' => '/catalog/stakany-pet/',
    '/catalog/desertnitsi-pet' => '/catalog/desertnytsi-pet/',
    '/catalog/stolovi-pribori-ps' => '/catalog/stolovi-prybory/',

    /* ── Службові й статичні ────────────────────────────────────────── */
    '/all-products' => '/catalog/',
    '/branding' => '/brenduvannya/',
    '/druk-na-paperovih-stakanchikah' => '/brenduvannya/druk-na-stakanakh/',
    '/druk-na-kraft-paketah' => '/brenduvannya/druk-na-paketakh/',
    '/dostavka' => '/dostavka-i-oplata/',
    '/contact' => '/kontakty/',
    '/politika-konfidentsialnosti' => '/polityka-konfidentsiynosti/',
    '/obmin-ta-povernennya-tovaru' => '/publichna-oferta/',
    // Переваги були окремою сторінкою; той самий зміст тепер на «Про нас»
    '/perevagi' => '/pro-nas/',
    // Порівняння й вибране — функції старого рушія, яких у нас немає
    '/comparison' => '/catalog/',
    '/wishlist' => '/catalog/',

    /* ── Блог ───────────────────────────────────────────────────────── */
    '/news' => '/blog/',
    '/all-posts' => '/blog/',
    '/authors' => '/blog/',
    // Чотири статті, під які в нас є свій матеріал
    '/news/paperovi-stakani-na-scho-varto-zvernuti-uvagu' => '/blog/yak-vybraty-paperovi-stakany/',
    '/news/perevagi-paperovoi-upakovki-dlya-biznesu' => '/blog/perevahy-paperovoyi-upakovky-dlya-biznesu/',
    '/news/bumazhnaya-upakovka-na-chto-obrait-vnimanie-pri-vybore' => '/blog/paperova-upakovka-dlya-yizhi-navynos/',
    '/news/druk-na-paperovih-upakovkah' => '/blog/druk-na-paperovykh-stakanchykakh/',
    // П'ять статей, під які написано власний матеріал замість загального /blog/
    '/news/10-klyuchevyh-aspektov-dlya-uspeshnogo-otkrytiya-kofejni' => '/blog/yak-vidkryty-kavyarnyu-chek-list/',
    '/news/vidminnosti-plastikovogo-pakuvannya-vid-paperovogo' => '/blog/papir-chy-plastyk/',
    '/news/bumazhnyj-paket-aktsenty-pri-vybore-optimalnogo-varianta' => '/blog/yak-vybraty-kraft-paket/',
    '/news/upakovka-dlya-konditeriv' => '/blog/upakovka-dlya-konditerskoyi/',
    '/news/sposoby-brendirovaniya-upakovki-dlya-fastfuda' => '/blog/brenduvannya-upakovky-dlya-fastfudu/',
    // Та сама тема під іншим кутом — ведемо на ту саму статтю
    '/news/neobychnaya-upakovka-dlya-fastfuda-kak-vydelitsya-sredi-konkurentov' => '/blog/brenduvannya-upakovky-dlya-fastfudu/',
];

foreach ($oldPosts as $slug) {
    $exact["/news/{$slug}"] = '/blog/';
}

return [

    'exact' => $exact,

    /*
    |----------------------------------------------------------------------
    | Правила за шаблоном
    |----------------------------------------------------------------------
    |
    | Застосовуються після точних збігів. Ключ — регулярний вираз,
    | значення — заміна, де $1 підставляє першу групу.
    |
    */
    'patterns' => [
        // Стара пагінація й «показати все» — прибираємо дублі
        '~^/catalog/([^/]+)/page-all$~' => '/catalog/$1/',
        '~^/catalog/([^/]+)/page-\d+$~' => '/catalog/$1/',
        // Фільтри старого рушія: «акційні» та «рекомендовані». У краулі їх 26,
        // усі з canonical на категорію — тобто дублі, які нема сенсу зберігати.
        '~^/catalog/([^/]+)/filter-[a-z]+$~' => '/catalog/$1/',
        // /all-products із будь-яким хвостом фільтрів і пагінації.
        // Ціль без слеша навмисно: наступний прохід переведе її на /catalog/
        // за точним правилом, і відвідувач отримає один 301, а не два.
        '~^/all-products(?:/(?:filter-[a-z]+|page-\d+|page-all))+$~' => '/all-products',
        // Товар переїхав з /products/ на /product/
        '~^/products/([^/]+)$~' => '/product/$1/',
        // Решта блогу — за загальним правилом
        '~^/news/([^/]+)$~' => '/blog/$1/',
    ],

    /*
    |----------------------------------------------------------------------
    | Скільки разів застосовувати правила поспіль
    |----------------------------------------------------------------------
    |
    | Правила транзитивні: /catalog/upakovka-dlya-fast-fudu/page-all спершу
    | втрачає page-all, а потім перетворюється на /catalog/fastfud/. Без
    | цього вийшов би ланцюжок із двох 301 замість одного.
    |
    | Обмеження потрібне, щоб взаємні правила не зациклили запит.
    |
    */
    'max_hops' => 3,

];
