/**
 * signature_timeout_alert — transaction signature timeout display.
 *
 * Besides surfacing the "signature request timed out" notice, the alert
 * inspects the Soroban simulation result that produced the transaction so a
 * fee warning banner can be shown to the user before they approve — or
 * re-approve, after a timeout — a signature request.
 */

const WARN_PREFIX = "[signature_timeout_alert]";

/**
 * Minimal shape of a Soroban simulation result understood by the alert.
 * The full SDK type is structurally compatible — pass it directly.
 */
export interface SignatureTimeoutSimulationResult {
  /** Estimated Soroban resource fee in stroops (string or number). */
  minResourceFee?: string | number;
  /** Classic base fee in stroops (string or number). */
  fee?: string | number;
  /** Present when the simulation itself failed. */
  error?: string;
  /** Soroban error message embedded inside a failed simulation. */
  result?: { error?: string };
}

/**
 * How far outside standard bounds the simulated fee sits.
 * - `none`     — within bounds, no banner.
 * - `elevated` — above {@link ELEVATED_FEE_RATIO} of the limit but still under it.
 * - `exceeded` — strictly above the limit.
 * - `error`    — the simulation failed, so no fee could be established.
 */
export type SignatureFeeSeverity = "none" | "elevated" | "exceeded" | "error";

export interface SignatureFeeWarningState {
  /** Severity bucket driving the banner styling and copy. */
  severity: SignatureFeeSeverity;
  /** True whenever a banner should be rendered. */
  hasWarning: boolean;
  /** True only when the fee is strictly above the configured limit. */
  exceeded: boolean;
  /** Estimated fee in stroops (0 when the simulation carries no fee data). */
  estimatedFeeStroops: number;
  /** The bound that was checked against (in stroops). */
  feeLimitStroops: number;
  /** Simulation failure message, or null when the simulation succeeded. */
  simulationError: string | null;
  /** Human-readable warning, or null when the fee is within bounds. */
  warningMessage: string | null;
}

/**
 * Standard upper bound for an acceptable transaction fee.
 * 0.01 XLM = 1_000_000 stroops. Estimates above this trigger the banner.
 */
export const DEFAULT_SIGNATURE_FEE_LIMIT_STROOPS = 1_000_000;

/**
 * Fraction of the limit above which a fee is flagged as "elevated" even
 * though it still fits inside the bound.
 */
export const ELEVATED_FEE_RATIO = 0.5;

/** Stroops per XLM. */
const STROOPS_PER_XLM = 10_000_000;

export class SignatureFeeExceededError extends Error {
  constructor(
    public readonly estimatedFeeStroops: number,
    public readonly feeLimitStroops: number
  ) {
    super(
      `Fee exceeded: estimated ${estimatedFeeStroops} stroops exceeds limit of ${feeLimitStroops} stroops`
    );
    this.name = "SignatureFeeExceededError";
  }
}

export class SignatureSimulationError extends Error {
  constructor(message: string) {
    super(`Signature simulation failed: ${message}`);
    this.name = "SignatureSimulationError";
  }
}

/** Formats a stroop amount as a fixed-precision XLM string. */
export function formatStroopsAsXlm(stroops: number): string {
  return (stroops / STROOPS_PER_XLM).toFixed(7);
}

/**
 * Pulls the simulation failure message out of a result. Soroban reports the
 * error either at the top level or nested under `result.error`; both are
 * accepted so callers need not branch on RPC version.
 */
export function extractSimulationError(
  simulation: SignatureTimeoutSimulationResult | null | undefined
): string | null {
  if (!simulation) return null;
  const raw = simulation.error ?? simulation.result?.error;
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Extracts the total estimated fee in stroops from a simulation result.
 * Soroban transactions carry a `minResourceFee`; classic transactions use
 * `fee`. Both are accepted so callers need not branch on transaction type.
 */
export function extractEstimatedFeeStroops(
  simulation: SignatureTimeoutSimulationResult | null | undefined
): number {
  if (!simulation) return 0;
  const raw = simulation.minResourceFee ?? simulation.fee;
  if (raw === undefined || raw === null) return 0;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return parsed;
}

function normalizeFeeLimit(feeLimitStroops: number): number {
  if (!Number.isFinite(feeLimitStroops) || feeLimitStroops <= 0) {
    return DEFAULT_SIGNATURE_FEE_LIMIT_STROOPS;
  }
  return feeLimitStroops;
}

/**
 * Inspects a simulation result and produces the fee warning state the alert
 * renders. A warning is raised when the simulation failed, when the estimated
 * fee exceeds `feeLimitStroops`, or when it sits above
 * {@link ELEVATED_FEE_RATIO} of that limit.
 *
 * @param simulation      - Simulation result from the Soroban RPC / SDK.
 * @param feeLimitStroops - Upper bound in stroops. Defaults to
 *                          {@link DEFAULT_SIGNATURE_FEE_LIMIT_STROOPS}.
 */
export function inspectSignatureFee(
  simulation: SignatureTimeoutSimulationResult | null | undefined,
  feeLimitStroops: number = DEFAULT_SIGNATURE_FEE_LIMIT_STROOPS
): SignatureFeeWarningState {
  const limit = normalizeFeeLimit(feeLimitStroops);
  const simulationError = extractSimulationError(simulation);
  const estimatedFeeStroops = extractEstimatedFeeStroops(simulation);

  if (simulationError) {
    return {
      severity: "error",
      hasWarning: true,
      exceeded: false,
      estimatedFeeStroops,
      feeLimitStroops: limit,
      simulationError,
      warningMessage: `Simulation failed: ${simulationError}. The transaction fee could not be estimated — review the transaction before signing.`,
    };
  }

  const xlmFee = formatStroopsAsXlm(estimatedFeeStroops);
  const xlmLimit = formatStroopsAsXlm(limit);

  if (estimatedFeeStroops > limit) {
    return {
      severity: "exceeded",
      hasWarning: true,
      exceeded: true,
      estimatedFeeStroops,
      feeLimitStroops: limit,
      simulationError: null,
      warningMessage: `High fee detected: estimated ${xlmFee} XLM (${estimatedFeeStroops} stroops) exceeds the ${xlmLimit} XLM limit. Review the transaction before signing.`,
    };
  }

  if (estimatedFeeStroops > limit * ELEVATED_FEE_RATIO) {
    return {
      severity: "elevated",
      hasWarning: true,
      exceeded: false,
      estimatedFeeStroops,
      feeLimitStroops: limit,
      simulationError: null,
      warningMessage: `Elevated fee: estimated ${xlmFee} XLM (${estimatedFeeStroops} stroops) is approaching the ${xlmLimit} XLM limit.`,
    };
  }

  return {
    severity: "none",
    hasWarning: false,
    exceeded: false,
    estimatedFeeStroops,
    feeLimitStroops: limit,
    simulationError: null,
    warningMessage: null,
  };
}

/**
 * Runs a fee inspection and emits a formatted console warning when the
 * estimate falls outside standard bounds. Returns the same state as
 * {@link inspectSignatureFee} so callers can render the banner from it.
 */
export function warnOnSignatureFeeExceeded(
  simulation: SignatureTimeoutSimulationResult | null | undefined,
  feeLimitStroops: number = DEFAULT_SIGNATURE_FEE_LIMIT_STROOPS
): SignatureFeeWarningState {
  const state = inspectSignatureFee(simulation, feeLimitStroops);

  if (state.hasWarning && state.warningMessage) {
    const err =
      state.severity === "error"
        ? new SignatureSimulationError(state.simulationError ?? "unknown")
        : new SignatureFeeExceededError(
            state.estimatedFeeStroops,
            state.feeLimitStroops
          );
    console.warn(
      `${WARN_PREFIX} ${state.severity.toUpperCase()} — ${state.warningMessage}`,
      err
    );
  }

  return state;
}

/**
 * Throws when the simulated transaction cannot be signed safely. Used by
 * callers that want to hard-stop instead of rendering a banner.
 */
export function assertSignatureFeeWithinBounds(
  simulation: SignatureTimeoutSimulationResult | null | undefined,
  feeLimitStroops: number = DEFAULT_SIGNATURE_FEE_LIMIT_STROOPS
): SignatureFeeWarningState {
  const state = inspectSignatureFee(simulation, feeLimitStroops);

  if (state.severity === "error") {
    throw new SignatureSimulationError(state.simulationError ?? "unknown");
  }
  if (state.exceeded) {
    throw new SignatureFeeExceededError(
      state.estimatedFeeStroops,
      state.feeLimitStroops
    );
  }

  return state;
}
