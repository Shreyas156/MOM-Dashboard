import { Redis } from '@upstash/redis';

const url =
  process.env.UPSTASH_REDIS_REST_URL ||
  process.env.KV_REST_API_URL ||
  process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_URL ||
  '';

const token =
  process.env.UPSTASH_REDIS_REST_TOKEN ||
  process.env.KV_REST_API_TOKEN ||
  process.env.NEXT_PUBLIC_UPSTASH_REDIS_REST_TOKEN ||
  '';

export const redis = url && token ? new Redis({ url, token }) : null;
