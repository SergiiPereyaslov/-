'use client';

import { useActionState } from 'react';
import { login, type LoginState } from './actions';

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});

  return (
    <form action={action} className="mt-5 space-y-4">
      <div>
        <label htmlFor="email" className="mb-1 block text-sm font-medium">
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          className="field"
          autoComplete="username"
          defaultValue={state.email ?? ''}
          required
        />
      </div>
      <div>
        <label htmlFor="password" className="mb-1 block text-sm font-medium">
          Пароль
        </label>
        <input
          id="password"
          name="password"
          type="password"
          className="field"
          autoComplete="current-password"
          required
        />
      </div>
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      <button type="submit" className="btn btn-primary w-full" disabled={pending}>
        {pending ? 'Входимо…' : 'Увійти'}
      </button>
    </form>
  );
}
