"use client";

import { useState } from "react";

interface DisputeRaiseModalProps {
  /** Whether the modal is currently visible. */
  isOpen: boolean;
  /** Called when the user requests the modal be closed. */
  onClose: () => void;
  /** Called when the user confirms the dispute. */
  onConfirm: () => void;
  /** The milestone number being disputed (1-based). */
  milestoneNumber: number;
  /** Whether the dispute operation is currently in progress. */
  isPending?: boolean;
  /** Optional error message to display. */
  errorMessage?: string | null;
}

export default function DisputeRaiseModal({
  isOpen,
  onClose,
  onConfirm,
  milestoneNumber,
  isPending = false,
  errorMessage = null,
}: DisputeRaiseModalProps) {
  const [reason, setReason] = useState("");

  const handleConfirm = () => {
    onConfirm();
    setReason("");
  };

  const handleClose = () => {
    onClose();
    setReason("");
  };

  if (!isOpen) return null;

  return (
    <div
      data-testid="dispute-raise-modal"
      role="dialog"
      aria-label="Raise Dispute"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 animate-fade-in"
    >
      <div
        data-testid="dispute-raise-modal-content"
        className="bg-surface-card rounded-xl shadow-xl max-w-md w-full mx-4 p-6 animate-slide-in"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-text-primary">
            Raise Dispute for Milestone {milestoneNumber}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            disabled={isPending}
            data-testid="dispute-raise-modal-close"
            aria-label="Close"
            className="text-text-muted hover:text-text-primary transition-colors duration-200 hover:scale-110 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ✕
          </button>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div
            data-testid="dispute-raise-modal-error"
            role="alert"
            aria-live="assertive"
            className="bg-danger/20 border border-danger rounded-lg px-4 py-3 mb-4 text-danger-soft text-sm animate-shake"
          >
            {errorMessage}
          </div>
        )}

        <div className="space-y-4">
          <p className="text-sm text-text-secondary">
            Are you sure you want to raise a dispute for this milestone? This
            action will notify the arbiter to review the situation.
          </p>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="dispute-reason"
              className="text-xs text-text-muted"
            >
              Reason for dispute (optional)
            </label>
            <textarea
              id="dispute-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={isPending}
              placeholder="Describe the issue..."
              rows={3}
              className="text-sm px-3 py-2 rounded-lg bg-surface-field border border-border-subtle text-text-primary placeholder:text-text-muted
                focus:outline-none focus:ring-2 focus:ring-danger-soft focus:ring-offset-1 focus:ring-offset-surface-card
                disabled:opacity-40 disabled:cursor-not-allowed
                transition-all duration-200
                focus:scale-[1.01]
                hover:border-border-strong"
              data-testid="dispute-reason-input"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isPending}
              className="px-4 py-2 rounded-lg border border-border-subtle text-text-secondary hover:text-text-primary hover:bg-surface-field
                transition-all duration-200
                hover:scale-[1.02] active:scale-[0.98]
                disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
              data-testid="dispute-raise-modal-cancel"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isPending}
              className="px-4 py-2 rounded-lg bg-danger text-text-primary hover:bg-danger/80
                transition-all duration-200
                hover:scale-[1.02] active:scale-[0.98]
                disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100
                focus-visible:ring-2 focus-visible:ring-danger-soft focus-visible:ring-offset-2 focus-visible:ring-offset-surface-card"
              data-testid="dispute-raise-modal-confirm"
            >
              {isPending ? "Raising Dispute..." : "Raise Dispute"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
