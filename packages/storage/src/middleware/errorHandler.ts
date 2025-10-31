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

function extractErrorDetails(error: unknown) {
  if (error && typeof error === "object") {
    const { cause, message } = error as { cause?: unknown; message?: string };
    return {
      cause,
      message: typeof message === "string"
        ? message
        : error instanceof Error
        ? error.message
        : undefined,
    };
  }

  if (error instanceof Error) {
    return { cause: error.cause, message: error.message };
  }

  return { cause: undefined, message: undefined };
}

function buildRequestContext(req: Request, res: Response) {
  return res.locals?.requestContext ?? {
    method: req.method,
    url: req.url,
    query: req.query,
    params: req.params,
  };
}

function logError(
  statusCode: number,
  errorTag: string,
  err: unknown,
  message: string | undefined,
  sanitizedCause: unknown,
  requestContext: unknown,
) {
  if (statusCode >= 500) {
    console.error(`[Error Handler] ${errorTag} → ${statusCode}`, {
      message: message ?? (err instanceof Error ? err.message : String(err)),
      cause: sanitizedCause,
      stack: err instanceof Error ? err.stack : undefined,
      request: requestContext,
    });
    return;
  }

  console.log(
    `[Error Handler] ${errorTag} → ${statusCode}`,
    isTaggedError(err)
      ? JSON.stringify({
        ...err,
        cause: sanitizedCause,
        request: requestContext,
      })
      : String(err),
  );
}

function reportErrorToSentry(
  err: unknown,
  errorTag: string,
  message: string | undefined,
  originalCause: unknown,
  sanitizedCause: unknown,
  requestContext: unknown,
) {
  const traceId = generateTraceId();

  const sentryError = err instanceof Error
    ? err
    : new Error(message ?? errorTag, { cause: originalCause });

  Sentry.captureException(sentryError, {
    tags: {
      error_tag: errorTag,
      trace_id: traceId,
    },
    extra: {
      originalError: err,
      cause: sanitizedCause,
      request: requestContext,
    },
  });

  return traceId;
}

/**
 * Express error middleware signature: (err, req, res, next)
 * Must have all 4 parameters for Express to recognize it as error handler
 */
export function errorHandler(
  err: unknown,
  req: Request,
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

  const { cause, message } = extractErrorDetails(err);
  const sanitizedCause = cause instanceof Error
    ? {
      name: cause.name,
      message: cause.message,
      stack: cause.stack,
    }
    : cause;
  const requestContext = buildRequestContext(req, res);

  // Log error for observability
  // Domain errors (4xx): minimal logging without stack trace
  // System errors (5xx): full logging with stack trace
  logError(statusCode, errorTag, err, message, sanitizedCause, requestContext);

  // Report unexpected errors to Sentry (5xx only)
  if (shouldReportToSentry(errorTag)) {
    const traceId = reportErrorToSentry(
      err,
      errorTag,
      message,
      cause,
      sanitizedCause,
      requestContext,
    );

    return res.status(statusCode).json({
      error: {
        _tag: errorTag,
        message: "Internal server error",
        details: {
          traceId,
        },
      },
    });
  }

  // Format domain error into standard response
  const errorResponse = formatErrorResponse(err);

  // Send formatted error response
  return res.status(statusCode).json(errorResponse);
}
