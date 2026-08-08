import { ThemeToggle } from "@/app/theme-toggle";

import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center gap-6 px-4 py-10">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Staff sign in</h1>
        <ThemeToggle />
      </div>
      <LoginForm />
    </main>
  );
}
