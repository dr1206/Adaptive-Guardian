/**
 * Service registry.
 *
 * Resolves the four domain services to a concrete implementation at module
 * load time. Add real HTTP impls under `./<domain>/<domain>.http.ts`,
 * mirror the contract, and flip `VITE_USE_REAL_API=true` to switch.
 *
 * The registry is intentionally synchronous — no async init, no DI
 * framework — so components can call `services.banking.listAccounts()`
 * without lifecycle ceremony. Mocks resolve as Promises so the signature
 * matches the future HTTP impl.
 */

import { loadClientEnv } from "../lib/platform/env";
import { createLogger } from "../lib/platform/logger";

import type { AuthService } from "./auth/auth.contract";
import type { BankingService } from "./banking/banking.contract";
import type { AegisService } from "./aegis/aegis.contract";
import type { AdminService } from "./admin/admin.contract";

import { mockAuthService } from "./auth/auth.mock";
import { mockBankingService } from "./banking/banking.mock";
import { mockAegisService } from "./aegis/aegis.mock";
import { mockAdminService } from "./admin/admin.mock";

const log = createLogger({ service: "services" });

export type ServiceMode = "mock" | "http";

export interface Services {
  auth: AuthService;
  banking: BankingService;
  aegis: AegisService;
  admin: AdminService;
}

function resolveMode(): ServiceMode {
  // VITE_USE_REAL_API is a build-time flag — the real backend lives outside
  // this Lovable preview and will be wired up locally with Claude.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const meta = (import.meta as any).env ?? {};
  return meta.VITE_USE_REAL_API === "true" ? "http" : "mock";
}

const mode: ServiceMode = resolveMode();
const env = loadClientEnv();

if (mode === "http") {
  // Future: import("./http") will register real adapters. For now we keep
  // the contract loud — flipping the flag before adapters land is a bug.
  log.warn(
    { event: "services.mode.http.unimplemented", payload: { env: env.appEnv } },
    "Real HTTP services not yet wired — falling back to mocks.",
  );
}

export const services: Services = {
  auth: mockAuthService,
  banking: mockBankingService,
  aegis: mockAegisService,
  admin: mockAdminService,
};

export function getServiceMode(): ServiceMode {
  return mode;
}

log.info(
  { event: "services.boot", payload: { mode, env: env.appEnv } },
  "Service registry initialized",
);
