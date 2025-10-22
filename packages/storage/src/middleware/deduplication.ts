/**
 * Middleware to deduplicate requests based on user ID and document ID.
 * If a duplicate request is detected, it responds with the stored response.
 * Adds header field when caching is used.
 */

import type { NextFunction, Request, Response } from "express";
import * as crypto from "node:crypto";

/**
 * Record stored for each unique request in the cache
 */
interface RequestRecord {
  /** Timestamp when the request was first seen */
  timestamp: number;
  /** Promise that resolves when the request completes */
  promise: Promise<unknown>;
  /** When this cache entry expires */
  expiresAt: number;
}

/**
 * In-memory store for recent requests.
 * Map key is the request signature, value is the RequestRecord.
 */
const requestStore = new Map<string, RequestRecord>();

/**
 * How long to keep in-flight requests in the cache (in milliseconds)
 * @default 5000
 */
const inFlightTtl = process.env.CACHE_TTL
  ? parseInt(process.env.CACHE_TTL, 10)
  : 5000;

/**
 * Cleanup interval - removes expired entries periodically (in milliseconds)
 * @default 60000
 */
const cleanupIntervalMs = process.env.CACHE_CLEANUP_INTERVAL
  ? parseInt(process.env.CACHE_CLEANUP_INTERVAL, 10)
  : 60000;

/**
 * Cleanup interval - removes old entries periodically
 */
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [key, value] of requestStore.entries()) {
    if (now > value.expiresAt) {
      requestStore.delete(key);
    }
  }
}, cleanupIntervalMs);

/**
 * Generate a unique signature for a request
 * @param req - Express request object
 * @returns MD5 hash signature of the request
 */
const getRequestSignature = (req: Request): string => {
  const { method, originalUrl, headers, body } = req;

  const signatureContent = {
    method,
    path: originalUrl,
    body: method !== "GET" ? body : undefined,
    contentType: headers["content-type"],
  };

  return crypto
    .createHash("md5")
    .update(JSON.stringify(signatureContent))
    .digest("hex");
};

/**
 * Middleware to prevent duplicate request processing.
 *
 * When a duplicate request is detected (same method, path, body, content-type):
 * - Waits for the original request to complete using Promise-based approach
 * - Returns the cached response without re-processing
 *
 * Adds `X-Cache-Status` header:
 * - "miss" for original requests
 * - "hit" for cached responses
 *
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const deduplicateRequests = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  /** Skip deduplication for health check endpoints */
  if (req.path === "/health" || req.path.startsWith("/api/health")) {
    return next();
  }

  const signature = getRequestSignature(req);
  const now = Date.now();
  const existingRequest = requestStore.get(signature);

  /** Check if entry exists and hasn't expired */
  if (existingRequest && now <= existingRequest.expiresAt) {
    /** Duplicate request: wait for the original to complete */
    existingRequest.promise
      .then((responseData) => {
        res.setHeader("X-Cache-Status", "hit");
        res.status(200).json(responseData);
      })
      .catch(() => {
        /** If original request failed, process this one normally */
        next();
      });
    return;
  }

  /** First request: create a promise that duplicates will wait for */
  let resolveResponse: (value: unknown) => void;
  let rejectResponse: (reason?: unknown) => void;

  const promise = new Promise<unknown>((resolve, reject) => {
    resolveResponse = resolve;
    rejectResponse = reject;
  });

  requestStore.set(signature, {
    timestamp: now,
    promise,
    expiresAt: now + inFlightTtl,
  });

  const originalSend = res.send.bind(res);

  /** Intercept res.send to capture and resolve the response */
  res.send = function(this: Response, body: unknown) {
    resolveResponse?.(body);
    this.setHeader("X-Cache-Status", "miss");
    return originalSend(body);
  };

  /** Handle errors during request processing */
  res.on("error", () => {
    rejectResponse?.(new Error("Response error"));
  });

  next();
};

/**
 * Clean up the request cache and stop the cleanup interval.
 * Should be called during graceful shutdown or in tests.
 */
export const cleanupRequestCache = () => {
  clearInterval(cleanupInterval);
  requestStore.clear();
};
