# Runbook Template — `<service-name>`

**Owner:** `<team>` · **On-call:** PagerDuty schedule `<name>` · **Tier:** `<1|2|3>`

Copy this file to `docs/runbooks/<service>.md` before a service can be on-call.

---

## 1. What this service does

One-paragraph plain-English description. Include the SLOs.

## 2. Dashboards

- Datadog: `<link>`
- Sentry: `<link>`
- Jaeger sample trace: `<link>`

## 3. Key alerts

| Alert                    | Symptom                  | First action                                  |
| ------------------------ | ------------------------ | --------------------------------------------- |
| `<svc>.error_rate.high`  | 5xx > 2% for 5m          | Check Sentry releases tab for a recent deploy |
| `<svc>.latency.p99.high` | p99 > 1s for 10m         | Check downstream dependency dashboard         |
| `<svc>.queue.lag.high`   | Kafka consumer lag > 10k | Scale consumers; check for poison message     |

## 4. Common procedures

### 4.1 Rolling back a deploy

```bash
argocd app rollback adaptiveguard-<svc>-prod
```

### 4.2 Draining a node

...

### 4.3 Replaying from outbox

...

## 5. Known issues

- ...

## 6. Escalation

L1 (on-call) → L2 (service owner) → L3 (Staff Architect). 15 min between tiers for a Sev1.
