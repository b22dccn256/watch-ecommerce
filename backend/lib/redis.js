import Redis from "ioredis";
import dotenv from "dotenv";

dotenv.config({ path: "./backend/.env" });

export const redis = new Redis(process.env.UPSTASH_REDIS_URL || "redis://localhost:6379", {
    tls: process.env.UPSTASH_REDIS_URL ? { rejectUnauthorized: false } : undefined,
});

redis.on("error", (err) => {
    console.log("Redis connection error:", err);
});
