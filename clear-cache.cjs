const { redis } = require("./backend/lib/redis.js");

async function clearCache() {
    try {
        await redis.del("featured_products");
        console.log("Redis cache cleared!");
    } catch (error) {
        console.error("Failed to clear cache", error);
    } finally {
        process.exit(0);
    }
}
clearCache();
