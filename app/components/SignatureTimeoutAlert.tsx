"use client";

import SignatureTimeoutFeeWarningBanner from "./SignatureTimeoutFeeWarningBanner";
import {
  inspectSignatureFee,
  DEFAULT_SIGNATURE_FEE_LIMIT_STROOPS,
  type SignatureTimeoutSimulationResult,
} from "@/app/lib/signature_timeout_alert";

export interface SignatureTimeoutAlertProps {
  /** True once the signature clock has elapsed without a signature. */
  timedOut?: boolean;
  /** Timeout bound in milliseconds, used in the timeout copy. */
  timeoutMs?: number;
  /** Simulation result behind the request, inspected for fee warnings. */
  simulation?: SignatureTimeoutSimulationResult | null;
  /** Override the default fee limit (stroops). */
  feeLimitStroops?: number;
  /** Renders a retry action when provided. */
  onRetry?: () => void;
  className?: string;
}

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-page";

/**
 * Displays the transaction signature timeout notice, together with a fee
 * warning banner derived from the simulation result that produced the
 * transaction. Renders nothing when the request has not timed out and the
 * simulated fee is within standard bounds.
 */
export default function SignatureTimeoutAlert({
  timedOut = false,
  timeoutMs,
  simulation = null,
  feeLimitStroops = DEFAULT_SIGNATURE_FEE_LIMIT_STROOPS,
  onRetry,
  className = "",
}: SignatureTimeoutAlertProps) {
  const feeState = inspectSignatureFee(simulation, feeLimitStroops);

  if (!timedOut && !feeState.hasWarning) {
    return null;
  }

  return (
    <div
      data-testid="signature-timeout-alert"
      data-timed-out={timedOut ? "true" : "false"}
      data-fee-severity={feeState.severity}
      className={`flex flex-col gap-3 ${className}`}
    >
      {timedOut && (
        <div
          data-testid="signature-timeout-notice"
          role="alert"
          className="bg-danger/30 border border-danger px-4 py-3 rounded-lg text-danger-soft text-sm"
        >
          <span aria-hidden="true">⏱</span>{" "}
          {timeoutMs !== undefined
            ? `Signature request timed out after ${timeoutMs}ms. The operation was aborted.`
            : "Signature request timed out. The operation was aborted."}
        </div>
      )}

      <SignatureTimeoutFeeWarningBanner
        simulation={simulation}
        feeLimitStroops={feeLimitStroops}
      />

      {timedOut && onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className={`self-start bg-accent hover:bg-accent-hover text-text-primary text-sm font-medium px-4 py-2 rounded-lg transition-colors ${focusRing}`}
        >
          Retry signature
        </button>
      )}
    </div>
  );
}
