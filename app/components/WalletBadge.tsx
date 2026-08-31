"use client";

import React from "react";
import ButtonSpinner from "./ButtonSpinner";

export type WalletBadgeStatus =
  | "connected"
  | "disconnected"
  | "loading"
  | "error";

/**
 * Two prop shapes reached this component from separate pieces of work and both
 * are still in use: `Navbar` drives it with `isConnecting` / `providerName` /
 * `networkMismatch`, while the design-token call sites drive it with an
 * explicit `status`. Rather than break either caller, the props are the union
 * of both and `status` selects which rendering applies.
 */
export interface WalletBadgeProps {
  /** The connected Stellar public address (e.g. GABC...1234) */
  address?: string | null;

  // --- Explicit-status form (design-token call sites) ---
  /** Explicit badge status. Supplying this selects the design-token rendering. */
  status?: WalletBadgeStatus;
  /** Message shown in the error state. */
  errorMessage?: string | null;

  // --- Derived-status form (Navbar) ---
  /** Whether a wallet connection attempt is actively in progress */
  isConnecting?: boolean;
  /** Explicit connection status override (defaults to `Boolean(address)`) */
  isConnected?: boolean;
  /** Display name of the active wallet provider (e.g. "Freighter", "Albedo") */
  providerName?: string;
  /** Network mismatch warning flag or message */
  networkMismatch?: boolean | string | null;
  /** Whether to display the status indicator dot (defaults to true) */
  showStatusDot?: boolean;
  /** Callback fired when badge is clicked */
  onClick?: () => void;

  // --- Validation / alert surfaces (derived-status form) ---
  /** Field-level error message. Takes precedence over `alert`. */
  error?: string | null;
  /** Alias of `error`. */
  fieldError?: string | null;
  /** Check `address` against the Stellar address format and flag it if invalid. */
  validateAddress?: boolean;
  /** Force the invalid-address state regardless of `validateAddress`. */
  invalidAddress?: boolean;
  /** Non-blocking advisory message, shown when there is no error. */
  alert?: string | null;

  // --- Empty-state placeholders (derived-status form) ---
  /** Copy used for the placeholder and the empty address slot. */
  emptyText?: string;
  /** Custom node rendered in place of the default placeholder tag. */
  emptyPlaceholder?: React.ReactNode;
  /** Force the placeholder on even when an address is present. */
  showEmptyPlaceholder?: boolean;
  /** Empty array renders a "No active accounts" placeholder. */
  accounts?: unknown[];
  /** Empty array renders a "No wallets available" placeholder. */
  wallets?: unknown[];
  /** Empty array renders a "No items available" placeholder. */
  items?: unknown[];

  // --- Shared ---
  /** Callback fired when disconnect action is triggered */
  onDisconnect?: () => void;
  /** Additional CSS class names */
  className?: string;
  /** Custom data-testid attribute (defaults to "wallet-badge") */
  "data-testid"?: string;
}

/** Truncate an address to `GABC...1234`, honouring custom affix lengths. */
export function formatAddress(address: string, prefixLen = 4, suffixLen = 4): string {
  if (!address || address.length <= prefixLen + suffixLen) {
    return address || "";
  }
  return `${address.slice(0, prefixLen)}...${address.slice(-suffixLen)}`;
}

/**
 * Shape check for a Stellar public address: `G` followed by 55 base32
 * characters (A–Z and 2–7). Format only — it does not verify the checksum.
 */
export function isValidStellarAddress(address?: string | null): boolean {
  if (!address) return false;
  return /^G[A-Z2-7]{55}$/.test(address);
}

/**
 * WalletBadge Component (`wallet_badge`)
 *
 * Header status indicator representing the current wallet connection status,
 * active wallet provider, network alignment, and address.
 */
export default function WalletBadge({
  address,
  status,
  errorMessage,
  isConnecting = false,
  isConnected,
  providerName,
  networkMismatch,
  showStatusDot = true,
  error,
  fieldError,
  validateAddress = false,
  invalidAddress = false,
  alert,
  emptyText,
  emptyPlaceholder,
  showEmptyPlaceholder = false,
  accounts,
  wallets,
  items,
  onDisconnect,
  onClick,
  className = "",
  "data-testid": testId = "wallet-badge",
}: WalletBadgeProps) {
  // ---------------------------------------------------------------------
  // Explicit-status rendering (design tokens)
  // ---------------------------------------------------------------------
  if (status !== undefined) {
    if (status === "loading") {
      return (
        <span
          data-testid={testId}
          data-status="loading"
          className={`inline-flex items-center gap-2 text-sm font-mono text-text-muted bg-surface-field border border-border-subtle px-3 py-1 rounded-full ${className}`}
        >
          <ButtonSpinner className="h-3.5 w-3.5" />
          <span>Connecting…</span>
        </span>
      );
    }

    if (status === "error") {
      return (
        <span
          data-testid={testId}
          data-status="error"
          className={`inline-flex items-center gap-2 text-sm font-mono text-danger-soft bg-surface-field border border-danger px-3 py-1 rounded-full ${className}`}
          title={errorMessage ?? undefined}
        >
          <span aria-hidden="true">⚠</span>
          <span>{errorMessage ?? "Wallet error"}</span>
        </span>
      );
    }

    if (status === "connected" && address) {
      return (
        <span
          data-testid={testId}
          data-status="connected"
          className={`inline-flex items-center gap-2 text-sm font-mono text-text-primary bg-surface-field border border-border-subtle px-3 py-1 rounded-full ${className}`}
          aria-label={`Connected wallet ${address}`}
        >
          <span
            aria-hidden="true"
            className="h-2 w-2 rounded-full bg-success animate-pulse"
          />
          <span>{formatAddress(address)}</span>
          {onDisconnect && (
            <button
              onClick={onDisconnect}
              className="ml-1 text-text-muted hover:text-danger-soft transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-page rounded"
              aria-label="Disconnect wallet"
            >
              ✕
            </button>
          )}
        </span>
      );
    }

    return (
      <span
        data-testid={testId}
        data-status="disconnected"
        className={`inline-flex items-center gap-2 text-sm font-mono text-text-muted bg-surface-field border border-border-subtle px-3 py-1 rounded-full ${className}`}
      >
        <span aria-hidden="true" className="h-2 w-2 rounded-full bg-text-disabled" />
        <span>No wallet</span>
      </span>
    );
  }

  // ---------------------------------------------------------------------
  // Derived-status rendering (Navbar)
  // ---------------------------------------------------------------------
  const activeConnected = isConnected !== undefined ? isConnected : Boolean(address);
  const hasMismatch = Boolean(networkMismatch);

  let statusText = "Not Connected";
  let statusState: "connected" | "connecting" | "mismatch" | "disconnected" =
    "disconnected";

  if (isConnecting) {
    statusText = "Connecting...";
    statusState = "connecting";
  } else if (hasMismatch) {
    statusText = address ? formatAddress(address) : "Network Mismatch";
    statusState = "mismatch";
  } else if (activeConnected && address) {
    statusText = formatAddress(address);
    statusState = "connected";
  }

  // Error takes precedence over the advisory alert, which in turn overrides
  // the plain connection status on the dot.
  const formatInvalid =
    invalidAddress || (validateAddress && !isValidStellarAddress(address));
  const errorText =
    error ?? fieldError ?? (formatInvalid ? "Invalid Stellar address" : null);
  const alertText = errorText ? null : (alert ?? null);

  // An empty address, an explicitly emptied list, or the caller forcing it.
  const emptyList =
    (accounts && accounts.length === 0) ||
    (wallets && wallets.length === 0) ||
    (items && items.length === 0);
  // A present-but-blank address is an empty state; a missing one is just the
  // ordinary disconnected badge, unless the caller supplied placeholder copy.
  const blankAddress = typeof address === "string" && address.trim() === "";
  const missingAddress = address == null;
  const isEmptyState = Boolean(
    showEmptyPlaceholder ||
      emptyList ||
      blankAddress ||
      (missingAddress && (emptyText || emptyPlaceholder)),
  );
  const placeholderText = emptyText ?? "Not Connected";
  const emptyListText =
    emptyText ??
    (accounts && accounts.length === 0
      ? "No active accounts"
      : wallets && wallets.length === 0
        ? "No wallets available"
        : "No items available");

  if (isEmptyState && (blankAddress || missingAddress) && !isConnecting) {
    statusText = placeholderText;
  }

  const ariaLabel = isEmptyState
    ? `Wallet placeholder state: ${emptyText ?? placeholderText}`
    : statusState === "connected"
      ? `Connected wallet ${address}`
      : statusState === "connecting"
        ? "Wallet connecting"
        : statusState === "mismatch"
          ? `Wallet network mismatch ${address || ""}`.trim()
          : "Wallet not connected";

  const dotState = errorText ? "error" : alertText ? "alert" : statusState;

  const dotClasses = {
    connected: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]",
    connecting: "bg-amber-400 animate-pulse",
    mismatch: "bg-rose-400 animate-ping",
    disconnected: "bg-gray-500",
    error: "bg-red-500",
    alert: "bg-amber-500",
  }[dotState];

  // `data-status` is mirrored onto the badge as well as the dot so callers that
  // read it off the badge itself keep working in this form too.
  const badgeStatus = statusState === "connecting" ? "loading" : statusState;

  return (
    <div
      data-testid={testId}
      data-status={badgeStatus}
      data-empty-state={isEmptyState ? "true" : undefined}
      role="status"
      aria-label={ariaLabel}
      aria-invalid={errorText ? "true" : undefined}
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full border border-gray-800 bg-gray-900/90 px-3 py-1 text-sm font-mono text-gray-200 shadow-sm transition-all duration-150 hover:border-gray-700 ${
        onClick ? "cursor-pointer hover:bg-gray-800/80" : ""
      } ${className}`}
    >
      {showStatusDot && (
        <span
          data-testid="wallet-status-dot"
          data-status={dotState}
          className={`h-2 w-2 rounded-full transition-colors ${dotClasses}`}
          aria-hidden="true"
        />
      )}

      {providerName && (
        <span
          data-testid="wallet-provider-tag"
          className="text-xs font-sans text-gray-400 bg-gray-800/70 px-1.5 py-0.5 rounded"
        >
          {providerName}
        </span>
      )}

      <span
        data-testid="wallet-address-text"
        className={`tracking-wide${
          isEmptyState && (blankAddress || missingAddress) ? " italic" : ""
        }`}
      >
        {statusText}
      </span>

      {isEmptyState &&
        (emptyPlaceholder ? (
          <div data-testid="wallet-badge-placeholder-custom">
            {emptyPlaceholder}
          </div>
        ) : emptyList ? (
          <span
            data-testid="wallet-empty-list-placeholder"
            className="text-xs font-sans text-gray-500 bg-gray-800/70 px-1.5 py-0.5 rounded"
          >
            {emptyListText}
          </span>
        ) : (
          <span
            data-testid="wallet-badge-placeholder"
            className="text-xs font-sans text-gray-500 bg-gray-800/70 px-1.5 py-0.5 rounded"
          >
            {emptyText ?? "Empty"}
          </span>
        ))}

      {errorText && (
        <span
          data-testid="wallet-field-error"
          role="alert"
          className="inline-flex items-center gap-1 text-xs font-sans text-red-400"
        >
          <span data-testid="wallet-error-text">{errorText}</span>
        </span>
      )}

      {alertText && (
        <span
          data-testid="wallet-alert-badge"
          className="inline-flex items-center gap-1 text-xs font-sans text-amber-400"
        >
          <span data-testid="wallet-alert-text">{alertText}</span>
        </span>
      )}

      {activeConnected && onDisconnect && (
        <button
          type="button"
          data-testid="wallet-disconnect-btn"
          onClick={(e) => {
            e.stopPropagation();
            onDisconnect();
          }}
          aria-label="Disconnect wallet"
          className="ml-1 text-xs font-sans text-gray-400 hover:text-rose-400 focus:outline-none focus:text-rose-400 transition-colors"
        >
          ✕
        </button>
      )}
    </div>
  );
}
