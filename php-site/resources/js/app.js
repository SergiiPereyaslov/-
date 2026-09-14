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

window.Alpine = Alpine;
Alpine.start();
