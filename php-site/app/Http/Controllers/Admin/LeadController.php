<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use Illuminate\Contracts\View\View;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class LeadController extends Controller
{
    public function index(Request $request): View
    {
        $status = $request->query('status');

        $leads = Lead::query()
            ->when(in_array($status, Lead::STATUSES, true), fn ($q) => $q->where('status', $status))
            ->newestFirst()
            ->paginate(config('admin.per_page'))
            ->withQueryString();

        return view('admin.leads.index', ['leads' => $leads, 'status' => $status]);
    }

    public function show(string $id): View
    {
        return view('admin.leads.show', ['lead' => Lead::findOr($id, fn () => abort(404))]);
    }

    /**
     * Менеджер міняє стан заявки й лишає нотатку.
     *
     * Решта полів — те, що написав клієнт, і редагуванню не підлягає:
     * заявка має лишатись свідченням того, що саме він надіслав.
     */
    public function update(Request $request, string $id): RedirectResponse
    {
        $lead = Lead::findOr($id, fn () => abort(404));

        $data = $request->validate([
            'status' => ['required', 'string', 'in:'.implode(',', Lead::STATUSES)],
            'managerNote' => ['nullable', 'string', 'max:4000'],
        ]);

        $lead->update($data);

        return redirect("/admin/leads/{$lead->id}/")->with('status', __('admin.saved'));
    }
}
