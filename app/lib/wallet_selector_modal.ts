/**
 * wallet_selector_modal — wallet selection dropdown list.
 *
 * Once the user picks a wallet from the list the modal hands the transaction
 * to that provider and waits for a signature. Providers can hang indefinitely
 * (extension never opens, hardware wallet asleep, user walks away), so every
 * request is raced against a timeout clock. On expiry the operation is
 * aborted through an `AbortSignal` and any sensitive payload memory the
 * request carried is zeroed and dropped.
 */

const WARN_PREFIX = "[wallet_selector_modal]";

/** Default bound for a signature requested from the wallet selector modal. */
export const DEFAULT_WALLET_SELECTOR_TIMEOUT_MS = 60_000;

export interface WalletSelectorSignRequest {
  /** Id of the wallet chosen from the dropdown list. */
  walletId: string;
  /** Transaction XDR handed to the provider. */
  xdr: string;
  /** Sensitive buffer cleared on timeout / completion. */
  payload?: Uint8Array | null;
}

/** Signing callback invoked with the request XDR and an abort signal. */
export type WalletSelectorSignFn<T> = (
  xdr: string,
  signal: AbortSignal
) => Promise<T>;

export class WalletSelectorTimeoutError extends Error {
  constructor(
    public readonly timeoutMs: number,
    public readonly walletId?: string
  ) {
    super(
      walletId
        ? `Wallet "${walletId}" signature timed out after ${timeoutMs}ms`
        : `Wallet signature timed out after ${timeoutMs}ms`
    );
    this.name = "WalletSelectorTimeoutError";
  }
}

/** Zeroes and drops a sensitive buffer so it cannot be retained after abort. */
export function clearWalletSelectorSensitiveMemory(
  request: WalletSelectorSignRequest
): WalletSelectorSignRequest {
  if (request.payload) {
    request.payload.fill(0);
  }
  request.payload = null;
  return request;
}

// ---------------------------------------------------------------------------
// Pending-operation registry
// ---------------------------------------------------------------------------

interface PendingWalletSelectorOperation {
  walletId: string;
  startedAt: number;
  controller: AbortController;
}

const pendingOperations = new Map<number, PendingWalletSelectorOperation>();
let nextOperationId = 1;

/** Number of signature requests still in flight. */
export function getPendingWalletSelectorOperationCount(): number {
  return pendingOperations.size;
}

/** Wallet ids of the signature requests still in flight. */
export function getPendingWalletSelectorWalletIds(): string[] {
  return Array.from(pendingOperations.values(), (op) => op.walletId);
}

/**
 * Aborts every in-flight signature request and empties the registry. Called
 * when the modal unmounts or the user closes it mid-request.
 */
export function abortAllWalletSelectorOperations(): number {
  const aborted = pendingOperations.size;
  for (const operation of pendingOperations.values()) {
    operation.controller.abort();
  }
  pendingOperations.clear();
  return aborted;
}

function normalizeTimeout(timeoutMs: number): number {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    return DEFAULT_WALLET_SELECTOR_TIMEOUT_MS;
  }
  return timeoutMs;
}

/**
 * Races a signature request from the wallet selector modal against a timeout
 * clock. On expiry the operation is aborted via its `AbortSignal`, the
 * sensitive payload is cleared, and a {@link WalletSelectorTimeoutError} is
 * thrown. The pending-operation registry is emptied on every exit path so no
 * controller or buffer outlives the request.
 *
 * @param request   - Wallet id, XDR and optional sensitive payload.
 * @param signFn    - Provider callback; receives the XDR and an abort signal.
 * @param timeoutMs - Bound in ms. Defaults to
 *                    {@link DEFAULT_WALLET_SELECTOR_TIMEOUT_MS}.
 */
export async function signWithWalletSelectorTimeout<T>(
  request: WalletSelectorSignRequest,
  signFn: WalletSelectorSignFn<T>,
  timeoutMs: number = DEFAULT_WALLET_SELECTOR_TIMEOUT_MS
): Promise<T> {
  const bound = normalizeTimeout(timeoutMs);
  const controller = new AbortController();
  const operationId = nextOperationId++;

  pendingOperations.set(operationId, {
    walletId: request.walletId,
    startedAt: Date.now(),
    controller,
  });

  let timer: ReturnType<typeof setTimeout> | undefined;
  let timedOut = false;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
      clearWalletSelectorSensitiveMemory(request);
      console.warn(
        `${WARN_PREFIX} SIGNATURE TIMEOUT — wallet "${request.walletId}" did not respond within ${bound}ms; operation aborted and memory cleared.`
      );
      reject(new WalletSelectorTimeoutError(bound, request.walletId));
    }, bound);
  });

  try {
    const result = await Promise.race([
      signFn(request.xdr, controller.signal),
      timeoutPromise,
    ]);
    clearWalletSelectorSensitiveMemory(request);
    return result;
  } catch (err) {
    if (timedOut || err instanceof WalletSelectorTimeoutError) {
      clearWalletSelectorSensitiveMemory(request);
    }
    throw err;
  } finally {
    if (timer !== undefined) clearTimeout(timer);
    pendingOperations.delete(operationId);
  }
}
