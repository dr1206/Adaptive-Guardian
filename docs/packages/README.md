# Workspace Packages

Sprint 1A introduces 12 shared packages under `packages/`. Each is documented here as a contract; source materializes inside this repo at `src/lib/<package>/` during Sprint 1A and hoists to real workspaces at the Sprint 1A close-out migration.

| Package                          | Purpose                                                                    | Owner       | Public API                                                                    |
| -------------------------------- | -------------------------------------------------------------------------- | ----------- | ----------------------------------------------------------------------------- |
| `@adaptiveguard/tokens`          | Design tokens (color, type, motion, spacing) as CSS vars + JSON + TS types | FE Platform | `tokens.css`, `tokens.json`, `import { tokens } from '@adaptiveguard/tokens'` |
| `@adaptiveguard/ui`              | Shared React primitives + Storybook stories                                | FE Platform | Named exports per primitive                                                   |
| `@adaptiveguard/types`           | Cross-cutting domain TS types                                              | FE Platform | `User`, `Account`, `Session`, `RiskScore`, `BehavioralFeature`, ...           |
| `@adaptiveguard/contracts`       | Generated OpenAPI/AsyncAPI clients                                         | FE Platform | `identityClient`, `bankingClient`, Avro types                                 |
| `@adaptiveguard/config`          | Shared eslint/biome/tsconfig/prettier                                      | Platform    | Preset exports                                                                |
| `@adaptiveguard/env`             | Zod-validated env loader                                                   | Platform    | `loadEnv(schema)`                                                             |
| `@adaptiveguard/logger`          | Isomorphic structured logger                                               | SRE         | `createLogger({ service })`                                                   |
| `@adaptiveguard/errors`          | `AppError` hierarchy + HTTP mapping                                        | BE Platform | `AppError`, subclasses, `toResponse(err)`                                     |
| `@adaptiveguard/flags`           | LaunchDarkly client + local fallback                                       | Platform    | `useFlag(key)`, `evalFlag(key, ctx)`                                          |
| `@adaptiveguard/otel`            | OpenTelemetry wiring (FE + BE)                                             | SRE         | `initOtel({ service })`, `withSpan(name, fn)`                                 |
| `@adaptiveguard/auth-middleware` | JWT verify + RLS context                                                   | BE Platform | Middleware factories per runtime                                              |
| `@adaptiveguard/db`              | pg.Pool wrapper + RLS session var                                          | BE Platform | `getPool()`, `withTx(fn)`                                                     |

See each package's `README.md` (generated D2) for usage. Lint rule
`no-restricted-imports` enforces that app code reaches infra through these
packages — never directly through `process.env`, `console`, or vendor SDKs.
