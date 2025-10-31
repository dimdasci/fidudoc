import * as Sentry from "@sentry/node";
import type { NextFunction, Request, Response } from "express";
import crypto from "node:crypto";

export const loggingMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();

  const headers = { ...req.headers };
  if (headers.authorization) {
    headers.authorization = "[redacted]";
  }

  const requestContext = {
    requestId,
    method: req.method,
    url: req.url,
    headers,
    body: req.body,
    query: req.query,
    params: req.params,
  };

  res.locals.requestContext = requestContext;

  // Skip logging for health check requests
  const shouldLog = req.url !== "/health";

  // Log request details
  if (shouldLog) {
    const timestamp = new Date().toISOString();
    console.log("-> Incoming Request:", {
      timestamp,
      ...requestContext,
    });

    Sentry.addBreadcrumb({
      category: "http",
      type: "info",
      level: "info",
      message: `${req.method} ${req.url}`,
      data: {
        requestId,
        query: req.query,
        params: req.params,
      },
    });
  }

  // Capture the original res.send to intercept response
  // Note: res.json() calls res.send() internally, so we only need to intercept send
  const originalSend = res.send.bind(res);

  res.send = function(this: Response, data: unknown) {
    const duration = Date.now() - startTime;
    if (shouldLog) {
      console.log("<- Outgoing Response:", {
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        responseBody: data,
        requestId,
      });

      Sentry.addBreadcrumb({
        category: "http",
        type: "info",
        level: res.statusCode >= 500 ? "error" : "info",
        message: `Response ${res.statusCode} for ${req.method} ${req.url}`,
        data: {
          requestId,
          statusCode: res.statusCode,
          duration,
        },
      });
    }
    return originalSend(data);
  };

  res.on("error", (error) => {
    Sentry.captureException(error, {
      level: "error",
      tags: {
        request_id: requestId,
        url: req.url,
        method: req.method,
      },
      extra: {
        statusCode: res.statusCode,
        duration: Date.now() - startTime,
        request: requestContext,
      },
    });
  });

  next();
};
