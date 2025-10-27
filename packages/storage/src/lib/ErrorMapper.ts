/**
 * Error Mapper - Pure utilities for transforming domain errors to HTTP responses
 *
 * This module provides type-safe error handling utilities that:
 * - Map domain errors to HTTP status codes
 * - Format errors for i18n-friendly responses
 * - Determine which errors should be reported to Sentry
 * - Preserve error tags and details for frontend processing
 */

import type { ParseError } from "effect/ParseResult";

/**
 * Standard error response format for API responses
 * Designed for frontend i18n: _tag maps to translation key, details for interpolation
 */
export interface ErrorResponse {
  error: {
    _tag: string;
    message: string;
    details: Record<string, unknown>;
  };
}

/**
 * Type guard: Check if error is an Effect tagged error (domain error)
 */
export function isTaggedError(
  error: unknown,
): error is { _tag: string; [key: string]: unknown } {
  return (
    typeof error === "object"
    && error !== null
    && "_tag" in error
    && typeof error._tag === "string"
  );
}

/**
 * Type guard: Check if error is an Effect ParseError (schema validation failure)
 */
export function isParseError(error: unknown): error is ParseError {
  return (
    typeof error === "object"
    && error !== null
    && "_tag" in error
    && error._tag === "ParseError"
  );
}

/**
 * Map domain error tag to HTTP status code
 * Follows the principle: minimal, meaningful business errors only
 */
export function getStatusCode(errorTag: string): number {
  switch (errorTag) {
    // Domain errors (expected business failures)
    case "UserNotFound":
      return 404;

    // Framework errors (future implementation)
    case "Unauthorized":
      return 401;
    case "Forbidden":
      return 403;

    // Internal/unexpected errors
    default:
      return 500;
  }
}

/**
 * Format domain error into standardized API response
 * Preserves error tag for frontend i18n key mapping
 */
export function formatErrorResponse(error: unknown): ErrorResponse {
  if (isTaggedError(error)) {
    // Extract all properties except _tag for details
    const { _tag, ...details } = error;

    return {
      error: {
        _tag,
        message: getErrorMessage(_tag),
        details: details as Record<string, unknown>,
      },
    };
  }

  // Fallback for non-tagged errors (shouldn't happen in normal flow)
  return {
    error: {
      _tag: "InternalError",
      message: "Internal server error",
      details: {},
    },
  };
}

/**
 * Get human-readable error message (fallback for frontend)
 * Frontend should use _tag for i18n, this is backup
 */
function getErrorMessage(errorTag: string): string {
  switch (errorTag) {
    case "UserNotFound":
      return "User not found";
    case "Unauthorized":
      return "Authentication required";
    case "Forbidden":
      return "Access denied";
    case "InternalError":
      return "Internal server error";
    default:
      return "An error occurred";
  }
}

/**
 * Determine if error should be reported to Sentry
 * Only report unexpected errors (5xx), not expected domain errors
 */
export function shouldReportToSentry(errorTag: string): boolean {
  // Domain errors are expected - don't report
  const expectedErrors = ["UserNotFound", "Unauthorized", "Forbidden"];

  if (expectedErrors.includes(errorTag)) {
    return false;
  }

  // Report internal/unexpected errors
  return true;
}

/**
 * Generate unique trace ID for error correlation
 * Used in 500 responses so users can report issues to support
 */
export function generateTraceId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}
