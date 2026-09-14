<?php

namespace App\Http\Middleware;

/**
 * Скрипти, які мають виконатись до першого фарбування.
 *
 * Одне джерело і для розмітки, і для CSP. Це головне: якби рядок у
 * шаблоні й рядок, з якого рахується хеш, лежали окремо, вони рано чи
 * пізно розійшлись би на один пробіл — і скрипт мовчки перестав би
 * виконуватись, а тема блимала б світлим на кожному завантаженні.
 *
 * Обидва рядки сталі: жодне значення від відвідувача чи з бази в них не
 * підставляється. Саме тому хеші взагалі можливі — у Next-версії
 * фреймворк домішував у кожну сторінку власний скрипт із даними, і
 * там довелось лишити 'unsafe-inline'.
 */
class InlineScripts
{
    /** Тема з localStorage — до фарбування, інакше блимає світлим. */
    public static function theme(): string
    {
        return "(function(){try{var t=localStorage.getItem('sep-theme');"
            ."if(t)document.documentElement.setAttribute('data-theme',t);}catch(e){}})();";
    }

    /**
     * Варіант A/B-тесту навігації.
     *
     * Обидва варіанти є в розмітці; атрибут на <html> вирішує, який
     * показати, і робить це до першого фарбування — без миготіння.
     * Коли тест вимкнений, усі бачать «b»: рішення вже прийняте, тест
     * лише перевіряє його на трафіку.
     */
    public static function abVariant(): string
    {
        if (! config('site.ab_enabled')) {
            return "document.documentElement.setAttribute('data-nav','b');";
        }

        return '(function(){try{'
            .'var m=document.cookie.match(/(?:^|; )sep_nav=([ab])/);'
            .'var v=m&&m[1];'
            ."if(!v){var a=new Uint8Array(1);crypto.getRandomValues(a);v=a[0]%2?'b':'a';"
            ."document.cookie='sep_nav='+v+';path=/;max-age=7776000;samesite=lax';}"
            ."document.documentElement.setAttribute('data-nav',v);"
            ."}catch(e){document.documentElement.setAttribute('data-nav','b');}})();";
    }

    /**
     * Усі інлайн-скрипти сторінки — для підрахунку хешів у CSP.
     *
     * @return list<string>
     */
    public static function all(): array
    {
        return [self::theme(), self::abVariant()];
    }
}
