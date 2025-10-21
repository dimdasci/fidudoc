import type { NextFunction, Request, Response } from "express";

export const loggingMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const startTime = Date.now();

  // Log request details
  console.log("-> Incoming Request:", {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    headers: req.headers,
    body: req.body,
    query: req.query,
    params: req.params,
  });

  // Capture the original res.send to intercept response
  // Note: res.json() calls res.send() internally, so we only need to intercept send
  const originalSend = res.send.bind(res);

  res.send = function (this: Response, data: unknown) {
    const duration = Date.now() - startTime;
    console.log("<- Outgoing Response:", {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      responseBody: data,
    });
    return originalSend(data);
  };

  next();
};
