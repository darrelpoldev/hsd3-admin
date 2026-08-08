import { BrandStripe, Wordmark } from "@/app/brand";
import { ThemeToggle } from "@/app/theme-toggle";

import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center gap-6 px-4 py-10">
      <div className="flex items-start justify-between gap-3">
        <Wordmark />
        <ThemeToggle />
      </div>

      <BrandStripe />

      <h1 className="font-display text-2xl uppercase">Staff sign in</h1>

      <LoginForm />
    </main>
  );
}
