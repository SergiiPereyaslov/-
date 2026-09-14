@props(['paragraphs', 'class' => ''])

{{--
    Текстовий блок із простою розміткою: абзац, що починається з «## »,
    стає підзаголовком. Формат обрано навмисно — редактор в адмінці пише
    звичайним текстом, без HTML і без окремого редактора.
--}}
@if (count($paragraphs))
    <div class="prose-uk {{ $class }}">
        @foreach ($paragraphs as $text)
            @if (str_starts_with($text, '## '))
                <h2>{{ substr($text, 3) }}</h2>
            @else
                <p>{{ $text }}</p>
            @endif
        @endforeach
    </div>
@endif
