@php
    /*
     * Скрипти, які мають виконатись до першого фарбування.
     *
     * Зібрані в одному файлі, щоб було одне місце, де видно весь код, що
     * йде в сторінку повз бандл. Обидва рядки — сталі: жодного значення
     * від відвідувача чи з бази в них не підставляється, тож підрахувати
     * для них хеш CSP можна наперед, на відміну від Next-версії, де
     * фреймворк домішував у кожну сторінку власний інлайн-скрипт.
     */
    $themeScript = "(function(){try{var t=localStorage.getItem('sep-theme');if(t)document.documentElement.setAttribute('data-theme',t);}catch(e){}})();";

    $abScript = config('site.ab_enabled')
        ? "(function(){try{"
            ."var m=document.cookie.match(/(?:^|; )sep_nav=([ab])/);"
            ."var v=m&&m[1];"
            ."if(!v){var a=new Uint8Array(1);crypto.getRandomValues(a);v=a[0]%2?'b':'a';"
            ."document.cookie='sep_nav='+v+';path=/;max-age=7776000;samesite=lax';}"
            ."document.documentElement.setAttribute('data-nav',v);"
            ."}catch(e){document.documentElement.setAttribute('data-nav','b');}})();"
        : "document.documentElement.setAttribute('data-nav','b');";
@endphp

<script>{!! $themeScript !!}</script>
<script>{!! $abScript !!}</script>
