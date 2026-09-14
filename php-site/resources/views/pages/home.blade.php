@extends('layouts.site')

@section('title', 'SmartEcoPack — паперова упаковка оптом')
@section('description', 'Паперова упаковка для кав’ярень, доставки та фастфуду. Опт від 10 пачок.')

@section('content')
    <div class="container-page py-10">
        <h1 class="text-3xl">Каркас працює</h1>
        <p class="mt-3 text-muted">Локаль: {{ app()->getLocale() }}</p>
    </div>
@endsection
