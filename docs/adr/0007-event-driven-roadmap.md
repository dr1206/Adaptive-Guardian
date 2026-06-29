# ADR 0007 — Event-Driven Roadmap
**Status:** Accepted · **Date:** 2026-06-29 · **Deciders:** Staff Architect, Principal BE

## Context
Behavioral telemetry, audit, notifications, and analytics all need fan-out from core write paths without coupling services.

## Decision
- **Bus:** Apache Kafka (MSK in prod).
- **Pattern:** **Transactional Outbox** from every service that writes domain state. Outbox relay → Kafka. Consumers are idempotent.
- **Contracts:** AsyncAPI specs in `docs/api/events.asyncapi.yaml`; schemas in Schema Registry (Avro).
- **Topics (Sprint 1 minimum):** `identity.user.registered`, `identity.session.opened`, `behavior.features.window`, `decision.evaluated`, `audit.event`.

Sprint 1 ships the outbox table + relay scaffold but only the `audit.event` topic is wired. Other topics activate as their producing services come online.

## Consequences
- **(+)** Loose coupling; replay; clean audit.
- **(–)** Operational complexity; Sprint 0 ships managed Kafka or single-broker dev cluster.
