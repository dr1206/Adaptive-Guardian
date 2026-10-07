# Database Design — MongoDB Atlas Document Model

**Engine:** MongoDB Atlas (M0 free tier) · **Cache/Session:** Redis 7 · **Object Store:** MinIO

## Collections

All collections live in the `adaptive_guardian` database. MongoDB Atlas handles all document storage. No relational schemas — the document model matches the heterogeneous nature of behavioral biometrics data.

## Sprint 1 Core Document Model

```
┌─────────────────────────────────────────────────────────────┐
│  users                                                       │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ _id: ObjectId                                           ││
│  │ email: string (unique index)                            ││
│  │ password_hash: string                                   ││
│  │ full_name: string                                       ││
│  │ is_active: bool                                         ││
│  │ roles: [string]           ← embedded, no join needed    ││
│  │ created_at: ISODate                                     ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  sessions                                                    │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ _id: ObjectId                                           ││
│  │ user_id: UUID                                           ││
│  │ refresh_token_hash: string (index)                      ││
│  │ device_fingerprint: string                              ││
│  │ expires_at: ISODate (TTL index)                         ││
│  │ revoked: bool                                           ││
│  │ created_at: ISODate                                     ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  otp_challenges                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ _id: ObjectId                                           ││
│  │ user_id: UUID                                           ││
│  │ code_hash: string                                       ││
│  │ purpose: "register"|"login"|"step_up"                  ││
│  │ expires_at: ISODate (TTL index)                         ││
│  │ attempts: int (max 5)                                   ││
│  │ verified: bool                                          ││
│  │ consumed_at: ISODate                                    ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  behavior_baselines (one doc per user)                       │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ _id: ObjectId                                           ││
│  │ user_id: UUID (unique index)                            ││
│  │ keyboard_profile: { ... }  ← heterogeneous features     ││
│  │ mouse_profile: { ... }     ← heterogeneous features     ││
│  │ confidence: float                                       ││
│  │ profile_windows_count: int                              ││
│  │ updated_at: ISODate                                     ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  behavior_windows                                            │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ _id: ObjectId                                           ││
│  │ session_id: UUID                                        ││
│  │ window_start: ISODate                                   ││
│  │ window_end: ISODate                                     ││
│  │ features: { ... }         ← variable feature vector     ││
│  │ created_at: ISODate                                     ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  decisions                                                   │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ _id: ObjectId                                           ││
│  │ session_id: UUID                                        ││
│  │ outcome: "allow"|"challenge"|"step_up"|"block"         ││
│  │ score: float                                            ││
│  │ top_contributors: [{ name, contribution }]              ││
│  │ evaluated_at: ISODate                                   ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  device_profiles                                             │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ _id: ObjectId                                           ││
│  │ user_id: UUID                                           ││
│  │ fingerprint: string                                     ││
│  │ label: string                                           ││
│  │ kind: "laptop"|"phone"|"tablet"|"desktop"              ││
│  │ os: string                                              ││
│  │ browser: string                                         ││
│  │ trust: "trusted"|"recognized"|"new"                    ││
│  │ last_active: ISODate                                    ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  audit_events                                                │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ _id: ObjectId                                           ││
│  │ actor_type: string                                      ││
│  │ actor_id: UUID                                          ││
│  │ action: string                                          ││
│  │ target: string                                          ││
│  │ payload: { ... }                                        ││
│  │ prev_hash: string                                       ││
│  │ hash: string (sha256 chain)                             ││
│  │ occurred_at: ISODate                                    ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

## Indexes

| Collection           | Index                                   | Reason                   |
| -------------------- | --------------------------------------- | ------------------------ |
| `users`              | `{ email: 1 }` unique                   | Lookup, uniqueness       |
| `users`              | `{ roles: 1 }`                          | Admin user queries       |
| `sessions`           | `{ refresh_token_hash: 1 }`             | Refresh rotation         |
| `sessions`           | `{ user_id: 1, revoked: 1 }`            | Active sessions          |
| `sessions`           | `{ expires_at: 1 }` TTL                 | Auto-expire sessions     |
| `otp_challenges`     | `{ user_id: 1, purpose: 1 }`            | Latest unconsumed lookup |
| `otp_challenges`     | `{ expires_at: 1 }` TTL                 | Auto-purge               |
| `behavior_baselines` | `{ user_id: 1 }` unique                 | One baseline per user    |
| `behavior_windows`   | `{ session_id: 1, window_start: -1 }`   | Recent windows           |
| `behavior_windows`   | `{ created_at: 1 }` TTL                 | Retention policy         |
| `decisions`          | `{ session_id: 1, evaluated_at: -1 }`   | Session timeline         |
| `device_profiles`    | `{ user_id: 1, fingerprint: 1 }` unique | Dedup devices            |
| `audit_events`       | `{ occurred_at: -1 }`                   | Audit scans              |
| `audit_events`       | `{ actor_id: 1, occurred_at: -1 }`      | Per-actor audit          |

## Constraints (Application Layer)

- `users.email` unique index, format validated via Pydantic EmailStr.
- `otp_challenges.attempts` validated in service layer (0–5).
- `decisions.outcome` validated via Pydantic Literal enum.
- `sessions.expires_at` enforced via MongoDB TTL index — auto-deletion after expiry.
- Access control enforced at the API/middleware layer (JWT claims → user-scoped queries).

## Retention

| Data               | MongoDB               | Retention                            |
| ------------------ | --------------------- | ------------------------------------ |
| OTP challenges     | TTL index (24h)       | Auto-deleted after 24h               |
| Sessions           | TTL index (30d)       | Auto-deleted after 30d               |
| Behavior windows   | TTL index (7d)        | Auto-deleted after 7d                |
| Behavior baselines | Indefinite (per user) | Until deletion request               |
| Decisions          | TTL index (90d)       | Auto-deleted after 90d               |
| Audit events       | TTL index (90d)       | Warm after 90d; cold export to MinIO |

User-initiated deletion (GDPR Art. 17): Delete user document + cascade-delete all associated collections. Audit retains anonymized hashes.

## Encryption Strategy

- **At rest:** MongoDB Atlas encryption-at-rest (enabled by default on all tiers).
- **Field-level:** `password_hash` (bcrypt), `otp_challenges.code_hash` (HMAC-SHA256), `sessions.refresh_token_hash` (HMAC-SHA256).
- **In transit:** TLS 1.3; Atlas connection strings use `mongodb+srv://` with mandatory TLS.

## Audit Strategy

- `audit_events` is append-only. `hash = sha256(prev_hash || canonical_json(payload))`.
- Chain verification: hourly job walks the hash chain and alerts on break.
- Daily anchor: latest hash exported to MinIO as a tamper-evident checkpoint.

## Data Access Layer

- **Driver:** Motor 3.x (async MongoDB)
- **ODM:** Beanie 1.27+ (Pydantic v2 compatible)
- **Index management:** Beanie declarative indexes in Document `Settings` class
- **Migrations:** Beanie migration engine for index lifecycle; application-level data migrations for document shape changes
