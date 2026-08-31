"use client";

import { useCallback, useState } from "react";
import { useDisputeViewport } from "@/app/hooks/useDisputeViewport";
import {
  DISPUTE_MODAL_CLASSES,
  DISPUTE_REASON_MAX_LENGTH,
  DISPUTE_REASON_MIN_LENGTH,
  getDisputeModalLayout,
} from "@/app/lib/dispute_raise_modal";
import ButtonSpinner from "./ButtonSpinner";

export interface DisputeRaiseModalProps {
  /** Whether the modal is currently visible. */
  isOpen: boolean;
  /** Called when the user dismisses the modal. */
  onClose: () => void;
  /** Called with the validated reason when the user confirms the dispute. */
  onConfirm?: (reason: string) => void;
  /** Alias of `onConfirm`; both fire with the trimmed reason. */
  onSubmit?: (reason: string) => void | Promise<void>;
  /** Job the dispute is being raised against. */
  jobId?: string | null;
  /** Zero-based milestone index the dispute targets. Displayed one-based. */
  milestoneIndex?: number | null;
  /** Disputed amount, pre-formatted for display. */
  amount?: string | null;
  /** Counterparty address shown in the summary. */
  counterparty?: string | null;
  /** Whether the confirm action is in flight. */
  isSubmitting?: boolean;
  /** Alias of `isSubmitting`. */
  isLoading?: boolean;
  /** Provider/contract error surfaced above the actions. */
  errorMessage?: string | null;
  /** Alias of `errorMessage`. */
  submissionError?: string | null;
  className?: string;
}

const REASON_FIELD_ID = "dispute-raise-reason";
const REASON_ERROR_ID = "dispute-reason-error";

/**
 * Dispute raise confirmation modal.
 *
 * Sizing is mobile-first: a full-bleed bottom sheet with stacked, full-width
 * actions on phones, a centered `sm:max-w-lg` dialog on tablets, and a wider
 * `lg:max-w-2xl` panel on desktop. The summary grid collapses to one column
 * below `sm:` so long addresses and amounts never force horizontal scroll.
 *
 * The reason is required: submission is blocked until it holds between
 * DISPUTE_REASON_MIN_LENGTH and DISPUTE_REASON_MAX_LENGTH characters once
 * trimmed. Field-level copy is written here rather than taken from
 * `validateDisputeReason`, whose own wording is asserted directly by the
 * helper's unit tests.
 */
export default function DisputeRaiseModal({
  isOpen,
  onClose,
  onConfirm,
  onSubmit,
  jobId = null,
  milestoneIndex = null,
  amount = null,
  counterparty = null,
  isSubmitting = false,
  isLoading = false,
  errorMessage = null,
  submissionError = null,
  className = "",
}: DisputeRaiseModalProps) {
  const viewport = useDisputeViewport();
  const layout = getDisputeModalLayout(viewport);

  const [reason, setReason] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const busy = isSubmitting || isLoading;
  const generalError = submissionError ?? errorMessage ?? submitError;
  const milestoneNumber = milestoneIndex == null ? null : milestoneIndex + 1;

  const heading =
    milestoneNumber == null
      ? "Raise a Dispute"
      : `Raise Dispute - Milestone ${milestoneNumber}`;
  const dialogLabel =
    milestoneNumber == null
      ? "Raise a dispute"
      : `Raise dispute for Milestone ${milestoneNumber}`;

  const handleReasonChange = useCallback((value: string) => {
    setReason(value);
    // Clear the field error as soon as the user starts correcting it.
    setFieldError((current) => (current === null ? current : null));
  }, []);

  const handleConfirm = useCallback(() => {
    const trimmed = reason.trim();

    if (trimmed === "") {
      setFieldError("Please provide a reason for this dispute.");
      return;
    }
    if (trimmed.length < DISPUTE_REASON_MIN_LENGTH) {
      setFieldError(
        `Reason must be at least ${DISPUTE_REASON_MIN_LENGTH} characters.`,
      );
      return;
    }
    if (trimmed.length > DISPUTE_REASON_MAX_LENGTH) {
      setFieldError(
        `Reason must not exceed ${DISPUTE_REASON_MAX_LENGTH} characters.`,
      );
      return;
    }

    setFieldError(null);
    setSubmitError(null);

    try {
      const pending = onSubmit?.(trimmed);
      if (pending && typeof (pending as Promise<void>).catch === "function") {
        (pending as Promise<void>).catch((err: unknown) => {
          setSubmitError(
            err instanceof Error ? err.message : "Failed to submit dispute.",
          );
        });
      }
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Failed to submit dispute.",
      );
    }

    onConfirm?.(trimmed);
  }, [reason, onSubmit, onConfirm]);

  if (!isOpen) return null;

  return (
    <div
      data-testid="dispute-raise-modal"
      data-viewport={layout.viewport}
      role="dialog"
      aria-modal="true"
      aria-label={dialogLabel}
      className={`${DISPUTE_MODAL_CLASSES.overlay} ${className}`}
    >
      <div
        data-testid="dispute-raise-modal-panel"
        data-full-width={layout.fullWidth}
        data-max-width={layout.maxWidthClass}
        className={DISPUTE_MODAL_CLASSES.panel}
      >
        <div className={DISPUTE_MODAL_CLASSES.header}>
          <h2
            data-testid="dispute-raise-modal-title"
            className={DISPUTE_MODAL_CLASSES.title}
          >
            {heading}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            data-testid="dispute-raise-modal-close"
            aria-label="Close modal"
            className="min-h-[44px] min-w-[44px] text-secondary hover:text-primary transition-colors"
          >
            ✕
          </button>
        </div>

        <p className="mb-4 text-sm text-secondary">
          Raising a dispute pauses the escrow and hands the decision to the
          arbiter. This cannot be undone from here.
        </p>

        <dl
          data-testid="dispute-raise-modal-summary"
          data-columns={layout.summaryColumns}
          data-stacked={layout.stackSummary}
          className={DISPUTE_MODAL_CLASSES.summary}
        >
          <div className={DISPUTE_MODAL_CLASSES.summaryCell}>
            <dt className="text-muted">Job</dt>
            <dd data-testid="dispute-raise-modal-job" className="break-all">
              {jobId ?? "—"}
            </dd>
          </div>
          <div className={DISPUTE_MODAL_CLASSES.summaryCell}>
            <dt className="text-muted">Milestone</dt>
            <dd data-testid="dispute-raise-modal-milestone">
              {milestoneNumber == null ? "Whole job" : `#${milestoneNumber}`}
            </dd>
          </div>
          <div className={DISPUTE_MODAL_CLASSES.summaryCell}>
            <dt className="text-muted">Amount</dt>
            <dd data-testid="dispute-raise-modal-amount">{amount ?? "—"}</dd>
          </div>
          <div className={DISPUTE_MODAL_CLASSES.summaryCell}>
            <dt className="text-muted">Counterparty</dt>
            <dd
              data-testid="dispute-raise-modal-counterparty"
              className="break-all"
            >
              Why are you raising this dispute?
            </label>
            <textarea
              id="dispute-raise-reason"
              data-testid="dispute-raise-modal-reason"
              value={reason}
              maxLength={DISPUTE_REASON_MAX_LENGTH}
              disabled={isSubmitting}
              onChange={(e) => setReason(e.target.value)}
              className={DISPUTE_MODAL_CLASSES.textarea}
            />

        <label
          htmlFor={REASON_FIELD_ID}
          className="mb-1 block text-sm text-secondary"
        >
          Dispute reason
        </label>
        <textarea
          id={REASON_FIELD_ID}
          data-testid="dispute-raise-modal-reason"
          value={reason}
          maxLength={DISPUTE_REASON_MAX_LENGTH}
          disabled={busy}
          aria-invalid={fieldError ? "true" : "false"}
          aria-describedby={fieldError ? REASON_ERROR_ID : undefined}
          onChange={(e) => handleReasonChange(e.target.value)}
          className={DISPUTE_MODAL_CLASSES.textarea}
        />

        {fieldError ? (
          <p
            id={REASON_ERROR_ID}
            data-testid="dispute-raise-modal-validation-error"
            role="alert"
            aria-live="polite"
            className="mt-2 text-sm text-danger-soft"
          >
            {fieldError}
          </p>
        ) : (
          <p
            data-testid="dispute-raise-modal-character-count"
            className="mt-2 text-xs text-muted"
          >
            {reason.length}/{DISPUTE_REASON_MAX_LENGTH} characters
          </p>
        )}

        {generalError && (
          <div
            data-testid="dispute-raise-modal-error"
            role="alert"
            aria-live="assertive"
            className="mt-3 rounded-lg border border-danger bg-danger/20 px-4 py-3 text-sm text-danger-soft"
          >
            {generalError}
          </div>
        )}

        <div
          data-testid="dispute-raise-modal-actions"
          data-stacked={layout.stackActions}
          className={DISPUTE_MODAL_CLASSES.actions}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            data-testid="dispute-raise-modal-cancel"
            className={`${DISPUTE_MODAL_CLASSES.button} border border-white/10 text-primary hover:bg-white/5 disabled:opacity-50`}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={busy || reason.trim() === ""}
            data-testid="dispute-raise-modal-confirm"
            className={`${DISPUTE_MODAL_CLASSES.button} flex items-center justify-center gap-2 bg-danger text-white hover:opacity-90 disabled:opacity-50`}
          >
            {busy && <ButtonSpinner />}
            {busy ? "Submitting..." : "Raise Dispute"}
          </button>
        </div>
      </div>
    </div>
  );
}
