"use client";

import React from "react";

export interface WalletBadgeProps {
  /** The connected Stellar public address (e.g. GABC...1234) */
  address?: string | null;
  /** Whether a wallet connection attempt is actively in progress */
  isConnecting?: boolean;
  /** Explicit connection status override (defaults to `Boolean(address)`) */
  isConnected?: boolean;
  /** Display name of the active wallet provider (e.g. "Freighter", "Albedo") */
  providerName?: string;
  /** Network mismatch warning flag or message */
  networkMismatch?: boolean | string | null;
  /** Validation error message or flag highlighting invalid input configuration */
  error?: boolean | string | null;
  /** Field-specific error message or indicator */
  fieldError?: boolean | string | null;
  /** Alert message or flag to highlight input configurations/warnings */
  alert?: boolean | string | null;
  /** Explicit flag indicating whether the address configuration is invalid */
  invalidAddress?: boolean;
  /** Whether to validate the Stellar public key address format */
  validateAddress?: boolean;
  /** Whether to display the status indicator dot (defaults to true) */
  showStatusDot?: boolean;
  /** Optional list of connected accounts/addresses for empty list check */
  accounts?: string[] | null;
  /** Optional list of supported/available wallets for empty list check */
  wallets?: string[] | null;
  /** Optional list of generic data items for empty list check */
  items?: unknown[] | null;
  /** Custom text to display when in an empty data state */
  emptyText?: string;
  /** Custom placeholder node or element for empty data states */
  emptyPlaceholder?: React.ReactNode;
  /** Explicit flag forcing empty placeholder rendering */
  showEmptyPlaceholder?: boolean;
  /** Callback fired when disconnect action is triggered */
  onDisconnect?: () => void;
  /** Callback fired when badge is clicked */
  onClick?: () => void;
  /** Additional CSS class names */
  className?: string;
  /** Custom data-testid attribute (defaults to "wallet-badge") */
  "data-testid"?: string;
}

/** Utility helper to format a Stellar G-address into G...1234 format */
export function formatAddress(address: string, prefixLen = 4, suffixLen = 4): string {
  if (!address || address.length <= prefixLen + suffixLen) {
    return address || "";
  }
  return `${address.slice(0, prefixLen)}...${address.slice(-suffixLen)}`;
}

/** Utility helper to check if a Stellar public key (G-address) format is valid */
export function isValidStellarAddress(address?: string | null): boolean {
  if (!address) return false;
  return /^G[A-Za-z0-9]{55}$/.test(address);
}

/**
 * WalletBadge Component (`wallet_badge`)
 *
 * Header status indicator component representing the current wallet connection status,
 * active wallet provider, network alignment, address, field validation errors, alerts,
 * and descriptive placeholders for empty data states.
 */
export default function WalletBadge({
  address,
  isConnecting = false,
  isConnected,
  providerName,
  networkMismatch,
  error,
  fieldError,
  alert,
  invalidAddress = false,
  validateAddress = false,
  showStatusDot = true,
  accounts,
  wallets,
  items,
  emptyText,
  emptyPlaceholder,
  showEmptyPlaceholder = false,
  onDisconnect,
  onClick,
  className = "",
  "data-testid": testId = "wallet-badge",
}: WalletBadgeProps) {
  const activeConnected = isConnected !== undefined ? isConnected : Boolean(address);
  const hasMismatch = Boolean(networkMismatch);

  // Empty list data state checks
  const emptyAccountsList = Array.isArray(accounts) && accounts.length === 0;
  const emptyWalletsList = Array.isArray(wallets) && wallets.length === 0;
  const emptyItemsList = Array.isArray(items) && items.length === 0;
  const hasEmptyListState = emptyAccountsList || emptyWalletsList || emptyItemsList;

  // Address check for empty or whitespace strings
  const isEmptyAddressString = typeof address === "string" && address.trim() === "";
  const addressIsEmpty = !address || isEmptyAddressString;

  const hasExplicitEmptyProp =
    showEmptyPlaceholder ||
    hasEmptyListState ||
    emptyText !== undefined ||
    emptyPlaceholder !== undefined;

  // Consolidated empty data state flag
  const isEmptyDataState = hasExplicitEmptyProp || isEmptyAddressString;

  // Address validation check
  const addressFormatInvalid =
    invalidAddress || (validateAddress && address ? !isValidStellarAddress(address) : false);

  // Derive consolidated validation error and alert text
  const combinedError = error || fieldError || (addressFormatInvalid ? "Invalid Stellar address" : null);
  const hasError = Boolean(combinedError);
  const errorMessage =
    typeof combinedError === "string"
      ? combinedError
      : combinedError
      ? "Invalid wallet configuration"
      : null;

  const hasAlert = Boolean(alert);
  const alertMessage =
    typeof alert === "string" ? alert : alert ? "Configuration alert" : null;

  // Empty state list label resolution
  const emptyListLabel = emptyAccountsList
    ? "No active accounts"
    : emptyWalletsList
    ? "No wallets available"
    : emptyItemsList
    ? "No items available"
    : "Empty data state";

  // Status label & ARIA label derivation
  let statusText = emptyText || "Not Connected";
  let statusState: "connected" | "connecting" | "mismatch" | "error" | "alert" | "disconnected" =
    "disconnected";

  if (isConnecting) {
    statusText = "Connecting...";
    statusState = "connecting";
  } else if (hasError) {
    statusText = address && !addressIsEmpty ? formatAddress(address) : errorMessage || "Invalid Configuration";
    statusState = "error";
  } else if (hasMismatch) {
    statusText = address && !addressIsEmpty ? formatAddress(address) : "Network Mismatch";
    statusState = "mismatch";
  } else if (hasAlert) {
    statusText = address && !addressIsEmpty ? formatAddress(address) : alertMessage || "Alert";
    statusState = "alert";
  } else if (activeConnected && address && !addressIsEmpty) {
    statusText = formatAddress(address);
    statusState = "connected";
  }

  const ariaLabel =
    statusState === "error"
      ? `Wallet validation error: ${errorMessage || "Invalid configuration"} ${address || ""}`.trim()
      : statusState === "alert"
      ? `Wallet alert: ${alertMessage || "Alert"} ${address || ""}`.trim()
      : statusState === "connected"
      ? `Connected wallet ${address}`
      : statusState === "connecting"
      ? "Wallet connecting"
      : statusState === "mismatch"
      ? `Wallet network mismatch ${address || ""}`.trim()
      : isEmptyDataState
      ? `Wallet placeholder state: ${emptyText || emptyListLabel || "Not connected"}`
      : "Wallet not connected";

  // Dot color classes matching design system
  const dotClasses = {
    connected: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]",
    connecting: "bg-amber-400 animate-pulse",
    mismatch: "bg-rose-400 animate-ping",
    error: "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)] animate-pulse",
    alert: "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]",
    disconnected: "bg-gray-500",
  }[statusState];

  // Container border and background theme
  const borderBgClasses = hasError
    ? "border-red-500/50 bg-red-950/40 text-red-200 hover:border-red-400"
    : hasAlert
    ? "border-amber-500/50 bg-amber-950/40 text-amber-200 hover:border-amber-400"
    : isEmptyDataState
    ? "border-gray-700/60 border-dashed bg-gray-900/60 text-gray-400 hover:border-gray-600"
    : "border-gray-800 bg-gray-900/90 text-gray-200 hover:border-gray-700";

  const content = (
    /* eslint-disable-next-line jsx-a11y/role-supports-aria-props */
    <div
      data-testid={testId}
      data-empty-state={isEmptyDataState ? "true" : undefined}
      role="status"
      aria-label={ariaLabel}
      aria-invalid={hasError ? true : undefined}
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-mono shadow-sm transition-all duration-150 ${borderBgClasses} ${
        onClick ? "cursor-pointer hover:bg-gray-800/80" : ""
      } ${className}`}
    >
      {showStatusDot && (
        <span
          data-testid="wallet-status-dot"
          data-status={statusState}
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

      {/* Empty data state custom node override */}
      {isEmptyDataState && emptyPlaceholder ? (
        <div data-testid="wallet-badge-placeholder-custom">{emptyPlaceholder}</div>
      ) : (
        <>
          <span
            data-testid="wallet-address-text"
            className={`tracking-wide ${isEmptyDataState && addressIsEmpty ? "italic text-gray-400" : ""}`}
          >
            {statusText}
          </span>

          {/* Empty list placeholder tag */}
          {hasEmptyListState && (
            <span
              data-testid="wallet-empty-list-placeholder"
              className="text-xs font-sans text-amber-300/80 bg-amber-950/40 border border-amber-800/40 px-1.5 py-0.5 rounded"
            >
              {emptyText || emptyListLabel}
            </span>
          )}

          {/* Descriptive badge placeholder element for empty data states */}
          {isEmptyDataState && (
            <span
              data-testid="wallet-badge-placeholder"
              className="text-xs font-sans text-gray-400/90 bg-gray-800/50 border border-gray-700/50 px-1.5 py-0.5 rounded font-normal"
            >
              {emptyText || "Empty"}
            </span>
          )}
        </>
      )}

      {/* Field error indicator & text message toggle */}
      {hasError && (
        <span
          data-testid="wallet-field-error"
          role="alert"
          aria-live="polite"
          className="inline-flex items-center gap-1 text-xs font-sans text-red-400 bg-red-950/80 border border-red-800/60 px-2 py-0.5 rounded font-medium"
        >
          <span aria-hidden="true" className="font-bold">
            ⚠
          </span>
          <span data-testid="wallet-error-text">{errorMessage || "Invalid configuration"}</span>
        </span>
      )}

      {/* Alert indicator & text message toggle */}
      {!hasError && hasAlert && (
        <span
          data-testid="wallet-alert-badge"
          role="status"
          aria-live="polite"
          className="inline-flex items-center gap-1 text-xs font-sans text-amber-400 bg-amber-950/80 border border-amber-800/60 px-2 py-0.5 rounded font-medium"
        >
          <span data-testid="wallet-alert-text">{alertMessage || "Alert"}</span>
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

  return content;
}


