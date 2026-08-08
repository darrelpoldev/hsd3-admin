"use client";

import { useActionState } from "react";

import { logIn, type LoginState } from "./actions";

const initialState: LoginState = { error: null };

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(logIn, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Username</span>
        <input
          name="username"
          autoComplete="username"
          autoCapitalize="none"
          required
          className="rounded-lg border border-line-strong px-3 py-3 text-base"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Password</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="rounded-lg border border-line-strong px-3 py-3 text-base"
        />
      </label>

      {state.error ? (
        <p className="rounded-lg bg-danger-bg px-3 py-2 text-sm text-danger-ink">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-accent px-4 py-3 text-base font-medium text-accent-ink disabled:opacity-60"
      >
        {isPending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
