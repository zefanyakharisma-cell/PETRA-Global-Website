'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useSearchParams } from 'next/navigation';
import { signIn } from '../actions/auth';

export default function LoginPage() {
  const [state, action] = useFormState(signIn, {} as { error?: string });
  const next = useSearchParams().get('next') ?? '/admin';

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy px-4">
      <form action={action} className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl">
        <p className="font-display text-3xl text-navy">PCU·IO Admin</p>
        <p className="mt-1 text-sm text-ink/60">Sign in to manage the site.</p>
        <input type="hidden" name="next" value={next} />

        <label className="mt-6 block text-sm font-medium text-ink/70">Email</label>
        <input name="email" type="email" required className="mt-1 w-full rounded-md border border-ink/20 px-3 py-2" />

        <label className="mt-4 block text-sm font-medium text-ink/70">Password</label>
        <input name="password" type="password" required className="mt-1 w-full rounded-md border border-ink/20 px-3 py-2" />

        {state.error && <p className="mt-3 text-sm text-magenta">{state.error}</p>}

        <SubmitButton />
      </form>
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-6 w-full rounded-md bg-magenta py-2.5 font-condensed text-lg uppercase tracking-wide text-white disabled:opacity-60"
    >
      {pending ? 'Signing in…' : 'Sign in'}
    </button>
  );
}
