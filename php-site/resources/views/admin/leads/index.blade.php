@extends('admin.layout')
@section('title', __('admin.nav.leads'))

@section('content')
<h1 class="font-display text-2xl font-bold">{{ __('admin.nav.leads') }}</h1>

<div class="mt-4 flex flex-wrap gap-2">
    <a href="/admin/leads/" class="chip {{ $status ? '' : 'border-primary text-primary' }}">Усі</a>
    @foreach (\App\Models\Lead::STATUSES as $value)
        <a href="/admin/leads/?status={{ $value }}"
           class="chip {{ $status === $value ? 'border-primary text-primary' : '' }}">{{ $value }}</a>
    @endforeach
</div>

@include('admin.leads._table')

<div class="mt-4">{{ $leads->links() }}</div>
@endsection
