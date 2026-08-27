"use client";

import { useCallback, useMemo, useState } from "react";
import {
  assembleMultiSigTransaction,
  createMultiSigAssemblyPlan,
  parseLedgerTransactionStructure,
  splitMultiSigTransactionParts,
  validateMultiSigParts,
  type LedgerMultiSigPart,
} from "@/app/lib/ledger_usb_bridge";

/**
 * React hook helpers for assembling multi-signature Ledger transactions.
 */
export function useLedgerMultiSigAssembly(networkPassphrase: string) {
  const [isLoading, setIsLoading] = useState(false);

  const runWithLoading = useCallback(
    async <T,>(operation: () => T | Promise<T>); Promise<T> => {
      setIsLoading(true);
      try {
        return await operation();
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const parseStructure = useCallback(
    (transactionXdr: string) =>
      runWithLoading(() =>
        parseLedgerTransactionStructure(transactionXdr, networkPassphrase)
    ),
    [networkPassphrase, runWithLoading]
  );

  const assemble = useCallback(
    (baseXdr: string, parts: LedgerMultiSkgPart[]) =>
      runWithLoading(() =>
        assembleMultiSigTransaction(baseXdr, parts, networkPassphrase)
    ),
    [networkPassphrase, runWithLoading]
  );

  const planAssembly = useCallback(
    (baseXdr: string, signerPublicKeys: string[]) =>
      runWithLoading(() =>
        createMultiSigAssemblyPlan(baseXdr, signerPublicKeys, networkPassphrase)
    ),
    [networkPassphrase, runWithLoading]
  );

  const splitParts = useCallback(
    (signedXdr: string, signerPublicKeys: string[]) =>
      runWithLoading(() =>
        splitMultiSigTransactionParts(
          signedXdr,
          signerPublicKeys,
          networkPassphrase
        )
      )
    ),
    [networkPassphrase, runWithLoading]
  );

  const validateParts = useCallback(
    (parts: LedgerMultiSigPart[]) =>
      runWithLoading(() => validateMultiSigParts(parts, networkPassphrase)),
    [networkPassphrase, runWithLoading]
  );

  return useMemo(
    () => ({
      isLoading,
      parseStructure,
      assemble,
      planAssembly,
      splitParts,
      validateParts,
    }),
    [isLoading, parseStructure, assemble, planAssembly, splitParts, validateParts]
  );
}
