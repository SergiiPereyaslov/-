/**
 * Інлайн-скрипти, які мають виконатись до першого фарбування.
 *
 * Зібрані в одному модулі, щоб було одне місце, де видно весь код, що йде
 * в сторінку повз бандл. Модуль свідомо без JSX і без імпортів — його
 * підключають і серверні, і клієнтські компоненти.
 *
 * Історична примітка: спершу тут же рахувалися SHA-256 для CSP, але від
 * хешів довелося відмовитись — Next вставляє власні інлайн-скрипти з
 * RSC-payload, які наперед не захешуєш (див. коментар у next.config.ts).
 */

/** Тема з localStorage — до фарбування, інакше блимає світлим. */
export const themeScript = `(function(){try{var t=localStorage.getItem('sep-theme');if(t)document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`;

/** Варіант A/B-тесту навігації; вимкнений тест = усі бачать «b». */
export const abScriptFor = (enabled: boolean, cookie: string, attr: string, maxAge: number) =>
  enabled
    ? `(function(){try{
var m=document.cookie.match(/(?:^|; )${cookie}=([ab])/);
var v=m&&m[1];
if(!v){var a=new Uint8Array(1);crypto.getRandomValues(a);v=a[0]%2?'b':'a';
document.cookie='${cookie}='+v+';path=/;max-age=${maxAge};samesite=lax';}
document.documentElement.setAttribute('${attr}',v);
}catch(e){document.documentElement.setAttribute('${attr}','b');}})();`
    : `document.documentElement.setAttribute('${attr}','b');`;

/**
 * Ініціалізація GA4. Вставляється лише після згоди відвідувача, але хеш
 * потрібен на збірці: рядок детермінований, бо ID лічильника вшивається
 * у збірку зі змінної NEXT_PUBLIC_GA_ID.
 */
export const gaInitScript = (gaId: string) =>
  `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config','${gaId}',{anonymize_ip:true});`;
