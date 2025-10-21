# Fidudoc Storage Component – Tech Stack Summary

## Overview

The Fidudoc Storage component is a secure, multi-tenant backend service that manages document storage, access control, and integration with the inspection workflows. It focuses on stability, clear domain boundaries, and full observability.

---

## Core Technologies

| Layer                                  | Technology                  | Purpose                                                                                          |
| -------------------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------ |
| **Runtime Environment**                | **Node.js 23+ (LTS)**       | Stable JavaScript/TypeScript runtime for all backend services.                                   |
| **Web Framework**                      | **Express**                 | HTTP routing, middleware, and request handling for API endpoints.                                |
| **Business Logic Layer**               | **Effect (TypeScript)**     | Structured domain logic, typed services, controlled side effects, and consistent error handling. |
| **Schema & Types**                     | **effect/Schema**           | Input/output validation, API contract definition, and type generation.                           |
| **Authentication**                     | **Supabase Auth**           | JWT-based identity provider for user and tenant authentication.                                  |
| **Authorization**                      | **Casbin**                  | Policy-based access control (RBAC with multi-tenant domain scoping).                             |
| **Object Storage**                     | **Supabase Storage**        | Persistent file storage for uploaded documents.                                                  |
| **Metadata Storage**                   | **Supabase Postgres**       | Structured database for file metadata, audit trails, and access records.                         |
| **Telemetry & Monitoring**             | **Sentry**                  | Centralized error tracking, tracing, and performance metrics.                                    |
| **Background Workflows (Integration)** | **Trigger.dev** _(planned)_ | Orchestration of asynchronous or long-running document processing tasks.                         |

---

## Design Principles

- **Separation of concerns:** Express for routing, Effect for domain logic, Casbin for authorization.
- **Type safety and validation:** effect/Schema ensures strong runtime and compile-time guarantees.
- **Secure multi-tenancy:** Authorization and storage operations are scoped by tenant domain.
- **Observability by default:** Sentry monitors both operational and application-level errors.
- **Supabase-centric integration:** Unified platform for authentication, storage, and database operations.
