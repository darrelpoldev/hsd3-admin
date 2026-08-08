"use client";

import { useActionState } from "react";

import { deleteUser, type DeleteUserState } from "./actions";

const initialState: DeleteUserState = { error: null };

export function DeleteUserForm({ userId }: { userId: string }) {
  const [state, formAction, isPending] = useActionState(
    deleteUser,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col items-end gap-2">
      <input type="hidden" name="userId" value={userId} />

      {state.error ? (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="text-sm text-red-700 underline disabled:opacity-60"
      >
        Remove
      </button>
    </form>
  );
}
