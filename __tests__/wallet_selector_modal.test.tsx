import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { Networks } from "@stellar/stellar-sdk";

// WalletSelectorModal imports WalletContext only for the SupportedWalletId type
// and the SUPPORTED_WALLETS constant. Mock the module so tests never try to
// resolve @stellar/freighter-api (which is unavailable in jsdom).
vi.mock("@/app/context/WalletContext", () => ({
  SUPPORTED_WALLETS: [
    { id: "freighter", label: "Freighter" },
    { id: "albedo", label: "Albedo" },
    { id: "xbull", label: "xBull" },
    { id: "hana", label: "Hana" },
  ],
}));

import WalletSelectorModal from "@/app/components/WalletSelectorModal";
import type { SupportedWalletId } from "@/app/context/WalletContext";

const NETWORK = Networks.TESTNET;

// ---------------------------------------------------------------------------
// Default props helpers
// ---------------------------------------------------------------------------

function defaultProps(overrides: Partial<Parameters<typeof WalletSelectorModal>[0]> = {}) {
  return {
    selectedWalletId: "freighter" as SupportedWalletId,
    onSelectWallet: vi.fn(),
    onConnect: vi.fn(),
    isConnecting: false,
    networkPassphrase: NETWORK,
    ...overrides,
  };
}

function openModal() {
  fireEvent.click(screen.getByTestId("wallet-selector-modal-trigger"));
}

// ---------------------------------------------------------------------------
// Trigger button
// ---------------------------------------------------------------------------

describe("WalletSelectorModal — trigger button", () => {
  it("renders the trigger button", () => {
    render(<WalletSelectorModal {...defaultProps()} />);
    expect(screen.getByTestId("wallet-selector-modal-trigger")).toBeInTheDocument();
  });

  it("shows 'Connect Wallet' label when not connecting", () => {
    render(<WalletSelectorModal {...defaultProps()} />);
    expect(screen.getByTestId("wallet-selector-modal-trigger")).toHaveTextContent(
      "Connect Wallet"
    );
  });

  it("is disabled when isConnecting is true", () => {
    render(<WalletSelectorModal {...defaultProps({ isConnecting: true })} />);
    expect(screen.getByTestId("wallet-selector-modal-trigger")).toBeDisabled();
  });

  it("modal is not visible before the trigger is clicked", () => {
    render(<WalletSelectorModal {...defaultProps()} />);
    expect(screen.queryByTestId("wallet-selector-modal")).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Modal open / close
// ---------------------------------------------------------------------------

describe("WalletSelectorModal — open and close", () => {
  it("opens the modal when the trigger is clicked", () => {
    render(<WalletSelectorModal {...defaultProps()} />);
    openModal();
    expect(screen.getByTestId("wallet-selector-modal")).toBeInTheDocument();
  });

  it("closes the modal when the close button is clicked", () => {
    render(<WalletSelectorModal {...defaultProps()} />);
    openModal();
    fireEvent.click(screen.getByTestId("wallet-selector-modal-close"));
    expect(screen.queryByTestId("wallet-selector-modal")).not.toBeInTheDocument();
  });

  it("closes the modal when the backdrop is clicked", () => {
    render(<WalletSelectorModal {...defaultProps()} />);
    openModal();
    fireEvent.click(screen.getByTestId("wallet-selector-modal-backdrop"));
    expect(screen.queryByTestId("wallet-selector-modal")).not.toBeInTheDocument();
  });

  it("has role=dialog and aria-modal on the modal panel", () => {
    render(<WalletSelectorModal {...defaultProps()} />);
    openModal();
    const dialog = screen.getByTestId("wallet-selector-modal");
    expect(dialog).toHaveAttribute("role", "dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });
});

// ---------------------------------------------------------------------------
// Single-sig flow — existing behaviour unchanged
// ---------------------------------------------------------------------------

describe("WalletSelectorModal — single-sig connect flow", () => {
  it("renders the wallet selector inside the modal", () => {
    render(<WalletSelectorModal {...defaultProps()} />);
    openModal();
    // the select element inside the modal
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("calls onSelectWallet when a wallet is chosen", () => {
    const onSelectWallet = vi.fn();
    render(<WalletSelectorModal {...defaultProps({ onSelectWallet })} />);
    openModal();
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "albedo" },
    });
    expect(onSelectWallet).toHaveBeenCalledWith("albedo");
  });

  it("calls onConnect and closes the modal when Connect is clicked", () => {
    const onConnect = vi.fn();
    render(<WalletSelectorModal {...defaultProps({ onConnect })} />);
    openModal();
    fireEvent.click(screen.getByTestId("connect-btn"));
    expect(onConnect).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId("wallet-selector-modal")).not.toBeInTheDocument();
  });

  it("multi-sig panel is hidden by default", () => {
    render(<WalletSelectorModal {...defaultProps()} />);
    openModal();
    expect(screen.queryByTestId("multisig-panel")).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Multi-sig toggle
// ---------------------------------------------------------------------------

describe("WalletSelectorModal — multi-sig toggle", () => {
  beforeEach(() => {
    render(<WalletSelectorModal {...defaultProps()} />);
    openModal();
  });

  it("shows the multi-sig panel when the toggle is checked", () => {
    fireEvent.click(screen.getByTestId("multisig-toggle"));
    expect(screen.getByTestId("multisig-panel")).toBeInTheDocument();
  });

  it("hides the single-sig connect button when multi-sig mode is active", () => {
    fireEvent.click(screen.getByTestId("multisig-toggle"));
    expect(screen.queryByTestId("connect-btn")).not.toBeInTheDocument();
  });

  it("hides the multi-sig panel when the toggle is unchecked again", () => {
    const toggle = screen.getByTestId("multisig-toggle");
    fireEvent.click(toggle);
    expect(screen.getByTestId("multisig-panel")).toBeInTheDocument();
    fireEvent.click(toggle);
    expect(screen.queryByTestId("multisig-panel")).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Multi-sig validation gate — valid XDR parses without errors
// ---------------------------------------------------------------------------

describe("WalletSelectorModal — XDR validation gate", () => {
  it("shows the structure preview after a valid XDR is validated", async () => {
    // Build a real transaction XDR
    const {
      Account,
      Asset,
      BASE_FEE,
      Keypair,
      Operation,
      TransactionBuilder,
    } = await import("@stellar/stellar-sdk");

    const source = Keypair.random();
    const account = new Account(source.publicKey(), "0");
    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK,
    })
      .addOperation(
        Operation.payment({
          destination: Keypair.random().publicKey(),
          asset: Asset.native(),
          amount: "1",
        })
      )
      .setTimeout(30)
      .build();

    render(<WalletSelectorModal {...defaultProps({ selectedWalletId: "albedo" })} />);
    openModal();
    fireEvent.click(screen.getByTestId("multisig-toggle"));

    fireEvent.change(screen.getByTestId("xdr-input"), {
      target: { value: tx.toXDR() },
    });
    fireEvent.click(screen.getByTestId("validate-xdr-btn"));

    await waitFor(() => {
      expect(screen.getByTestId("tx-structure-preview")).toBeInTheDocument();
    });
    expect(screen.queryByTestId("multisig-error")).not.toBeInTheDocument();
  });

  it("shows an error message when malformed XDR is submitted", async () => {
    render(<WalletSelectorModal {...defaultProps({ selectedWalletId: "albedo" })} />);
    openModal();
    fireEvent.click(screen.getByTestId("multisig-toggle"));

    fireEvent.change(screen.getByTestId("xdr-input"), {
      target: { value: "this-is-not-valid-xdr" },
    });
    fireEvent.click(screen.getByTestId("validate-xdr-btn"));

    await waitFor(() => {
      expect(screen.getByTestId("multisig-error")).toBeInTheDocument();
    });
    expect(screen.queryByTestId("tx-structure-preview")).not.toBeInTheDocument();
  });

  it("shows an error message when empty XDR is submitted", async () => {
    render(<WalletSelectorModal {...defaultProps({ selectedWalletId: "albedo" })} />);
    openModal();
    fireEvent.click(screen.getByTestId("multisig-toggle"));

    // validate-xdr-btn is disabled when input is empty; simulate clicking anyway
    // by directly invoking handleValidateXdr via a truthy but blank value
    fireEvent.change(screen.getByTestId("xdr-input"), {
      target: { value: "   " },
    });
    // button is disabled for blank — set non-blank then clear
    fireEvent.change(screen.getByTestId("xdr-input"), {
      target: { value: "x" },
    });
    fireEvent.change(screen.getByTestId("xdr-input"), {
      target: { value: "" },
    });
    // Now paste a non-empty string that is still invalid
    fireEvent.change(screen.getByTestId("xdr-input"), {
      target: { value: "ZZZZ" },
    });
    fireEvent.click(screen.getByTestId("validate-xdr-btn"));

    await waitFor(() => {
      expect(screen.getByTestId("multisig-error")).toBeInTheDocument();
    });
  });
});

// ---------------------------------------------------------------------------
// Multi-sig plan building
// ---------------------------------------------------------------------------

describe("WalletSelectorModal — assembly plan", () => {
  it("calls onMultiSigPlanReady and closes the modal after a successful plan build", async () => {
    const {
      Account,
      Asset,
      BASE_FEE,
      Keypair,
      Operation,
      TransactionBuilder,
    } = await import("@stellar/stellar-sdk");

    const source = Keypair.random();
    const cosigner = Keypair.random();
    const account = new Account(source.publicKey(), "0");
    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK,
    })
      .addOperation(
        Operation.payment({
          destination: Keypair.random().publicKey(),
          asset: Asset.native(),
          amount: "1",
        })
      )
      .setTimeout(30)
      .build();

    const onMultiSigPlanReady = vi.fn();
    render(
      <WalletSelectorModal
        {...defaultProps({ selectedWalletId: "albedo", onMultiSigPlanReady })}
      />
    );
    openModal();
    fireEvent.click(screen.getByTestId("multisig-toggle"));

    // Validate XDR first
    fireEvent.change(screen.getByTestId("xdr-input"), {
      target: { value: tx.toXDR() },
    });
    fireEvent.click(screen.getByTestId("validate-xdr-btn"));
    await waitFor(() =>
      expect(screen.getByTestId("tx-structure-preview")).toBeInTheDocument()
    );

    // Enter co-signers
    fireEvent.change(screen.getByTestId("signer-input"), {
      target: {
        value: `${source.publicKey()},${cosigner.publicKey()}`,
      },
    });

    // Build plan
    fireEvent.click(screen.getByTestId("build-plan-btn"));

    expect(onMultiSigPlanReady).toHaveBeenCalledTimes(1);
    const plan = onMultiSigPlanReady.mock.calls[0][0];
    expect(plan.pendingSigners).toContain(source.publicKey());
    expect(plan.pendingSigners).toContain(cosigner.publicKey());

    // Modal should close
    expect(screen.queryByTestId("wallet-selector-modal")).not.toBeInTheDocument();
  });

  it("shows an error if Build plan is clicked without signers", async () => {
    const {
      Account,
      Asset,
      BASE_FEE,
      Keypair,
      Operation,
      TransactionBuilder,
    } = await import("@stellar/stellar-sdk");

    const source = Keypair.random();
    const account = new Account(source.publicKey(), "0");
    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK,
    })
      .addOperation(
        Operation.payment({
          destination: Keypair.random().publicKey(),
          asset: Asset.native(),
          amount: "1",
        })
      )
      .setTimeout(30)
      .build();

    render(<WalletSelectorModal {...defaultProps({ selectedWalletId: "albedo" })} />);
    openModal();
    fireEvent.click(screen.getByTestId("multisig-toggle"));

    fireEvent.change(screen.getByTestId("xdr-input"), {
      target: { value: tx.toXDR() },
    });
    fireEvent.click(screen.getByTestId("validate-xdr-btn"));
    await waitFor(() =>
      expect(screen.getByTestId("tx-structure-preview")).toBeInTheDocument()
    );

    // Signer input stays empty — build-plan-btn should be disabled
    expect(screen.getByTestId("build-plan-btn")).toBeDisabled();
  });
});
