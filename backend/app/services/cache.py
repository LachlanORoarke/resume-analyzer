"""缓存服务，用redis缓存简历解析和评分结果，不开redis也能跑"""

import json
import logging
from typing import Any

from app.core.config import get_settings

logger = logging.getLogger(__name__)

_redis_client = None


async def _get_redis():
    """懒加载redis连接，没开缓存就返回none"""
    global _redis_client
    settings = get_settings()
    if not settings.CACHE_ENABLED:
        return None
    if _redis_client is None:
        try:
            import redis.asyncio as aioredis
            _redis_client = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
            await _redis_client.ping()
            logger.info("Redis 连接成功")
        except Exception as e:
            logger.warning("Redis 连接失败，缓存功能关闭: %s", e)
            return None
    return _redis_client


async def get_cache(key: str) -> dict | None:
    """取缓存，没有就返回none"""
    r = await _get_redis()
    if not r:
        return None
    try:
        data = await r.get(key)
        return json.loads(data) if data else None
    except Exception as e:
        logger.warning("缓存读取失败: %s", e)
        return None


async def set_cache(key: str, value: Any, ttl: int | None = None) -> None:
    """写缓存，失败了也无所谓"""
    r = await _get_redis()
    if not r:
        return
    try:
        settings = get_settings()
        ttl = ttl or settings.CACHE_TTL
        await r.set(key, json.dumps(value, ensure_ascii=False), ex=ttl)
    except Exception as e:
        logger.warning("缓存写入失败: %s", e)
