{{--
    Розмітка schema.org одним компонентом.

    Єдине місце в проєкті, де JSON потрапляє в розмітку скриптом, тому
    екранування живе в одному місці, а не в кожного, хто малює JSON-LD.
    Чому самого json_encode не досить — див. Format::jsonLd().
--}}
<script type="application/ld+json">{!! \App\Support\Format::jsonLd($data) !!}</script>
