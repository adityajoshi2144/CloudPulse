import time
import json
import logging
from typing import Any, Optional, Dict
import redis.asyncio as aioredis
from app.core.config import settings

logger = logging.getLogger("cloudpulse.cache")

class InMemoryCacheManager:
    """Production-grade in-memory cache fallback with TTL, eviction, and hit/miss statistics."""
    def __init__(self, max_keys: int = 5000):
        self.store: Dict[str, Dict[str, Any]] = {}
        self.max_keys = max_keys
        self.hits: int = 0
        self.misses: int = 0
        self.evictions: int = 0
        self.total_commands: int = 0
        self.latency_samples: list[float] = []

    def _cleanup_expired(self):
        now = time.time()
        expired = [k for k, v in self.store.items() if v.get("expires_at") and v["expires_at"] < now]
        for k in expired:
            del self.store[k]

    async def get(self, key: str) -> Optional[str]:
        t0 = time.perf_counter()
        self._cleanup_expired()
        self.total_commands += 1
        val_obj = self.store.get(key)
        elapsed = (time.perf_counter() - t0) * 1000
        self.latency_samples.append(round(elapsed, 3))
        if len(self.latency_samples) > 50:
            self.latency_samples.pop(0)

        if val_obj:
            self.hits += 1
            return val_obj["value"]
        self.misses += 1
        return None

    async def set(self, key: str, value: str, ex: Optional[int] = None) -> bool:
        t0 = time.perf_counter()
        self._cleanup_expired()
        self.total_commands += 1
        if len(self.store) >= self.max_keys:
            # Evict oldest item
            oldest_key = next(iter(self.store))
            del self.store[oldest_key]
            self.evictions += 1

        expires_at = time.time() + ex if ex else None
        self.store[key] = {
            "value": value,
            "expires_at": expires_at,
            "size_bytes": len(key.encode("utf-8")) + len(value.encode("utf-8")),
            "created_at": time.time()
        }
        elapsed = (time.perf_counter() - t0) * 1000
        self.latency_samples.append(round(elapsed, 3))
        return True

    async def delete(self, key: str) -> int:
        self.total_commands += 1
        if key in self.store:
            del self.store[key]
            return 1
        return 0

    async def flushall(self) -> bool:
        self.store.clear()
        return True

    async def keys(self, pattern: str = "*") -> list:
        self._cleanup_expired()
        return list(self.store.keys())

    async def get_stats(self) -> dict:
        self._cleanup_expired()
        total_ops = self.hits + self.misses
        hit_ratio = round((self.hits / total_ops * 100), 2) if total_ops > 0 else 0.0
        total_bytes = sum(v.get("size_bytes", 0) for v in self.store.values())
        recent_samples = self.latency_samples[-10:]
        avg_latency = round(sum(recent_samples) / len(recent_samples), 3) if recent_samples else None
        
        return {
            "is_real_redis": False,
            "engine": "CloudPulse In-Memory High-Speed Cache (Redis-Compatible)",
            "connected_clients": 0,
            "total_keys": len(self.store),
            "hits": self.hits,
            "misses": self.misses,
            "hit_ratio_percent": hit_ratio,
            "evictions": self.evictions,
            "used_memory_bytes": total_bytes,
            "used_memory_human": f"{round(total_bytes / 1048576, 3)} MB",
            "avg_latency_ms": avg_latency,
            "total_commands_processed": self.total_commands,
            "sample_keys": [
                {"key": k, "size": v.get("size_bytes", 64), "ttl": int(max(0, (v["expires_at"] - time.time()))) if v.get("expires_at") else -1}
                for k, v in list(self.store.items())[:15]
            ]
        }

class CacheService:
    def __init__(self):
        self.redis: Optional[aioredis.Redis] = None
        self.in_memory = InMemoryCacheManager()
        self.use_real_redis: bool = False

    async def init(self):
        try:
            client = aioredis.from_url(settings.REDIS_URL, decode_responses=True, socket_timeout=1.0)
            await client.ping()
            self.redis = client
            self.use_real_redis = True
            logger.info("Connected to real Redis cluster at %s", settings.REDIS_URL)
        except Exception as e:
            self.use_real_redis = False
            logger.info("Redis not detected (%s); using in-memory high-speed cache manager", str(e))
    async def get(self, key: str) -> Optional[str]:
        if self.use_real_redis and self.redis:
            try:
                return await self.redis.get(key)
            except Exception as exc:
                logger.warning("Redis GET failed; using in-memory fallback: %s", exc)
                self.use_real_redis = False
        return await self.in_memory.get(key)

    async def set(self, key: str, value: str, ex: Optional[int] = None) -> bool:
        if self.use_real_redis and self.redis:
            try:
                return await self.redis.set(key, value, ex=ex)
            except Exception as exc:
                logger.warning("Redis SET failed; using in-memory fallback: %s", exc)
                self.use_real_redis = False
        return await self.in_memory.set(key, value, ex=ex)

    async def delete(self, key: str) -> int:
        if self.use_real_redis and self.redis:
            try:
                return await self.redis.delete(key)
            except Exception as exc:
                logger.warning("Redis DELETE failed; using in-memory fallback: %s", exc)
                self.use_real_redis = False
        return await self.in_memory.delete(key)

    async def flush(self) -> bool:
        if self.use_real_redis and self.redis:
            try:
                await self.redis.flushall()
            except Exception as exc:
                logger.warning("Redis FLUSH failed; flushing in-memory fallback: %s", exc)
                self.use_real_redis = False
        return await self.in_memory.flushall()

    async def get_stats(self) -> dict:
        if self.use_real_redis and self.redis:
            try:
                info = await self.redis.info()
                keys = await self.redis.keys("*")
                hits = int(info.get("keyspace_hits", 0))
                misses = int(info.get("keyspace_misses", 0))
                total = hits + misses
                hit_ratio = round((hits / total * 100), 2) if total > 0 else 0
                return {
                    "is_real_redis": True,
                    "engine": f"Redis Server v{info.get('redis_version', 'unknown')}",
                    "connected_clients": int(info.get("connected_clients", 1)),
                    "total_keys": len(keys),
                    "hits": hits,
                    "misses": misses,
                    "hit_ratio_percent": hit_ratio,
                    "evictions": int(info.get("evicted_keys", 0)),
                    "used_memory_bytes": int(info.get("used_memory", 0)),
                    "used_memory_human": info.get("used_memory_human", "0M"),
                    "avg_latency_ms": None,
                    "total_commands_processed": int(info.get("total_commands_processed", 0)),
                    "sample_keys": [{"key": k, "size": 128, "ttl": -1} for k in keys[:15]]
                }
            except Exception as e:
                logger.warning("Error fetching real Redis stats: %s", str(e))
                self.use_real_redis = False
        return await self.in_memory.get_stats()

cache_service = CacheService()
