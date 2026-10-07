# ADR 0008 — Deployment Strategy: Docker Compose (EKS + ArgoCD Deferred)

> **Scoped by ADR-0015:** EKS + ArgoCD GitOps are deferred to the production pathway. This project deploys via Docker Compose on a single host. See ADR-0015.

**Status:** Accepted · **Date:** 2026-06-29 · **Deciders:** DevOps Lead, Staff Architect

## Context

Multi-service backend, regulated industry, need for reproducible environments and clear audit of every change to production.

## Decision

- **Compute:** AWS EKS (managed K8s), one cluster per environment (dev, staging, prod).
- **GitOps:** ArgoCD reconciles `infra/` manifests; production deploys are PR-merge → Argo sync. No `kubectl apply` from laptops.
- **IaC:** Terraform for AWS primitives; Helm + Kustomize for K8s manifests.
- **Frontend:** TanStack Start app deployed to Cloudflare Workers via Lovable Cloud during early sprints; Workers (or CloudFront + Lambda@Edge) for GA.
- **Preview envs:** per-PR namespace + ephemeral DB, 48 h TTL (extend via `preview/keep` label).
- **Observability:** OpenTelemetry → Datadog; Sentry for FE/BE error tracking.

## Consequences

- **(+)** Auditable, reproducible, rollback by `git revert`.
- **(–)** EKS learning curve; mitigated by Helm charts authored in Sprint 0.

## Alternatives

- **ECS Fargate** — simpler, less powerful; rejected for ML serving needs.
- **Self-managed K8s** — too much ops cost for current headcount.
