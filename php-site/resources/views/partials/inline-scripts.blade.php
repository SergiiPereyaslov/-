@php use App\Http\Middleware\InlineScripts; @endphp

{{--
    Рядки беруться з того самого класу, з якого CSP рахує хеші. Тримати
    їх окремо не можна: розбіжність в один пробіл — і браузер мовчки
    заблокує скрипт, а тема почне блимати світлим на кожному
    завантаженні.
--}}
<script>{!! InlineScripts::theme() !!}</script>
<script>{!! InlineScripts::abVariant() !!}</script>
