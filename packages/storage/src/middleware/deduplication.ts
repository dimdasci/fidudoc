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
  /** Whether the request has completed processing */
  processed: boolean;
  /** The response data (if processed) */
  responseData?: unknown;
}

/**
 * In-memory store for recent requests.
 * Map key is the request signature, value is the RequestRecord.
 */
const requestStore = new Map<string, RequestRecord>();

/**
 * How long to keep requests in the cache (in milliseconds)
 * @default 1000
 */
const cacheTtl = process.env.CACHE_TTL ? parseInt(process.env.CACHE_TTL, 10) : 1000;

/**
 * Cleanup interval - removes old entries periodically
 */
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [key, value] of requestStore.entries()) {
    if (now - value.timestamp > cacheTtl) {
      requestStore.delete(key);
    }
  }
}, cacheTtl);

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
 * - If still processing: waits for the original request to complete (up to 30s)
 * - If already processed: returns the cached response immediately
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
  const existingRequest = requestStore.get(signature);

  if (existingRequest) {
    /** If the request is still being processed, poll for completion */
    if (!existingRequest.processed) {
      const maxWaitTime = 30000;
      const pollInterval = 100;
      const startTime = Date.now();

      const checkCompletion = () => {
        const record = requestStore.get(signature);
        if (record?.processed && record.responseData) {
          res.setHeader("X-Cache-Status", "hit");
          return res.status(200).json(record.responseData);
        }

        if (Date.now() - startTime > maxWaitTime) {
          /** Timeout - let this request process normally */
          return next();
        }

        setTimeout(checkCompletion, pollInterval);
      };

      return checkCompletion();
    }

    /** If already processed, return cached response */
    if (existingRequest.responseData) {
      res.setHeader("X-Cache-Status", "hit");
      return res.status(200).json(existingRequest.responseData);
    }
  }

  /** Mark this request as being processed */
  requestStore.set(signature, {
    timestamp: Date.now(),
    processed: false,
  });

  const originalSend = res.send.bind(res);

  /** Intercept res.send to capture the response (res.json calls this internally) */
  res.send = function (this: Response, body: unknown) {
    const record = requestStore.get(signature);
    if (record) {
      record.processed = true;
      record.responseData = body;
    }
    this.setHeader("X-Cache-Status", "miss");
    return originalSend(body);
  };

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
