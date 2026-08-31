"use client";

import { useEffect, useState } from "react";

type Theme = "dark" | "light";

const STORAGE_KEY = "escrow-theme";

function readStoredTheme(): Theme | null {
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return stored === "dark" || stored === "light" ? stored : null;
}

function systemPrefersDark(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches === true;
}

function resolveInitialTheme(): Theme {
  return readStoredTheme() ?? (systemPrefersDark() ? "dark" : "light");
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.dataset.theme = theme;
}

/**
 * `dark_mode_switcher` - app dark/light theme toggle.
 *
 * Rendered as a native `<button role="switch">` so it is keyboard operable
 * (Tab to focus, Enter/Space to toggle) and exposes its state to assistive
 * technology via `aria-checked`. The chosen theme is persisted to
 * `localStorage` and applied to the document root so it can be consumed by
 * CSS/tailwind `dark:` variants.
 *
 * Responsive sizing (#312): Adapts padding, gap, text size, and toggle
 * dimensions across mobile (default), tablet (sm), and desktop (lg) viewports.
 */
export default function DarkModeSwitcher() {
  const [theme, setTheme] = useState<Theme>(resolveInitialTheme);

  useEffect(() => {
    applyTheme(theme);
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const isDark = theme === "dark";
  const label = isDark ? "Switch to light mode" : "Switch to dark mode";

  const focusRing =
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-950 rounded";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={label}
      title={label}
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={`inline-flex items-center gap-1.5 sm:gap-2 bg-surface-card hover:bg-surface-field text-xs sm:text-sm text-text-primary px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg transition ${focusRing}`}
    >
      <span aria-hidden="true" className="text-sm sm:text-base leading-none">
        {isDark ? "ðŸŒ™" : "â˜€ï¸"}
      </span>
      <span className="sr-only">
        {label}
      </span>
      <span
        aria-hidden="true"
        className="relative inline-flex h-4 w-7 sm:h-5 sm:w-9 items-center rounded-full bg-border-strong transition"
      >
        <span
          className={`inline-block h-3 w-3 sm:h-4 sm:w-4 transform rounded-full bg-white transition ${
            isDark ? "translate-x-3.5 sm:translate-x-4" : "translate-x-0.5"
          }`}
        />
      </span>
    </button>
  );
}
