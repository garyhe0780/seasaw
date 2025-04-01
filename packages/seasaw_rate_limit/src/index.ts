import type { Context, Middleware } from "seasaw";

interface RateLimitOptions {
  windowMs?: number;    // Time window in milliseconds
  max?: number;         // Max requests per window
  message?: string;     // Error message
  statusCode?: number;  // Error status code
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

export function rateLimit(options: RateLimitOptions = {}): Middleware<Context> {
  const store: RateLimitStore = {};
  const {
    windowMs = 60 * 1000, // 1 minute default
    max = 100,            // 100 requests per window default
    message = "Too many requests, please try again later",
    statusCode = 429
  } = options;

  return function* rateLimitMiddleware(context: Context) {
    const key = context.req.headers.get("x-forwarded-for") ||
      context.req.headers.get("x-real-ip") ||
      "unknown";

    const now = Date.now();
    const resetTime = now + windowMs;

    // Clean up expired entries
    for (const k in store) {
      if (store[k].resetTime <= now) {
        delete store[k];
      }
    }

    // Initialize or update rate limit info
    if (!store[key] || store[key].resetTime <= now) {
      store[key] = {
        count: 1,
        resetTime
      };
    } else {
      store[key].count++;
    }

    // Set rate limit headers
    context.res = {
      ...context.res,
      headers: {
        ...context.res?.headers,
        "X-RateLimit-Limit": max.toString(),
        "X-RateLimit-Remaining": Math.max(0, max - store[key].count).toString(),
        "X-RateLimit-Reset": Math.ceil(store[key].resetTime / 1000).toString()
      }
    };

    // Check if rate limit exceeded
    if (store[key].count > max) {
      return Response.json({ error: message }, {
        status: statusCode,
        headers: context.res.headers
      });
    }
  };
}