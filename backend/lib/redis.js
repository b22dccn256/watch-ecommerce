import Redis from "ioredis";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "..", ".env") });

class MemoryRedis {
  constructor() {
    this.store = new Map();
    this.timeouts = new Map();
    console.log(
      "🚀 [Redis Fallback] Using In-Memory Redis Store (no limit, no crash).",
    );
  }

  on(event, callback) {
    if (event === "connect" || event === "ready") {
      setTimeout(callback, 0);
    }
    return this;
  }

  async get(key) {
    return this.store.get(key) || null;
  }

  async set(key, value, ...args) {
    this.store.set(key, String(value));

    // Handle TTL expiry ("EX" command)
    const exIndex = args.indexOf("EX");
    if (exIndex !== -1 && args[exIndex + 1]) {
      const seconds = parseInt(args[exIndex + 1]);
      if (!isNaN(seconds)) {
        if (this.timeouts.has(key)) {
          clearTimeout(this.timeouts.get(key));
        }
        const timeoutId = setTimeout(() => {
          this.store.delete(key);
          this.timeouts.delete(key);
        }, seconds * 1000);
        this.timeouts.set(key, timeoutId);
      }
    }
    return "OK";
  }

  async del(key) {
    const deleted = this.store.delete(key);
    if (this.timeouts.has(key)) {
      clearTimeout(this.timeouts.get(key));
      this.timeouts.delete(key);
    }
    return deleted ? 1 : 0;
  }

  async incr(key) {
    const val = parseInt(this.store.get(key) || "0") + 1;
    this.store.set(key, String(val));
    return val;
  }
}

const useMock =
  process.env.USE_REDIS_MOCK === "true" || process.env.DISABLE_REDIS === "true";

export const redis = useMock
  ? new MemoryRedis()
  : new Redis(process.env.UPSTASH_REDIS_URL || "redis://localhost:6379", {
      tls: process.env.UPSTASH_REDIS_URL
        ? { rejectUnauthorized: false }
        : undefined,
    });

if (!useMock) {
  redis.on("error", (err) => {
    console.log("Redis connection error:", err);
  });
}
