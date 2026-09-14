{{--
    Google Analytics 4.

    Підключається лише коли GA_ID справді заданий — інакше сторонні
    джерела не потрапляють ні в розмітку, ні в CSP. anonymize_ip
    увімкнений: для рішень достатньо агрегатів, а повна IP-адреса
    відвідувача — це зобов'язання за GDPR, а не корисні дані.
--}}
<script async src="https://www.googletagmanager.com/gtag/js?id={{ $gaId }}"></script>
<script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', @json($gaId), { anonymize_ip: true });
</script>
