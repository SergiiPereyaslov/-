import Alpine from 'alpinejs';

/**
 * Кошик відвідувача.
 *
 * Живе в localStorage, а не на сервері: до оформлення заявки в нас немає
 * жодних підстав заводити сесію й зберігати, хто що переглядав. Це й менше
 * персональних даних, і жодного запиту до бази на кожне «додати в кошик».
 *
 * Зберігаються тільки слаг і кількість пачок. Ціни й назви беруться зі
 * сторінки кошика за слагами: інакше прайс, покладений у localStorage
 * місяць тому, показувався б відвідувачу як чинний.
 */
const CART_KEY = 'sep-cart';

Alpine.store('cart', {
    items: {},

    init() {
        this.items = this.read();

        // Кошик спільний для всіх вкладок: зміна в одній має бути видна
        // в решті, інакше відвідувач додасть товар двічі.
        window.addEventListener('storage', (event) => {
            if (event.key === CART_KEY) {
                this.items = this.read();
            }
        });
    },

    read() {
        try {
            const raw = localStorage.getItem(CART_KEY);
            const parsed = raw ? JSON.parse(raw) : {};

            return typeof parsed === 'object' && parsed !== null ? parsed : {};
        } catch {
            // Приватний режим або зіпсований запис — кошик просто порожній,
            // сторінка через це падати не має.
            return {};
        }
    },

    save() {
        try {
            localStorage.setItem(CART_KEY, JSON.stringify(this.items));
        } catch {
            // Сховище недоступне: кошик працює в межах сторінки.
        }
    },

    add(slug, packs = 1) {
        this.items[slug] = (this.items[slug] ?? 0) + packs;
        this.save();
    },

    set(slug, packs) {
        if (packs > 0) {
            this.items[slug] = packs;
        } else {
            delete this.items[slug];
        }

        this.save();
    },

    remove(slug) {
        delete this.items[slug];
        this.save();
    },

    clear() {
        this.items = {};
        this.save();
    },

    packsOf(slug) {
        return this.items[slug] ?? 0;
    },

    get totalPacks() {
        return Object.values(this.items).reduce((sum, packs) => sum + packs, 0);
    },

    get isEmpty() {
        return this.totalPacks === 0;
    },
});

/**
 * Перемикач теми: світла → темна → системна.
 *
 * Системний стан — це відсутність атрибута на <html>, тоді вирішує
 * prefers-color-scheme. Тому вибір не «булевий», і третій стан потрібен:
 * інакше відвідувач, який один раз натиснув кнопку, більше ніколи не
 * повернеться до налаштування своєї системи.
 */
Alpine.data('themeToggle', () => ({
    isDark: false,

    init() {
        this.sync();

        window.matchMedia('(prefers-color-scheme: dark)')
            .addEventListener('change', () => this.sync());
    },

    sync() {
        const stored = localStorage.getItem('sep-theme');

        this.isDark = stored
            ? stored === 'dark'
            : window.matchMedia('(prefers-color-scheme: dark)').matches;
    },

    toggle() {
        const next = this.isDark ? 'light' : 'dark';

        document.documentElement.setAttribute('data-theme', next);

        try {
            localStorage.setItem('sep-theme', next);
        } catch {
            // Без сховища вибір діє лише до перезавантаження.
        }

        this.isDark = next === 'dark';
    },
}));

/**
 * Підказки пошуку.
 *
 * Дебаунс 200 мс: аудиторія шукає короткі рядки на кшталт «стакан 340»,
 * і запит на кожну літеру дав би вп'ятеро більше навантаження без користі.
 */
Alpine.data('searchBox', (locale) => ({
    query: '',
    hits: [],
    open: false,
    loading: false,
    timer: null,

    onInput() {
        clearTimeout(this.timer);

        if (this.query.trim().length < 2) {
            this.hits = [];
            this.open = false;

            return;
        }

        this.timer = setTimeout(() => this.search(), 200);
    },

    async search() {
        this.loading = true;

        try {
            const params = new URLSearchParams({ q: this.query.trim(), locale });
            const response = await fetch(`/api/search/?${params}`, {
                headers: { Accept: 'application/json' },
            });

            this.hits = response.ok ? await response.json() : [];
            this.open = true;
        } catch {
            this.hits = [];
        } finally {
            this.loading = false;
        }
    },
}));


/**
 * Ціна за одиницю з урахуванням оптових щаблів.
 *
 * Та сама логіка, що й у Product::unitPriceFor() на сервері: щаблі
 * впорядковані за зростанням minPacks, тож останній, який перекрито
 * кількістю пачок, і дає остаточну ціну. Дублювання свідоме — інакше
 * зміна кількості вимагала б запиту на сервер при кожному натисканні.
 */
export function unitPriceFor(product, packs) {
    let price = product.priceRetail;

    for (const tier of product.tiers ?? []) {
        if (packs >= tier.minPacks) {
            price = tier.perUnit;
        }
    }

    return price;
}

/** Картка товару: кількість пачок і перерахунок ціни без запиту на сервер. */
Alpine.data('productCard', (product) => ({
    packs: 1,

    get unitPrice() {
        return unitPriceFor(product, this.packs);
    },

    get packPrice() {
        return this.unitPrice * product.unitsPerPack;
    },

    get inCart() {
        return this.$store.cart.packsOf(product.slug) > 0;
    },

    addToCart() {
        this.$store.cart.add(product.slug, this.packs);
    },
}));

/**
 * Категорія: фільтри, сортування й «показати ще».
 *
 * Працює над уже відрендереною сіткою, а не будує її наново. Причина —
 * пошук: усі товари категорії лишаються в HTML, а скрипт лише ховає
 * зайве. Якби картки малював JS, робот бачив би порожню сторінку.
 */
Alpine.data('categoryView', (total) => ({
    selected: {},
    sort: 'popular',
    shown: 12,
    sheetOpen: false,
    visibleCount: total,
    chips: [],

    init() {
        this.apply();
    },

    get activeCount() {
        return this.chips.length;
    },

    get hasMore() {
        return this.visibleCount > this.shown;
    },

    isSelected(key, value) {
        return (this.selected[key] ?? []).includes(value);
    },

    toggle(key, value) {
        const current = this.selected[key] ?? [];

        this.selected[key] = current.includes(value)
            ? current.filter((v) => v !== value)
            : [...current, value];

        // Новий фільтр — нова видача, тому лічильник показаного скидається
        this.shown = 12;
        this.apply();
    },

    reset() {
        this.selected = {};
        this.shown = 12;
        this.apply();
    },

    showMore() {
        this.shown += 12;
        this.apply();
    },

    apply() {
        const cards = Array.from(this.$refs.grid.querySelectorAll('[data-product]'));
        const active = Object.entries(this.selected).filter(([, values]) => values.length > 0);

        const matching = cards.filter((card) => {
            const facets = JSON.parse(card.dataset.facets || '{}');

            return active.every(([key, values]) => values.includes(facets[key]));
        });

        this.sortCards(matching);

        // Позиція в сітці задається через CSS order: переставляти вузли
        // означало б губити стан Alpine усередині карток (обрану кількість)
        cards.forEach((card) => {
            card.style.display = 'none';
            card.style.order = '';
        });

        matching.slice(0, this.shown).forEach((card, index) => {
            card.style.display = '';
            card.style.order = String(index);
        });

        this.visibleCount = matching.length;
        this.chips = this.buildChips();
    },

    sortCards(cards) {
        const byName = new Intl.Collator(document.documentElement.lang || 'uk');

        const compare = {
            'price-asc': (a, b) => a.dataset.price - b.dataset.price,
            'price-desc': (a, b) => b.dataset.price - a.dataset.price,
            name: (a, b) => byName.compare(a.dataset.name, b.dataset.name),
            popular: (a, b) => b.dataset.featured - a.dataset.featured,
        };

        cards.sort(compare[this.sort] ?? compare.popular);
    },

    buildChips() {
        const out = [];

        for (const [key, values] of Object.entries(this.selected)) {
            for (const value of values) {
                const input = this.$el.querySelector(`input[value="${value}"]`);
                const label = input?.nextElementSibling?.textContent?.trim() ?? value;

                out.push({ key, value, label });
            }
        }

        return out;
    },
}));

/** Панель товару: кількість, підсумок і додавання в кошик. */
Alpine.data('productPanel', (product) => ({
    packs: 1,

    get unitPrice() {
        return unitPriceFor(product, this.packs);
    },

    get total() {
        return this.unitPrice * product.unitsPerPack * this.packs;
    },

    get totalLabel() {
        return (product.totalForTemplate ?? '').replace('{n}', this.packs);
    },

    get inCart() {
        return this.$store.cart.packsOf(product.slug) > 0;
    },

    addToCart() {
        this.$store.cart.add(product.slug, this.packs);
    },
}));

/**
 * Кошик: підтягує актуальні дані товарів за слагами з localStorage.
 *
 * Ціни не зберігаються в браузері навмисно (див. коментар до сховища
 * кошика), тому сторінка спершу порожня, а після відповіді сервера
 * показує позиції з чинним прайсом.
 */
Alpine.data('cartView', (labels) => ({
    products: {},
    ready: false,

    async init() {
        await this.load();

        // Кількість могли змінити в іншій вкладці — перезавантажуємо дані
        this.$watch('$store.cart.items', () => this.loadMissing());
    },

    async load() {
        const slugs = Object.keys(this.$store.cart.items);

        if (slugs.length === 0) {
            this.ready = true;

            return;
        }

        try {
            const response = await fetch(`/api/cart-products/?slugs=${encodeURIComponent(slugs.join(','))}`, {
                headers: { Accept: 'application/json' },
            });

            if (response.ok) {
                for (const product of await response.json()) {
                    this.products[product.slug] = product;
                }
            }
        } catch {
            // Мережа недоступна: показуємо порожній кошик замість помилки
        }

        this.ready = true;
    },

    /** Товар, доданий в іншій вкладці, ще не має даних — дотягуємо. */
    loadMissing() {
        const missing = Object.keys(this.$store.cart.items).filter((slug) => !this.products[slug]);

        if (missing.length > 0) {
            this.load();
        }
    },

    get lines() {
        return Object.entries(this.$store.cart.items)
            .map(([slug, packs]) => {
                const product = this.products[slug];

                if (!product) {
                    return null;
                }

                const unit = unitPriceFor(product, packs);

                return {
                    ...product,
                    packs,
                    unitPrice: unit,
                    sum: unit * product.unitsPerPack * packs,
                    // Наступний оптовий поріг — підказка, яка прямо
                    // піднімає середній чек
                    nextTier: (product.tiers ?? []).find((t) => packs < t.minPacks) ?? null,
                };
            })
            .filter(Boolean);
    },

    get totalSum() {
        return this.lines.reduce((sum, line) => sum + line.sum, 0);
    },

    tierHint(line) {
        return (labels.tierHint ?? '')
            .replace('{n}', line.nextTier.minPacks - line.packs)
            .replace('{price}', line.nextTier.perUnit.toFixed(2));
    },

    setPacks(slug, packs) {
        this.$store.cart.set(slug, Math.max(1, Math.min(1000, parseInt(packs) || 1)));
    },
}));

/**
 * Надсилання заявки.
 *
 * Спільний компонент для короткої форми запиту прайсу й повного
 * оформлення: обидві шлють в один ендпоінт, різниця лише в наборі полів
 * і в тому, чи їде з ними кошик.
 */
Alpine.data('leadForm', (options) => ({
    form: {
        phone: '',
        name: '',
        email: '',
        company: '',
        comment: '',
        delivery: 'pickup',
        customer: 'individual',
        city: '',
        requisites: '',
    },
    sending: false,
    done: false,
    error: '',
    number: '',

    /** Той самий формат, що й на сервері — щоб не гнати завідомо хибне. */
    isPhoneValid() {
        return /^\+?380\d{9}$/.test(this.form.phone.replace(/[\s()\-]/g, ''));
    },

    async submit() {
        if (!this.isPhoneValid()) {
            this.error = options.messages.phoneInvalid;

            return;
        }

        this.sending = true;
        this.error = '';

        const payload = {
            ...this.form,
            kind: options.kind,
            source: options.source,
            locale: options.locale,
        };

        /*
         * Кошик їде тільки з оформлення; у короткій формі його немає.
         * Позиції беруться з lines батьківського cartView — там уже
         * лежать актуальні ціни, підтягнуті з сервера, а не те, що
         * зберігав браузер.
         */
        if (options.withCart) {
            payload.items = (this.lines ?? []).map((line) => ({
                sku: line.sku,
                name: line.name,
                packs: line.packs,
                sum: line.sum,
            }));
            payload.total = payload.items.reduce((sum, item) => sum + item.sum, 0);
        }

        try {
            const response = await fetch('/api/lead', {
                method: 'POST',
                /*
                 * Токена CSRF тут немає навмисно. Ендпоінт заявок
                 * лежить у групі api — без сесії, тож анонімний
                 * відвідувач не отримує cookie, і сторінки лишаються
                 * придатними до повного кешування. Від зловживань
                 * захищає обмеження частоти, а не токен: форма й так
                 * публічна, і підробка запиту дає рівно те саме, що
                 * й відкрити сторінку та натиснути кнопку.
                 */
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok || !data.ok) {
                this.error = options.messages.error;
                this.sending = false;

                return;
            }

            this.number = data.number ?? '';
            this.done = true;

            if (options.withCart) {
                this.$store.cart.clear();
            }

            if (options.redirectTo) {
                window.location.href = options.redirectTo + '?n=' + encodeURIComponent(this.number);
            }
        } catch {
            this.error = options.messages.error;
        }

        this.sending = false;
    },
}));

window.Alpine = Alpine;
Alpine.start();
