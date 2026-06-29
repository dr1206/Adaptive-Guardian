/**
 * @adaptiveguard/platform — barrel
 *
 * Single import surface for app code reaching foundation primitives.
 * Direct imports from vendor SDKs (LaunchDarkly, Sentry, pg, etc.) outside
 * these modules are a lint error once the workspace migration ships.
 */

export * from "./env";
export * from "./logger";
export * from "./errors";
export * from "./flags";
export * from "./observability";
export * from "./auth-middleware";
