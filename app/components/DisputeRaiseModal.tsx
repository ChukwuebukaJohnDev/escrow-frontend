"use client";

import { useState, useCallback } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DisputeRaiseModalProps {
  /** Whether the modal is currently visible. */
  isOpen: boolean;
  /** Called when the user requests the modal be closed. */
  onClose: () => void;
  /** Called when the dispute is successfully submitted. */
  onSubmit: (reason: string) => void | Promise<void>;
  /** The milestone index being disputed (for display purposes). */
  milestoneIndex: number;
  /** Whether a dispute operation is currently in progress. */
  isLoading?: boolean;
  /** Optional error message from the submission attempt. */
  submissionError?: string | null;
  className?: string;
}

/**
 * Field-level and general error messages surfaced inside the modal.
 *
 * - `reason` – shown beneath the reason textarea (e.g. "Please provide a reason")
 * - `general` – shown as a top-level alert banner above the form
 */
export interface DisputeRaiseModalErrors {
  reason?: string;
  general?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DisputeRaiseModal({
  isOpen,
  onClose,
  onSubmit,
  milestoneIndex,
  isLoading = false,
  submissionError = null,
  className = "",
}: DisputeRaiseModalProps) {
  const [reason, setReason] = useState("");
  const [errors, setErrors] = useState<DisputeRaiseModalErrors>({});

  // Clear errors when modal opens/closes
  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        onClose();
        setReason("");
        setErrors({});
      }
    },
    [onClose]
  );

  /**
   * Client-side validation + submission handler for dispute raise.
   */
  const handleSubmit = useCallback(async () => {
    const newErrors: DisputeRaiseModalErrors = {};

    // Validate reason field
    const trimmedReason = reason.trim();
    if (!trimmedReason) {
      newErrors.reason = "Please provide a reason for the dispute.";
    } else if (trimmedReason.length < 10) {
      newErrors.reason = "Reason must be at least 10 characters long.";
    } else if (trimmedReason.length > 500) {
      newErrors.reason = "Reason must not exceed 500 characters.";
    }

    // If there are validation errors, display them and don't submit
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Clear validation errors before submission
    setErrors({});

    try {
      await onSubmit(trimmedReason);
      // Success - close modal will be handled by parent
      setReason("");
    } catch (err) {
      // Submission error - display as general error
      setErrors({
        general:
          err instanceof Error ? err.message : "Failed to submit dispute. Please try again.",
      });
    }
  }, [reason, onSubmit]);

  if (!isOpen) return null;

  const milestoneNumber = milestoneIndex + 1;

  return (
    <div
      data-testid="dispute-raise-modal"
      role="dialog"
      aria-label={`Raise dispute for Milestone ${milestoneNumber}`}
      aria-modal="true"
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/60 ${className}`}
    >
      <div
        data-testid="dispute-raise-modal-content"
        className="bg-surface-card rounded-xl shadow-xl max-w-md w-full mx-4 p-6 relative"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text-primary">
            Raise Dispute - Milestone {milestoneNumber}
          </h2>
          <button
            type="button"
            onClick={() => handleOpenChange(false)}
            data-testid="dispute-raise-modal-close"
            aria-label="Close modal"
            disabled={isLoading}
            className="text-text-muted hover:text-text-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ✕
          </button>
        </div>

        {/* General error alert banner */}
        {(errors.general || submissionError) && (
          <div
            data-testid="dispute-raise-modal-general-error"
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
            className="w-full rounded-lg bg-danger/10 border border-danger/30 px-3 py-2 text-sm text-danger-soft mb-4"
          >
            {errors.general || submissionError}
          </div>
        )}

        {/* Form */}
        <div className="space-y-4">
          {/* Description */}
          <p className="text-sm text-text-muted">
            Please provide a detailed reason for raising a dispute on this milestone.
            This information will be reviewed by the arbiter.
          </p>

          {/* Reason field */}
          <div className="flex flex-col gap-1">
            <label
              htmlFor="dispute-reason"
              className="text-sm font-medium text-text-secondary"
            >
              Dispute Reason <span className="text-danger-soft">*</span>
            </label>
            <textarea
              id="dispute-reason"
              data-testid="dispute-reason-input"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                // Clear field error when user starts typing
                if (errors.reason) {
                  setErrors((prev) => ({ ...prev, reason: undefined }));
                }
              }}
              disabled={isLoading}
              aria-invalid={!!errors.reason}
              aria-describedby={
                errors.reason ? "dispute-reason-error" : undefined
              }
              placeholder="Describe why you are disputing this milestone..."
              rows={4}
              maxLength={500}
              className="text-sm px-3 py-2 rounded-lg bg-surface-field border border-border-subtle text-text-primary placeholder:text-text-muted
                focus:outline-none focus:ring-2 focus:ring-accent-soft focus:ring-offset-1 focus:ring-offset-surface-page
                disabled:opacity-40 disabled:cursor-not-allowed resize-none"
            />
            {/* Character count */}
            <div className="flex items-center justify-between">
              {errors.reason && (
                <p
                  id="dispute-reason-error"
                  data-testid="dispute-reason-error"
                  role="alert"
                  aria-live="polite"
                  className="text-xs text-danger-soft"
                >
                  {errors.reason}
                </p>
              )}
              {!errors.reason && (
                <span className="text-xs text-text-muted">
                  {reason.length}/500 characters
                </span>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => handleOpenChange(false)}
              disabled={isLoading}
              data-testid="dispute-raise-modal-cancel"
              className="text-sm px-4 py-2 rounded-lg border border-border-subtle bg-surface-field text-text-primary hover:bg-surface-field/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading || !reason.trim()}
              data-testid="dispute-raise-modal-submit"
              className="text-sm px-4 py-2 rounded-lg bg-danger text-text-primary hover:bg-danger/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-medium"
            >
              {isLoading ? "Submitting..." : "Raise Dispute"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
