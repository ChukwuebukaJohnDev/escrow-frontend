"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";

// --------------------------------------------------------------------
// Types
// --------------------------------------------------------------------

export type WalletAvailabilityStatus =
  | "checking"
  | "available"
  | "unavailable"
  | "error";

export interface WalletStateContextValue {
  /** Current availability status of the Freighter extension. */
  availabilityStatus: WalletAvailabilityStatus;
  /** True while the availability check is in progress. */
  isChecking: boolean;
  /** True when the Freighter extension is confirmed to be installed. */
  isAvailable: boolean;
  /**
   * Human-readable setup instruction shown to the user when the wallet
   * extension is not detected. Null when no instruction is needed.
   */
  setupInstruction: string | null;
  /** Re-runs the availability check (e.g., after the user installs the extension). */
  recheckAvailability: () => void;
  /** True while a transaction signing operation is in progress. */
  isTransactionPending: boolean;
  /** Updates the transaction pending state. */
  setTransactionPending: (pending: boolean) => void;
}

// --------------------------------------------------------------------
// Setup instruction copy
// --------------------------------------------------------------------

export const FREIGHTER_INSTALL_URL =
  "https://www.freighter.app/";

export const FREIGHTER_SETUP_INSTRUCTION =
  "Freighter wallet extension not found. " +
  "Install Freighter from freighter.app and refresh this page to continue.";

// --------------------------------------------------------------------
// Availability detection
// --------------------------------------------------------------------

/**
 * Detects whether the Freighter browser extension is installed by inspecting
 * window.freighterApi. Works in SSR-safe environments by checking for a
 * window global first.
 */
export function detectFreighterExtension(): boolean {
  if (typeof window === "undefined") return false;
  // Freighter injects window.freighterApi when its extension is active.
  return !!(
    (window as unknown as Record<string, unknown>)["freighterApi"]
  );
}

// --------------------------------------------------------------------
// Context
// --------------------------------------------------------------------

const defaultValue: WalletStateContextValue = {
  availabilityStatus: "checking",
  isChecking: true,
  isAvailable: false,
  setupInstruction: null,
  recheckAvailability: () => {},
  isTransactionPending: false,
  setTransactionPending: () => {},
};

const WalletStateContext =
  createContext<WalletStateContextValue>Y\