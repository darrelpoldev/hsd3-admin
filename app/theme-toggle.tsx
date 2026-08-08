"use client";

function prefersDark(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function ThemeToggle() {
  function toggleTheme() {
    const root = document.documentElement;
    const chosen = root.getAttribute("data-theme");
    const isDark = chosen ? chosen === "dark" : prefersDark();
    const next = isDark ? "light" : "dark";

    root.setAttribute("data-theme", next);

    try {
      localStorage.setItem("theme", next);
    } catch {
      root.setAttribute("data-theme", next);
    }
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Switch between light and dark theme"
      className="rounded-lg border border-line-strong px-3 py-2 text-sm text-muted"
    >
      <span className="when-light">Dark</span>
      <span className="when-dark">Light</span>
    </button>
  );
}
