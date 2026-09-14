import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import { bunny } from 'laravel-vite-plugin/fonts';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.js'],
            refresh: true,
            /*
             * Пара шрифтів: Manrope — нейтральний гротеск для тексту,
             * навігації, цін і кнопок; Bitter — slab-serif для заголовків,
             * що читається як друкований, «крафтовий».
             *
             * bunny() завантажує файли під час збірки й віддає їх із нашого
             * домену. Це не лише швидкість: жодного запиту до сторонніх
             * шрифтових сервісів — отже, ні витоку IP відвідувачів, ні
             * зайвих джерел у CSP.
             */
            fonts: [
                bunny('Manrope', { weights: [400, 500, 600, 700] }),
                bunny('Bitter', { weights: [600, 700] }),
            ],
        }),
        tailwindcss(),
    ],
    server: {
        watch: {
            ignored: ['**/storage/framework/views/**'],
        },
    },
});
