/**
 * wallet_disconnect_handler — Helpers for safe wallet disconnection with
 * wallet-extension availability checks.
 *
 * Before attempting to disconnect, the handler checks whether the wallet
 * extension is actually installed.  If the extension is missing (e.g. the
 * user uninstalled it while connected), a helpful setup instruction is
 * displayed instead of a cryptic runtime error.
 *
 * Mirrors the conventions established by `app/lib/freighter_connector.ts`
 * and `app/lib/wallet_state_context.ts`.
 */

const LOG_PREFIX = "[wallet_disconnect_handler]";

// =============================================================
// Wallet availability detection
// =============================================================

/** Global window keys injected by each wallet extension. */
const WALLET_GLOBALS: Record<string, string[]> = {
  freighter: ["freighterApi", "freighter"],
  albedo: ["albedo", "albedoApi"],
  xbull: ["xBullSDK", "x bull"],
  hana: ["hanaWallet", "hana"],
};

export interface WalletAvailabilityResult {
  /** `true` when at least one of the extension's globals is present. */
  available: boolean;
  /** Human-readable setup instruction shown when the wallet is missing. */
  setupInstruction: string | null;
  /** Install URL for the missing wallet, if known. */
  installUrl: string | null;
}

const SETUP_INSTRUCTIONS: Record<string, string> = {
  freighter:
    "Freighter wallet extension not found. " +
    "Install Freighter from freighter.app and refresh this page to continue.",
  albedo:
    "Albedo wallet extension not found. " +
    "Install Albedo from albedo.link and refresh this page to continue.",
  xbull:
    "xBull wallet extension not found. " +
    "Install xBull and refresh this page to continue.",
  hana:
    "Hana wallet extension not found. " +
    "Install Hana Wallet and refresh this page to continue.",
};

const INSTALL_URLS: Record<string, string> = {
  freighter: "https://www.freighter.app/",
  albedo: "https://albedo.link/",
  xbull: "https://xbull.app/",
  hana: "https://www.hanawallet.io/",
};

const FALLBACK_SETUP_INSTRUCTION =
  "Wallet extension not found. " +
  "Install the wallet extension for your provider and refresh this page to continue.";

/**
 * Detects whether a wallet extension is installed by checking for the
 * window globals it injects.
 *
 * @param walletId - The wallet provider ID (freighter, albedo, xbull, hana).
 * @param detector - Optional override for testing (receives the global check).
 */
export function detectWalletExtensionById(
  walletId: string,
  detector?: () => boolean,
): boolean {
  if (detector) {
    return detector();
  }

  if (typeof window === "undefined") return false;

  const globals = WALLET_GLOBALS[walletId] ?? [];
  const w = window as unknown as Record<string, unknown>;

  for (const key of globals) {
    try {
      if (w[key]) return true;
    } catch {
      // SSR or restricted environment — skip
    }
  }

  return false;
}

/**
 * Checks wallet availability and returns setup instructions if missing.
 */
export function checkWalletAvailabilityById(
  walletId: string,
  detector?: () => boolean,
): WalletAvailabilityResult {
  try {
    const available = detectWalletExtensionById(walletId, detector);

    if (available) {
      return { available: true, setupInstruction: null, installUrl: null };
    }

    return {
      available: false,
      setupInstruction:
        SETUP_INSTRUCTIONS[walletId] ?? FALLBACK_SETUP_INSTRUCTION,
      installUrl: INSTALL_URLS[walletId] ?? null,
    };
  } catch (err) {
    console.warn(
      `${LOG_PREFIX} AVAILABILITY CHECK FAILED for ${walletId}:`,
      err instanceof Error ? err.message : String(err),
    );

    return {
      available: false,
      setupInstruction:
        SETUP_INSTRUCTIONS[walletId] ?? FALLBACK_SETUP_INSTRUCTION,
      installUrl: INSTALL_URLS[walletId] ?? null,
    };
  }
}

// =============================================================
// Active wallet session state persistence (#237)
// =============================================================

export const WALLET_DISCONNECT_ACTIVE_KEYS_STORAGE_KEY = "wallet_disconnect_active_keys";
export const WALLET_DISCONNECT_SCHEMA_VERSION = 1;

export interface WalletActiveKey {
  walletId: string;
  address: string;
  connectedAt: number;
}

interface WalletActiveKeysSerializedV1 {
  version: 1;
  activeKeys: WalletActiveKey[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isValidWalletActiveKey(value: unknown): value is WalletActiveKey {
  if (!isRecord(value)) return false;
  if (typeof value.walletId !== "string" || value.walletId.length === 0) return false;
  if (typeof value.address !== "string" || value.address.length === 0) return false;
  if (typeof value.connectedAt !== "number" || !Number.isFinite(value.connectedAt)) return false;
  return true;
}

function sanitizeWalletActiveKey(value: unknown): WalletActiveKey | null {
  if (!isValidWalletActiveKey(value)) return null;
  return {
    walletId: value.walletId,
    address: value.address,
    connectedAt: value.connectedAt,
  };
}

function isValidSerializedPayload(
  value: unknown
): value is WalletActiveKeysSerializedV1 {
  if (!isRecord(value)) return false;
  if (value.version !== WALLET_DISCONNECT_SCHEMA_VERSION) return false;
  if (!Array.isArray(value.activeKeys)) return false;
  for (const key of value.activeKeys) {
    if (!isValidWalletActiveKey(key)) return false;
  }
  return true;
}

function getStorageAdapter(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    const testKey = "__wallet_disconnect_storage_test__";
    window.localStorage.setItem(testKey, "1");
    window.localStorage.removeItem(testKey);
    return window.localStorage;
  } catch {
    return null;
  }
}

export class WalletActiveKeysStore {
  private activeKeys: WalletActiveKey[] = [];
  private storage: Storage | null;

  constructor(storageOverride?: Storage | null) {
    this.storage =
      storageOverride !== undefined ? storageOverride : getStorageAdapter();
    this.rehydrate();
  }

  private persist(): void {
    if (!this.storage) return;
    try {
      if (this.activeKeys.length > 0) {
        const payload: WalletActiveKeysSerializedV1 = {
          version: WALLET_DISCONNECT_SCHEMA_VERSION,
          activeKeys: this.activeKeys,
        };
        this.storage.setItem(
          WALLET_DISCONNECT_ACTIVE_KEYS_STORAGE_KEY,
          JSON.stringify(payload)
        );
      } else {
        this.storage.removeItem(WALLET_DISCONNECT_ACTIVE_KEYS_STORAGE_KEY);
      }
    } catch (err) {
      console.warn(
        `${LOG_PREFIX} PERSIST FAILED`,
        err instanceof Error ? err.message : String(err)
      );
    }
  }

  /**
   * Re-reads persisted state from storage into memory. Public because
   * simulating a reload (which triggers rehydration) is a legitimate
   * externally-verifiable behavior: consumers and tests both need to
   * confirm that a freshly-bootstrapped store correctly restores its
   * state from whatever is in storage right now.
   */
  rehydrate(): void {
    this.activeKeys = [];
    if (!this.storage) return;
    try {
      const raw = this.storage.getItem(WALLET_DISCONNECT_ACTIVE_KEYS_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as unknown;
      if (!isValidSerializedPayload(parsed)) {
        console.warn(
          `${LOG_PREFIX} REHYDRATE SCHEMA MISMATCH`,
          "Persisted active keys data failed validation, falling back to clean state."
        );
        this.storage.removeItem(WALLET_DISCONNECT_ACTIVE_KEYS_STORAGE_KEY);
        return;
      }
      const sanitized = parsed.activeKeys
        .map(sanitizeWalletActiveKey)
        .filter((k): k is WalletActiveKey => k !== null);
      this.activeKeys = sanitized;
    } catch (err) {
      console.warn(
        `${LOG_PREFIX} REHYDRATE FAILED`,
        err instanceof Error ? err.message : String(err)
      );
      try {
        this.storage.removeItem(WALLET_DISCONNECT_ACTIVE_KEYS_STORAGE_KEY);
      } catch {
        // no-op — best effort cleanup
      }
    }
  }

  /**
   * Replaces the storage backend used by this store instance and
   * immediately re-reads state from the new backend. Intended as a
   * narrow test-support seam so tests can supply an in-memory Storage
   * mock without reaching into the private `storage` field. Safe to
   * call at runtime as well (e.g. to swap to sessionStorage in a
   * security-sensitive mode).
   */
  overrideStorage(nextStorage: Storage | null): void {
    this.storage = nextStorage;
    this.rehydrate();
  }

  addActiveKey(key: WalletActiveKey): void {
    const sanitized = sanitizeWalletActiveKey(key);
    if (!sanitized) return;
    
    // Remove existing entry for the same wallet IDs to avoid duplicates
    this.activeKeys = this.activeKeys.filter(k => k.walletId !== sanitized.walletId);
    this.activeKeys.push(sanitized);
    this.persist();
  }

  removeActiveKey(walletId: string): void {
    this.activeKeys = this.activeKeys.filter(k => k.walletId !== walletId);
    this.persist();
  }

  getActiveKeys(): WalletActiveKey[] {
    return this.activeKeys.map(k => ({
      walletId: k.walletId,
      address: k.address,
      connectedAt: k.connectedAt,
    }));
  }

  hasActiveKey(walletId: string): boolean {
    return this.activeKeys.some(k => k.walletId === walletId);
  }

  clear(): void {
    this.activeKeys = [];
    if (this.storage) {
      try {
        this.storage.removeItem(WALLET_DISCONNECT_ACTIVE_KEYS_STORAGE_KEY);
      } catch (err) {
        console.warn(
          `${LOG_PREFIX} CLEAR STORAGE FAILED`,
          err instanceof Error ? err.message : String(err)
        );
      }
    }
  }
}

export const walletActiveKeysStore = new WalletActiveKeysStore();

/**
 * Registers an active wallet key in the persistent store. This should be
 * called when a wallet successfully connects so the disconnect handler can
 * track which wallets are currently active across reload cycles.
 *
 * @param walletId - The wallet provider ID.
 * @param address - The wallet address.
 */
export function registerActiveWalletKey(
  walletId: string,
  address: string
): void {
  walletActiveKeysStore.addActiveKey({
    walletId,
    address,
    connectedAt: Date.now(),
  });
}

// =============================================================
// Disconnect with availability pre-check
// =============================================================

export interface WalletDisconnectResult {
  /** `true` when the disconnect operation succeeded. */
  success: boolean;
  /** Error message when the disconnect failed. `null` on success. */
  error: string | null;
  /**
   * Human-readable fallback instructions shown when the wallet is not
   * installed.  `null` when no fallback is needed.
   */
  fallbackInstructions: string | null;
  /** Install URL for the missing wallet, if known. */
  installUrl: string | null;
}

/**
 * Attempts to disconnect a wallet, performing an availability check first.
 *
 * If the wallet extension is not installed, the disconnect is skipped and
 * the returned result carries `fallbackInstructions` instead of throwing.
 * This prevents a confusing "wallet not found" error from appearing when
 * the user has already uninstalled the extension.
 *
 * On successful disconnect, the active key is removed from the persistent
 * store to ensure the wallet is not remembered across reload cycles.
 *
 * @param walletId - The wallet provider ID.
 * @param disconnectFn - The actual disconnect function (e.g. StellarWalletsKit.disconnect()).
 * @param detector - Optional availability-detector override for tests.
 */
export async function disconnectWalletWithCheck(
  walletId: string,
  disconnectFn: () => Promise<void>,
  detector?: () => boolean,
): Promise<WalletDisconnectResult> {
  const availability = checkWalletAvailabilityById(walletId, detector);

  if (!availability.available) {
    console.warn(
      `${LOG_PREFIX} Wallet "${walletId}" is not installed — skipping disconnect.`,
    );
    // Remove from active keys store even if wallet is not installed
    walletActiveKeysStore.removeActiveKey(walletId);
    return {
      success: false,
      error: null,
      fallbackInstructions: availability.setupInstruction,
      installUrl: availability.installUrl,
    };
  }

  try {
    await disconnectFn();
    // Remove from active keys store on successful disconnect
    walletActiveKeysStore.removeActiveKey(walletId);
    return {
      success: true,
      error: null,
      fallbackInstructions: null,
      installUrl: null,
    };
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : "Unknown error during wallet disconnect.";

    console.warn(`${LOG_PREFIX} DISCONNECT FAILED for ${walletId}:`, message);

    return {
      success: false,
      error: message,
      fallbackInstructions: null,
      installUrl: null,
    };
  }
}
