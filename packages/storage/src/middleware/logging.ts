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

  // Capture the original res.send and res.json to intercept response
  const originalSend = res.send.bind(res);
  const originalJson = res.json.bind(res);

  res.send = (data: unknown) => {
    logResponse(data);
    return originalSend(data);
  };

  res.json = (data: unknown) => {
    logResponse(data);
    return originalJson(data);
  };

  const logResponse = (data: unknown) => {
    const duration = Date.now() - startTime;
    console.log("<- Outgoing Response:", {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      responseBody: data,
    });
  };

  next();
};
