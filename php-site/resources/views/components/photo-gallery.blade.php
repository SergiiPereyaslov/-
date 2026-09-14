@props(['photos', 'title'])

{{--
    Реальні фото зі складу.

    Не прив'язані до конкретних артикулів, тому й не стоять у картці
    товару: це візуальний доказ, що товар справді є, а не ілюстрація
    конкретної позиції.
--}}
@if (count($photos))
    <section class="mt-12">
        <h2 class="text-xl">{{ $title }}</h2>
        <div class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            @foreach ($photos as $photo)
                <img src="{{ $photo }}" alt="{{ $title }}" loading="lazy" decoding="async"
                     width="400" height="400"
                     class="aspect-square w-full rounded-md border border-border object-cover">
            @endforeach
        </div>
    </section>
@endif
