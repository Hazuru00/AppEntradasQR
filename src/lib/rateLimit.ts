// src/lib/rateLimit.ts
// Rate limiting en memoria (sliding window) por clave.

interface Bucket {
  timestamps: number[];
}

const buckets = new Map<string, Bucket>();

export function limitKey(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const cutoff = now - windowMs;

  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = { timestamps: [] };
    buckets.set(key, bucket);
  }

  bucket.timestamps = bucket.timestamps.filter((t) => t > cutoff);

  if (bucket.timestamps.length >= max) {
    return false;
  }

  bucket.timestamps.push(now);
  return true;
}