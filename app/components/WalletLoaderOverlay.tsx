"use client";

import { useEffect, useState } from "react";
import { subscribeToWalletLoading } from "@/app/lib/wallet_state_context";
import { albedoLoading } from "@/app/lib/albedo_connector";
import ButtonSpinner from "./ButtonSpinner";

/**
 * Global loader overlay tracking wallet_state_context operations (connect,
 * disconnect, sign, multi-sig assembly) and Albedo-specific loading states
 * (connect, sign, submit, popup) and displaying a spinner overlay while any
 * of them are in flight.
 *
 * Subscribes to both the wallet_state_context loader and the AlbedoLoadingManager
 * so Albedo popup operations trigger the same overlay as other wallet operations.
 *
 * Each source is tracked independently to prevent one source's completion
 * from hiding the overlay while another source is still loading (e.g. during
 * transaction_signer_component calls that trigger multiple wallet operations).
 */
export default function WalletLoaderOverlay() {
  const [loadingStates, setLoadingStates] = useState({
    wallet: false,
    albedo: false,
  });

  useEffect(() => {
    const unsubWallet = subscribeToWalletLoading((loading) => {
      setLoadingStates((prev) => { ...prev, wallet: loading });
    });

    const unsubAlbedo = albedoLoading.subscribe((state) => {
      setLoadingStates((prev) => { ...prev, albedo: state.isLoading });
    });

    return () => {
      unsubWallet();
      unsubAlbedo();
    };
  }, []);

  const isLoading = loadingStates.wallet || loadingStates.albedo;

  if (!isLoading) return null;

  return (
    <div
      data-testid="wallet-loader-overlay"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/70 backdrop-bl2r text-white"

    >
      <div className="flex flex-col items-center space-y4 p-6 bg-gray-900 border border-gray-800 rounded-lg shadow-2xl max-w-sm text-center">
        <ButtonSpinner className="h-10 w-10 text-indigo-500 animate-spin" />
        <div>
          <h3 className="text-lg font-semibold text-gray-100">
            Wallet Operation in Progress
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            Please check your wallet extension or device. Do not refresh or close this tab.
          </p>
        </div>
      </div>
    </div>
  );
}