import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Rate limiter for Google Places API endpoints
 * Prevents exceeding API quota limits
 * 
 * Default limits (can be configured via environment variables):
 * - 100 requests per 15 minutes per IP
 * - Configurable window and max requests
 */
export const googlePlacesRateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes default
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 100 requests per window default
  message: {
    error: 'Too many requests to restaurant search. Please try again later.',
    retryAfter: 'Check the Retry-After header for when you can make requests again.'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  
  // Skip rate limiting in development if using mock data
  skip: (req) => {
    return process.env.GOOGLE_PLACES_API_KEY === 'placeholder_api_key';
  },
  
  // Custom key generator - rate limit per IP address
  keyGenerator: (req) => {
    return req.ip || req.connection.remoteAddress;
  },
  
  // Handler called when rate limit is exceeded
  handler: (req, res) => {
    console.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'Too many requests to restaurant search',
      message: 'You have exceeded the rate limit. Please try again later.',
      retryAfter: res.getHeader('Retry-After')
    });
  }
});

/**
 * Stricter rate limiter for production environments
 * Use this if you have strict API quota limits
 */
export const strictGooglePlacesRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: parseInt(process.env.STRICT_RATE_LIMIT_MAX_REQUESTS) || 50, // 50 requests per hour
  message: {
    error: 'API quota limit reached. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  
  skip: (req) => {
    return process.env.GOOGLE_PLACES_API_KEY === 'placeholder_api_key';
  },
  
  keyGenerator: (req) => {
    return req.ip || req.connection.remoteAddress;
  },
  
  handler: (req, res) => {
    console.error(`Strict rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: 'API quota limit reached',
      message: 'You have exceeded the hourly API quota. Please try again later.',
      retryAfter: res.getHeader('Retry-After')
    });
  }
});

/**
 * Global rate limiter to track total API usage across all users
 * This helps prevent exceeding the overall Google Places API quota
 */
export const globalApiRateLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: parseInt(process.env.GLOBAL_RATE_LIMIT_MAX_REQUESTS) || 10000, // 10,000 requests per day default
  message: {
    error: 'Daily API quota exceeded. Service temporarily unavailable.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  
  skip: (req) => {
    return process.env.GOOGLE_PLACES_API_KEY === 'placeholder_api_key';
  },
  
  // Use a fixed key for global limiting
  keyGenerator: () => 'global',
  
  handler: (req, res) => {
    console.error('Global daily API quota exceeded!');
    res.status(503).json({
      error: 'Service temporarily unavailable',
      message: 'Daily API quota has been exceeded. Please try again tomorrow.',
      retryAfter: res.getHeader('Retry-After')
    });
  }
});
