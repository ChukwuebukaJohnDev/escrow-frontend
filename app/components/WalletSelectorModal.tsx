"use client";

import {
  useState,
  useCallback,
  useId,
  type KeyboardEvent,
} from "react";
import { SUPPORTED_WALLETS, type SupportedWalletId } from "@/app/context/WalletContext";
import {
  useWalletMultiSigAssembly,
  WalletMultiSigParseError,
  type MultiSigAssemblyPlan,
  type MultiSigTransactionStructure,
} from "@/app/hooks/useWalletMultiSigAssembly";
import ButtonSpinner from "@/app/components/ButtonSpinner";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface WalletSelectorModalProps {
  /** Currently selected wallet. */
  selectedWalletId: SupportedWalletId;
  /** Called when the user changes the wallet selector. */
  onSelectWallet: (id: SupportedWalletId) => void;
  /** Called to initiate a single-sig wallet connection. */
  onConnect: () => void;
  /** True while a connection is in progress. */
  isConnecting?: boolean;
  /**
   * Network passphrase — required for multi-sig XDR parsing.
   * Defaults to Testnet if omitted.
   */
  networkPassphrase?: string;
  /**
   * Called when a multi-sig assembly plan has been successfully built and
   * the user confirms it.  The modal passes back the plan so the caller can
   * collect co-signer signatures and then assemble the final XDR.
   */
  onMultiSigPlanReady?: (plan: MultiSigAssemblyPlan) => void;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const TESTNET_PASSPHRASE = "Test SDF Network ; September 2015";

function StructurePreview({
  structure,
}: {
  structure: MultiSigTransactionStructure;
}) {
  return (
    <dl
      data-testid="tx-structure-preview"
      className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-400"
    >
      <dt className="font-medium text-gray-300">Source</dt>
      <dd className="font-mono truncate" title={structure.sourceAccount}>
        {structure.sourceAccount
          ? `${structure.sourceAccount.slice(0, 6)}…${structure.sourceAccount.slice(-4)}`
          : "—"}
      </dd>
      {structure.fee ? (
        <>
          <dt className="font-medium text-gray-300">Fee</dt>
          <dd>{structure.fee} stroops</dd>
        </>
      ) : null}
      <dt className="font-medium text-gray-300">Operations</dt>
      <dd>{structure.operationCount}</dd>
      <dt className="font-medium text-gray-300">Signatures</dt>
      <dd>{structure.signatureCount}</dd>
    </dl>
  );
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * WalletSelectorModal
 *
 * A modal dialog for wallet selection supporting two modes:
 *
 * - **Single-sig** (default): presents a wallet picker and a connect button.
 *   Identical to the existing Navbar inline behaviour, no behaviour change
 *   for single-sig users.
 *
 * - **Multi-sig**: revealed via an optional toggle. Accepts a base transaction
 *   XDR and a list of required co-signer public keys; validates the XDR by
 *   parsing it through the Stellar SDK, then builds and returns an assembly
 *   plan via `onMultiSigPlanReady`.
 *
 * Uses the unified `useWalletMultiSigAssembly` hook so all wallet types are
 * handled through a single interface.
 */
export default function WalletSelectorModal({
  selectedWalletId,
  onSelectWallet,
  onConnect,
  isConnecting = false,
  networkPassphrase = TESTNET_PASSPHRASE,
  onMultiSigPlanReady,
}: WalletSelectorModalProps) {
  // ---- modal open/close state ----
  const [isOpen, setIsOpen] = useState(false);
  const openModal = useCallback(() => setIsOpen(true), []);
  const closeModal = useCallback(() => {
    setIsOpen(false);
    setMultiSigMode(false);
    setXdrInput("");
    setSignerInput("");
    setParseError(null);
    setStructurePreview(null);
  }, []);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) closeModal();
    },
    [closeModal]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Escape") closeModal();
    },
    [closeModal]
  );

  // ---- multi-sig toggle ----
  const [multiSigMode, setMultiSigMode] = useState(false);

  // ---- multi-sig XDR input + parse state ----
  const [xdrInput, setXdrInput] = useState("");
  const [signerInput, setSignerInput] = useState(""); // comma-separated public keys
  const [parseError, setParseError] = useState<string | null>(null);
  const [structurePreview, setStructurePreview] =
    useState<MultiSigTransactionStructure | null>(null);
  const [isParsing, setIsParsing] = useState(false);

  const multiSigHook = useWalletMultiSigAssembly(
    networkPassphrase,
    selectedWalletId
  );

  // ---- unique IDs for accessibility ----
  const modalTitleId = useId();
  const walletSelectId = useId();
  const xdrInputId = useId();
  const signerInputId = useId();

  // ---- validate XDR on demand ----
  const handleValidateXdr = useCallback(() => {
    if (!xdrInput.trim()) {
      setParseError("Paste a base-64 transaction XDR to validate.");
      setStructurePreview(null);
      return;
    }
    setIsParsing(true);
    setParseError(null);
    setStructurePreview(null);
    try {
      const structure = multiSigHook.parseStructure(xdrInput.trim());
      setStructurePreview(structure);
    } catch (err) {
      setParseError(
        err instanceof WalletMultiSigParseError || err instanceof Error
          ? err.message
          : "Failed to parse transaction XDR."
      );
    } finally {
      setIsParsing(false);
    }
  }, [xdrInput, multiSigHook]);

  // ---- build assembly plan ----
  const handleBuildPlan = useCallback(() => {
    if (!structurePreview) {
      setParseError("Validate the transaction XDR first.");
      return;
    }
    const rawKeys = signerInput
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);
    if (rawKeys.length === 0) {
      setParseError("Enter at least one co-signer public key.");
      return;
    }
    setParseError(null);
    try {
      const plan = multiSigHook.planAssembly(xdrInput.trim(), rawKeys);
      onMultiSigPlanReady?.(plan);
      closeModal();
    } catch (err) {
      setParseError(
        err instanceof WalletMultiSigParseError || err instanceof Error
          ? err.message
          : "Failed to build assembly plan."
      );
    }
  }, [
    structurePreview,
    signerInput,
    xdrInput,
    multiSigHook,
    onMultiSigPlanReady,
    closeModal,
  ]);

  // ---- single-sig connect ----
  const handleConnect = useCallback(() => {
    onConnect();
    closeModal();
  }, [onConnect, closeModal]);

  const focusRing =
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 rounded";

  return (
    <>
      {/* Trigger button */}
      <button
        type="button"
        data-testid="wallet-selector-modal-trigger"
        onClick={openModal}
        disabled={isConnecting}
        className={`bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition ${focusRing}`}
      >
        {isConnecting ? (
          <span className="flex items-center gap-2">
            <ButtonSpinner className="h-3.5 w-3.5" />
            Connecting…
          </span>
        ) : (
          "Connect Wallet"
        )}
      </button>

      {/* Modal */}
      {isOpen && (
        <div
          role="presentation"
          data-testid="wallet-selector-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={handleBackdropClick}
          onKeyDown={handleKeyDown}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={modalTitleId}
            data-testid="wallet-selector-modal"
            className="w-full max-w-md bg-gray-900 border border-gray-700 rounded-xl shadow-2xl p-6 flex flex-col gap-5"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2
                id={modalTitleId}
                className="text-lg font-semibold text-gray-100"
              >
                Connect Wallet
              </h2>
              <button
                type="button"
                data-testid="wallet-selector-modal-close"
                onClick={closeModal}
                aria-label="Close wallet selector"
                className={`text-gray-400 hover:text-gray-100 transition text-xl leading-none ${focusRing}`}
              >
                ✕
              </button>
            </div>

            {/* Wallet picker */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor={walletSelectId}
                className="text-sm font-medium text-gray-300"
              >
                Wallet provider
              </label>
              <select
                id={walletSelectId}
                value={selectedWalletId}
                onChange={(e) =>
                  onSelectWallet(e.target.value as SupportedWalletId)
                }
                disabled={isConnecting}
                className={`bg-gray-800 border border-gray-700 text-sm text-gray-200 rounded-lg px-3 py-2 w-full ${focusRing}`}
              >
                {SUPPORTED_WALLETS.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Multi-sig toggle */}
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                data-testid="multisig-toggle"
                checked={multiSigMode}
                onChange={(e) => {
                  setMultiSigMode(e.target.checked);
                  setParseError(null);
                  setStructurePreview(null);
                  setXdrInput("");
                  setSignerInput("");
                }}
                className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-indigo-500 focus:ring-indigo-400"
              />
              <span className="text-sm text-gray-300">
                Multi-signature transaction
              </span>
            </label>

            {/* Multi-sig panel */}
            {multiSigMode && (
              <div
                data-testid="multisig-panel"
                className="flex flex-col gap-4 border border-gray-700 rounded-lg p-4 bg-gray-800/50"
              >
                {/* XDR input */}
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor={xdrInputId}
                    className="text-xs font-medium text-gray-300"
                  >
                    Base transaction XDR
                  </label>
                  <textarea
                    id={xdrInputId}
                    data-testid="xdr-input"
                    value={xdrInput}
                    onChange={(e) => {
                      setXdrInput(e.target.value);
                      setParseError(null);
                      setStructurePreview(null);
                    }}
                    rows={3}
                    placeholder="Paste the base-64 transaction XDR…"
                    className={`bg-gray-900 border border-gray-700 text-xs font-mono text-gray-200 rounded-lg px-3 py-2 resize-none w-full ${focusRing}`}
                  />
                  <button
                    type="button"
                    data-testid="validate-xdr-btn"
                    onClick={handleValidateXdr}
                    disabled={isParsing || !xdrInput.trim()}
                    className={`self-start mt-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition ${focusRing}`}
                  >
                    {isParsing ? (
                      <span className="flex items-center gap-1.5">
                        <ButtonSpinner className="h-3 w-3" />
                        Validating…
                      </span>
                    ) : (
                      "Validate XDR"
                    )}
                  </button>
                  {/* Structure preview */}
                  {structurePreview && (
                    <StructurePreview structure={structurePreview} />
                  )}
                </div>

                {/* Signer keys input */}
                <div className="flex flex-col gap-1">
                  <label
                    htmlFor={signerInputId}
                    className="text-xs font-medium text-gray-300"
                  >
                    Co-signer public keys{" "}
                    <span className="text-gray-500">(comma-separated)</span>
                  </label>
                  <input
                    id={signerInputId}
                    data-testid="signer-input"
                    type="text"
                    value={signerInput}
                    onChange={(e) => {
                      setSignerInput(e.target.value);
                      setParseError(null);
                    }}
                    placeholder="G…, G…"
                    className={`bg-gray-900 border border-gray-700 text-xs font-mono text-gray-200 rounded-lg px-3 py-2 w-full ${focusRing}`}
                  />
                </div>

                {/* Parse / plan error */}
                {parseError && (
                  <p
                    role="alert"
                    data-testid="multisig-error"
                    className="text-xs text-red-400"
                  >
                    {parseError}
                  </p>
                )}

                {/* Build plan button */}
                <button
                  type="button"
                  data-testid="build-plan-btn"
                  onClick={handleBuildPlan}
                  disabled={!structurePreview || !signerInput.trim()}
                  className={`bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition ${focusRing}`}
                >
                  Build assembly plan
                </button>
              </div>
            )}

            {/* Single-sig connect footer */}
            {!multiSigMode && (
              <button
                type="button"
                data-testid="connect-btn"
                onClick={handleConnect}
                disabled={isConnecting}
                className={`bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition w-full ${focusRing}`}
              >
                {isConnecting ? (
                  <span className="flex items-center justify-center gap-2">
                    <ButtonSpinner className="h-3.5 w-3.5" />
                    Connecting…
                  </span>
                ) : (
                  "Connect"
                )}
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
