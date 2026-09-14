<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AbStat;
use App\Models\Category;
use App\Models\Lead;
use App\Models\Post;
use App\Models\Product;
use Illuminate\Contracts\View\View;

class DashboardController extends Controller
{
    public function __invoke(): View
    {
        return view('admin.dashboard', [
            'counts' => [
                'new' => Lead::withStatus('new')->count(),
                'leads' => Lead::count(),
                'products' => Product::count(),
                'categories' => Category::count(),
                'posts' => Post::count(),
            ],
            'recent' => Lead::newestFirst()->limit(10)->get(),
            /*
             * Заявки, які не вдалось доставити менеджеру. Показуються
             * окремо й першими: така заявка вже в базі, але про неї
             * ніхто не знає, і саме її можна втратити.
             */
            'undelivered' => Lead::query()
                ->where('notified', false)
                ->whereNotNull('notifyError')
                ->newestFirst()
                ->limit(5)
                ->get(),
            'abEnabled' => (bool) config('site.ab_enabled'),
            'ab' => AbStat::query()->orderByDesc('day')->limit(14)->get(),
        ]);
    }
}
