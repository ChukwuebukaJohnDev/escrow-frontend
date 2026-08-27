import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// Native Vite tsconfig-path resolution. The 40+ test files in __tests__/
// rely on `@/app/...` aliases defined in tsconfig.json (`paths: { "@/*":
// ["./*"] }`); this `resolve.tsconfigPaths` flag replaces the legacy
// `vite-tsconfig-paths` plugin. The flag is nested under `resolve` because
// this Vite version's `ViteUserConfigExport` type only exposes it there
// (the top-level shorthand `tsconfigPaths: true` is rejected by tsc as an
// unknown property and by vitest startup at runtime).
export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    server: {
      deps: {
        // `@stellar/freighter-api` ships only a CommonJS bundle (its
        // package.json declares `main` but no `module`/`exports` ESM entry),
        // so Vite cannot statically resolve the named imports that
        // freighter_connector.ts and the Wallets Kit use — the suite fails
        // to collect with "does not provide an export named 'getAddress'".
        // Inlining it lets Vite transform the CJS bundle and synthesise the
        // named exports.
        inline: ["@stellar/freighter-api", "@creit.tech/stellar-wallets-kit"],
      },
    },
  },
});
