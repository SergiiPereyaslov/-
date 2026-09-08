'use client';

import { useActionState } from 'react';
import { runImport, type ImportState } from './actions';

export function ImportForm() {
  const [state, action, pending] = useActionState<ImportState, FormData>(runImport, {
    status: 'idle',
  });

  return (
    <>
      <form action={action} className="card mt-5 space-y-4 p-5">
        <div>
          <label htmlFor="file" className="mb-1 block text-sm font-medium">
            Файл CSV
          </label>
          <input
            id="file"
            name="file"
            type="file"
            accept=".csv,text/csv"
            required
            className="field !h-auto !py-2"
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={pending}>
          {pending ? 'Імпортуємо…' : 'Завантажити'}
        </button>
      </form>

      {state.status === 'ok' && (
        <div className="mt-4 rounded-md border border-primary/40 bg-primary/5 px-4 py-3 text-sm">
          <p className="font-medium text-primary">{state.message}</p>
          {state.emptyCategories && state.emptyCategories.length > 0 && (
            <p className="mt-2 text-muted">
              Категорії без жодного товару ({state.emptyCategories.length}):{' '}
              {state.emptyCategories.join(', ')}. Такі сторінки будуть порожні.
            </p>
          )}
          {state.warnings && state.warnings.length > 0 && (
            <div className="mt-3 border-t border-border pt-3">
              <p className="font-medium">
                Товарів без слага у файлі: {state.warnings.length}. Слаг згенеровано з
                назви — старі посилання на ці товари віддадуть 404.
              </p>
              <ul className="mt-2 max-h-56 space-y-0.5 overflow-y-auto font-mono text-xs text-muted">
                {state.warnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {state.status === 'error' && (
        <div className="mt-4 rounded-md border border-danger/40 bg-danger/5 px-4 py-3 text-sm">
          <p className="font-medium text-danger">{state.message}</p>
          {state.errors && (
            <ul className="mt-2 max-h-72 space-y-0.5 overflow-y-auto font-mono text-xs text-muted">
              {state.errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </>
  );
}
