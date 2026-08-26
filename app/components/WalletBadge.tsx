"use client";

import ButtonSpinner from "./ButtonSpinner";

export type WalletBadgeStatus =
  | "connected"
  | "disconnected"
  | "loading"
  | "error";

export interface WalletBadgeProps {
  address?: string | null;
  status?: WalletBadgeStatus;
  errorMessage?: string | null;
  onDisconnect?: () => void;
  /**
   * Makes the badge itself actionable (e.g. opens the wallet selector).
   * When provided the badge renders as a `<button>` with hover, focus-visible
   * and disabled styling; otherwise it stays a non-interactive `<span>`.
   */
  onClick?: () => void;
  /** Disables the badge action and the disconnect control. */
  disabled?: boolean;
  className?: string;
}

function truncateAddress(address: string): string {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

/** Shared shell: layout, typography and the always-on focus ring. */
const BADGE_BASE =
  "inline-flex items-center gap-2 text-sm font-mono px-3 py-1 rounded-full border transition-colors";

/**
 * Interactive affordances applied only when the badge is actionable.
 * `disabled:` variants win over the `hover:` variants because Tailwind emits
 * them later in the cascade, so a disabled badge stays visually inert.
 */
const BADGE_INTERACTIVE =
  "cursor-pointer hover:bg-surface-card hover:border-accent-soft " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent " +
  "focus-visible:ring-offset-2 focus-visible:ring-offset-surface-page " +
  "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-surface-field " +
  "disabled:hover:border-border-subtle";

/** Interactive states for the nested disconnect control. */
const DISCONNECT_BUTTON =
  "ml-1 rounded text-text-muted transition-colors " +
  "hover:text-danger-soft-hover hover:bg-danger/30 " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent " +
  "focus-visible:ring-offset-2 focus-visible:ring-offset-surface-page " +
  "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:text-text-muted " +
  "disabled:hover:bg-transparent";

const STATUS_CLASSES: Record<WalletBadgeStatus, string> = {
  connected: "text-text-primary bg-surface-field border-border-subtle",
  disconnected: "text-text-muted bg-surface-field border-border-subtle",
  loading: "text-text-muted bg-surface-field border-border-subtle",
  error: "text-danger-soft bg-surface-field border-danger",
};

/**
 * Displays a compact wallet status badge showing the connected address,
 * connection status, or an error message. Uses the repository's canonical
 * design tokens for all colors, spacing, and typography.
 */
export default function WalletBadge({
  address,
  status = "disconnected",
  errorMessage,
  onDisconnect,
  onClick,
  disabled = false,
  className = "",
}: WalletBadgeProps) {
  const resolvedStatus: WalletBadgeStatus =
    status === "connected" && !address ? "disconnected" : status;

  // The badge action is unavailable while a connection attempt is in flight.
  const interactive = !!onClick;
  const isDisabled = disabled || resolvedStatus === "loading";

  const shellClassName = [
    BADGE_BASE,
    STATUS_CLASSES[resolvedStatus],
    interactive ? BADGE_INTERACTIVE : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const contents = (() => {
    if (resolvedStatus === "loading") {
      return (
        <>
          <ButtonSpinner className="h-3.5 w-3.5" />
          <span>Connecting…</span>
        </>
      );
    }

    if (resolvedStatus === "error") {
      return (
        <>
          <span aria-hidden="true">⚠</span>
          <span>{errorMessage ?? "Wallet error"}</span>
        </>
      );
    }

    if (resolvedStatus === "connected" && address) {
      return (
        <>
          <span
            aria-hidden="true"
            className="h-2 w-2 rounded-full bg-success animate-pulse"
          />
          <span>{truncateAddress(address)}</span>
        </>
      );
    }

    return (
      <>
        <span
          aria-hidden="true"
          className="h-2 w-2 rounded-full bg-text-disabled"
        />
        <span>No wallet</span>
      </>
    );
  })();

  const sharedProps = {
    "data-testid": "wallet-badge",
    "data-status": resolvedStatus,
    "data-disabled": isDisabled ? "true" : "false",
    className: shellClassName,
    title: resolvedStatus === "error" ? errorMessage ?? undefined : undefined,
    "aria-label":
      resolvedStatus === "connected" && address
        ? `Connected wallet ${address}`
        : undefined,
  };

  const disconnectButton =
    resolvedStatus === "connected" && address && onDisconnect ? (
      <button
        type="button"
        onClick={onDisconnect}
        disabled={disabled}
        className={DISCONNECT_BUTTON}
        aria-label="Disconnect wallet"
      >
        ✕
      </button>
    ) : null;

  // An actionable badge is itself a `<button>`, so the disconnect control has
  // to sit beside it rather than inside it (buttons cannot nest).
  if (interactive) {
    return (
      <span className="inline-flex items-center gap-1">
        <button
          type="button"
          onClick={onClick}
          disabled={isDisabled}
          {...sharedProps}
        >
          {contents}
        </button>
        {disconnectButton}
      </span>
    );
  }

  return (
    <span {...sharedProps} aria-disabled={isDisabled ? true : undefined}>
      {contents}
      {disconnectButton}
    </span>
  );
}
