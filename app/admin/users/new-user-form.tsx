"use client";

import { useActionState } from "react";

import { createUser, type NewUserState } from "./actions";

const initialState: NewUserState = {
  error: null,
  createdUsername: null,
  generatedPassword: null,
};

export function NewUserForm() {
  const [state, formAction, isPending] = useActionState(
    createUser,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Username</span>
        <input
          name="username"
          autoCapitalize="none"
          required
          className="rounded-lg border border-slate-300 px-3 py-3 text-base"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Role</span>
        <select
          name="role"
          defaultValue="staff"
          className="rounded-lg border border-slate-300 px-3 py-3 text-base"
        >
          <option value="staff">Staff — bookings only</option>
          <option value="admin">Admin — bookings and settings</option>
        </select>
      </label>

      {state.error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}

      {state.generatedPassword ? (
        <div className="rounded-lg bg-green-50 px-3 py-3 text-sm text-green-900">
          <p className="font-medium">
            Password for {state.createdUsername}, shown once:
          </p>
          <p className="mt-1 font-mono text-base break-all">
            {state.generatedPassword}
          </p>
          <p className="mt-1">Write it down before leaving this page.</p>
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-slate-900 px-4 py-3 text-base font-medium text-white disabled:opacity-60"
      >
        Create user
      </button>
    </form>
  );
}
