const NodeCache = require('node-cache');

// StdTTL sets standard time to live for cached items (10 minutes)
const globalCache = new NodeCache({ stdTTL: 600, checkperiod: 120 });

/**
 * Express middleware to aggressively cache static/idempotent endpoints.
 * Perfect for generic info blocks, interaction history, or user preferences.
 */
const cacheMiddleware = (durationInSeconds) => {
    return (req, res, next) => {
        // Only cache GET requests
        if (req.method !== 'GET') {
            return next();
        }

        const cacheKey = req.originalUrl || req.url;
        const cachedResponse = globalCache.get(cacheKey);

        if (cachedResponse) {
            console.log(`[CACHE HIT] Returning cached payload for: ${cacheKey}`);
            return res.status(200).json(cachedResponse);
        }

        // Intercept Response to Cache it Before Sending
        res.originalSend = res.json;
        res.json = (body) => {
            // Only cache successful requests
            if (body && body.status === 'success') {
                globalCache.set(cacheKey, body, durationInSeconds || 600);
            }
            res.originalSend(body);
        };
        
        next();
    };
};

module.exports = {
   globalCache,
   cacheMiddleware
};
