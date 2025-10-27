/**
 * Express Error Handler Middleware
 *
 * Transforms Effect domain errors into well-formatted HTTP responses.
 * This middleware must be registered LAST in the Express middleware chain
 * to catch all errors from routes and other middleware.
 *
 * Features:
 * - Maps domain errors to appropriate HTTP status codes
 * - Formats errors for i18n support (_tag + details)
 * - Reports unexpected errors (5xx) to Sentry
 * - Logs errors for observability
 * - Preserves error context for debugging
 */

import * as Sentry from "@sentry/node";
import type { NextFunction, Request, Response } from "express";
import {
  formatErrorResponse,
  generateTraceId,
  getStatusCode,
  isTaggedError,
  shouldReportToSentry,
} from "../lib/ErrorMapper.ts";

/**
 * Express error middleware signature: (err, req, res, next)
 * Must have all 4 parameters for Express to recognize it as error handler
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  // Determine error tag (for logging and status code mapping)
  let errorTag = "InternalError";
  if (isTaggedError(err)) {
    errorTag = err._tag;
  }

  // Map error to HTTP status code
  const statusCode = getStatusCode(errorTag);

  // Log error for observability
  // Domain errors (4xx): minimal logging without stack trace
  // System errors (5xx): full logging with stack trace
  if (statusCode >= 500) {
    // Unexpected error: log full details including stack trace
    console.error(`[Error Handler] ${errorTag} → ${statusCode}`, {
      error: err,
    });
  } else {
    // Expected domain error: clean minimal log
    console.log(
      `[Error Handler] ${errorTag} → ${statusCode}`,
      isTaggedError(err) ? JSON.stringify(err) : String(err),
    );
  }

  // Report unexpected errors to Sentry (5xx only)
  if (shouldReportToSentry(errorTag)) {
    // Generate trace ID for support correlation
    const traceId = generateTraceId();

    // Capture exception with trace ID for correlation
    Sentry.captureException(err, {
      tags: {
        error_tag: errorTag,
        trace_id: traceId,
      },
    });

    // For 500 errors, include trace ID in response
    return res.status(statusCode).json({
      error: {
        _tag: errorTag,
        message: "Internal server error",
        details: {
          traceId, // Users can report this to support
        },
      },
    });
  }

  // Format domain error into standard response
  const errorResponse = formatErrorResponse(err);

  // Send formatted error response
  res.status(statusCode).json(errorResponse);
}
