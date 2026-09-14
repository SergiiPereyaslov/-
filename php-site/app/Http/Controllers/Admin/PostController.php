<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Post;
use App\Services\CatalogCache;
use Illuminate\Contracts\View\View;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PostController extends Controller
{
    public function __construct(private readonly CatalogCache $cache) {}

    public function index(): View
    {
        return view('admin.posts.index', ['posts' => Post::newestFirst()->get()]);
    }

    public function create(): View
    {
        return view('admin.posts.edit', ['post' => new Post, 'isNew' => true]);
    }

    public function edit(string $slug): View
    {
        return view('admin.posts.edit', [
            'post' => Post::findOr($slug, fn () => abort(404)),
            'isNew' => false,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        return $this->save($request, null);
    }

    public function update(Request $request, string $slug): RedirectResponse
    {
        return $this->save($request, Post::findOr($slug, fn () => abort(404)));
    }

    public function destroy(string $slug): RedirectResponse
    {
        $post = Post::findOr($slug, fn () => abort(404));
        $post->delete();

        $this->cache->flush();

        return redirect('/admin/posts/')->with('status', __('admin.deleted'));
    }

    private function save(Request $request, ?Post $post): RedirectResponse
    {
        $data = $request->validate([
            'slug' => ['nullable', 'string', 'max:200', 'regex:/^[a-z0-9-]*$/'],
            'titleUk' => ['required', 'string', 'max:200'],
            'titleRu' => ['required', 'string', 'max:200'],
            'excerptUk' => ['required', 'string', 'max:1000'],
            'excerptRu' => ['required', 'string', 'max:1000'],
            'bodyUk' => ['nullable', 'string', 'max:60000'],
            'bodyRu' => ['nullable', 'string', 'max:60000'],
            'publishedAt' => ['nullable', 'date'],
            'related' => ['nullable', 'string', 'max:2000'],
        ]);

        $slug = $data['slug'] ?: Str::slug($data['titleUk']);

        $post ??= new Post(['slug' => $slug]);

        $post->fill([
            'titleUk' => $data['titleUk'],
            'titleRu' => $data['titleRu'],
            'excerptUk' => $data['excerptUk'],
            'excerptRu' => $data['excerptRu'],
            'body' => $this->paragraphs($data['bodyUk'] ?? '', $data['bodyRu'] ?? ''),
            'publishedAt' => $data['publishedAt'] ?? now(),
            'related' => array_values(array_filter(array_map(
                'trim',
                explode(',', (string) ($data['related'] ?? '')),
            ))),
            'published' => $request->boolean('published'),
        ]);

        $post->save();

        $this->cache->flush();

        return redirect("/admin/posts/{$post->slug}/")->with('status', __('admin.saved'));
    }

    /** @return list<array{uk: string, ru: string}> */
    private function paragraphs(string $uk, string $ru): array
    {
        $split = fn (string $text): array => array_values(array_filter(
            array_map('trim', preg_split('/\n{2,}/', $text) ?: []),
        ));

        $a = $split($uk);
        $b = $split($ru);

        return array_map(
            fn (string $text, int $i): array => ['uk' => $text, 'ru' => $b[$i] ?? $text],
            $a,
            array_keys($a),
        );
    }
}
