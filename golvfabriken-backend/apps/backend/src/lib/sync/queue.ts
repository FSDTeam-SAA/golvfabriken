import Redis from "ioredis";

type QueueOpResult = {
  ok: boolean;
  reason?: string;
};

type SyncJobLockHandle = {
  key: string;
  token: string;
  ttlSeconds: number;
};

type RecoverStaleProcessingQueueInput = {
  staleAfterSeconds: number;
  limit: number;
};

type InspectStaleProcessingQueueInput = {
  staleAfterSeconds: number;
  limit: number;
};

type RecoverStaleProcessingQueueResult = {
  enabled: boolean;
  scanned: number;
  recovered: number;
  eventIds: string[];
};

type InspectStaleProcessingQueueResult = {
  enabled: boolean;
  scanned: number;
  staleCount: number;
  oldestStaleAgeSeconds: number;
  sampleEventIds: string[];
};

type SyncQueuePauseState = {
  enabled: boolean;
  paused: boolean;
  key: string;
  pausedAt?: string;
  reason?: string;
};

type SyncJobLockState = {
  enabled: boolean;
  key: string;
  locked: boolean;
  ttlSeconds?: number;
  tokenPreview?: string;
};

let redisClient: Redis | undefined;

const normalizeBoolean = (value: string | undefined, fallback: boolean) => {
  if (value == null) {
    return fallback;
  }

  const normalized = value.toLowerCase();

  if (["true", "1", "yes", "on"].includes(normalized)) {
    return true;
  }

  if (["false", "0", "no", "off"].includes(normalized)) {
    return false;
  }

  return fallback;
};

const getQueueKey = () => {
  return process.env.SYNC_QUEUE_KEY || "sync:events:queue";
};

const getProcessingQueueKey = () => {
  return process.env.SYNC_QUEUE_PROCESSING_KEY || `${getQueueKey()}:processing`;
};

const getProcessingMetaKey = () => {
  return process.env.SYNC_QUEUE_PROCESSING_META_KEY || `${getQueueKey()}:processing:meta`;
};

const getQueuePauseKey = () => {
  return process.env.SYNC_QUEUE_PAUSE_KEY || `${getQueueKey()}:paused`;
};

const getQueueVisibilityTimeoutSeconds = () => {
  const parsed = Number(process.env.SYNC_QUEUE_VISIBILITY_TIMEOUT_SECONDS || 300);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 300;
  }

  return Math.floor(parsed);
};

const getSyncJobLockKey = () => {
  return process.env.SYNC_JOB_LOCK_KEY || "sync:events:job-lock";
};

const getSyncJobLockTtlSeconds = () => {
  const parsed = Number(process.env.SYNC_JOB_LOCK_TTL_SECONDS || 120);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 120;
  }

  return Math.floor(parsed);
};

export const isSyncRedisQueueEnabled = () => {
  const hasRedisUrl = Boolean(process.env.REDIS_URL);
  const enabledByFlag = normalizeBoolean(process.env.SYNC_USE_REDIS_QUEUE, true);

  return hasRedisUrl && enabledByFlag;
};

export const isSyncJobDistributedLockEnabled = () => {
  const hasRedisUrl = Boolean(process.env.REDIS_URL);
  const enabledByFlag = normalizeBoolean(process.env.SYNC_JOB_DISTRIBUTED_LOCK, true);

  return hasRedisUrl && enabledByFlag;
};

const isSyncQueuePauseEnabled = () => {
  return isSyncRedisQueueEnabled();
};

const getRedisClient = () => {
  if (!redisClient) {
    const redisUrl = process.env.REDIS_URL;

    if (!redisUrl) {
      throw new Error("[sync] REDIS_URL is not configured");
    }

    redisClient = new Redis(redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
    });
  }

  return redisClient;
};

export const enqueueSyncEventId = async (
  eventId: string
): Promise<QueueOpResult> => {
  if (!isSyncRedisQueueEnabled()) {
    return {
      ok: false,
      reason: "Redis queue is disabled",
    };
  }

  const client = getRedisClient();
  await client.connect().catch(() => {});
  await client.rpush(getQueueKey(), eventId);

  return { ok: true };
};

export const dequeueSyncEventIds = async ({
  batchSize,
}: {
  batchSize: number;
}): Promise<string[]> => {
  if (!isSyncRedisQueueEnabled()) {
    return [];
  }

  const count = Math.max(1, batchSize);
  const client = getRedisClient();
  await client.connect().catch(() => {});
  const pauseState = await getSyncQueuePauseState();

  if (pauseState.paused) {
    return [];
  }

  const queueKey = getQueueKey();
  const processingKey = getProcessingQueueKey();
  const processingMetaKey = getProcessingMetaKey();
  const dequeued: string[] = [];
  const now = Date.now().toString();

  for (let index = 0; index < count; index += 1) {
    const moved = await client.call(
      "LMOVE",
      queueKey,
      processingKey,
      "RIGHT",
      "LEFT"
    );

    if (!moved) {
      break;
    }

    const eventId = String(moved);
    dequeued.push(eventId);
    await client.hset(processingMetaKey, eventId, now);
  }

  return dequeued;
};

export const requeueSyncEventIds = async (eventIds: string[]) => {
  if (!isSyncRedisQueueEnabled() || !eventIds.length) {
    return;
  }

  const uniqueIds = Array.from(new Set(eventIds.map((eventId) => String(eventId))));
  const client = getRedisClient();
  const processingKey = getProcessingQueueKey();
  const processingMetaKey = getProcessingMetaKey();
  const pipeline = client.pipeline();

  await client.connect().catch(() => {});

  for (const eventId of uniqueIds) {
    pipeline.lrem(processingKey, 0, eventId);
    pipeline.hdel(processingMetaKey, eventId);
  }

  pipeline.rpush(getQueueKey(), ...uniqueIds);
  await pipeline.exec();
};

export const getSyncQueueDepth = async (): Promise<{
  enabled: boolean;
  key: string;
  depth: number;
  processingKey?: string;
  processingDepth?: number;
}> => {
  const enabled = isSyncRedisQueueEnabled();
  const key = getQueueKey();

  if (!enabled) {
    return {
      enabled: false,
      key,
      depth: 0,
    };
  }

  const client = getRedisClient();
  const processingKey = getProcessingQueueKey();
  await client.connect().catch(() => {});
  const [depth, processingDepth] = await Promise.all([
    client.llen(key),
    client.llen(processingKey),
  ]);

  return {
    enabled: true,
    key,
    depth: Number(depth || 0),
    processingKey,
    processingDepth: Number(processingDepth || 0),
  };
};

export const getSyncQueuePauseState = async (): Promise<SyncQueuePauseState> => {
  const enabled = isSyncQueuePauseEnabled();
  const key = getQueuePauseKey();

  if (!enabled) {
    return {
      enabled: false,
      paused: false,
      key,
    };
  }

  const client = getRedisClient();
  await client.connect().catch(() => {});
  const data = await client.hgetall(key);
  const paused = Boolean(data?.paused_at);

  return {
    enabled: true,
    paused,
    key,
    pausedAt: data?.paused_at || undefined,
    reason: data?.reason || undefined,
  };
};

export const setSyncQueuePaused = async ({
  paused,
  reason,
}: {
  paused: boolean;
  reason?: string;
}): Promise<SyncQueuePauseState> => {
  const enabled = isSyncQueuePauseEnabled();
  const key = getQueuePauseKey();

  if (!enabled) {
    return {
      enabled: false,
      paused: false,
      key,
    };
  }

  const client = getRedisClient();
  await client.connect().catch(() => {});

  if (!paused) {
    await client.del(key);
    return {
      enabled: true,
      paused: false,
      key,
    };
  }

  const pausedAt = new Date().toISOString();
  await client.hset(key, {
    paused_at: pausedAt,
    reason: reason || "manual",
  });

  return {
    enabled: true,
    paused: true,
    key,
    pausedAt,
    reason: reason || "manual",
  };
};

export const ackSyncEventIds = async (eventIds: string[]) => {
  if (!isSyncRedisQueueEnabled() || !eventIds.length) {
    return;
  }

  const uniqueIds = Array.from(new Set(eventIds.map((eventId) => String(eventId))));
  const client = getRedisClient();
  const processingKey = getProcessingQueueKey();
  const processingMetaKey = getProcessingMetaKey();
  const pipeline = client.pipeline();

  await client.connect().catch(() => {});

  for (const eventId of uniqueIds) {
    pipeline.lrem(processingKey, 0, eventId);
    pipeline.hdel(processingMetaKey, eventId);
  }

  await pipeline.exec();
};

export const recoverStaleProcessingQueueEntries = async ({
  staleAfterSeconds,
  limit,
}: RecoverStaleProcessingQueueInput): Promise<RecoverStaleProcessingQueueResult> => {
  if (!isSyncRedisQueueEnabled()) {
    return {
      enabled: false,
      scanned: 0,
      recovered: 0,
      eventIds: [],
    };
  }

  const maxLimit = Math.max(1, Math.min(Number(limit) || 100, 1000));
  const staleAfterMs = Math.max(Number(staleAfterSeconds) || 300, 1) * 1000;
  const now = Date.now();
  const client = getRedisClient();
  const queueKey = getQueueKey();
  const processingKey = getProcessingQueueKey();
  const processingMetaKey = getProcessingMetaKey();

  await client.connect().catch(() => {});

  const processingMeta = await client.hgetall(processingMetaKey);
  const entries = Object.entries(processingMeta || {});
  const staleIds = entries
    .filter(([, timestamp]) => {
      const parsed = Number(timestamp);

      return Number.isFinite(parsed) && now - parsed >= staleAfterMs;
    })
    .sort((a, b) => Number(a[1]) - Number(b[1]))
    .slice(0, maxLimit)
    .map(([eventId]) => eventId);

  if (!staleIds.length) {
    return {
      enabled: true,
      scanned: entries.length,
      recovered: 0,
      eventIds: [],
    };
  }

  const recovered: string[] = [];

  for (const eventId of staleIds) {
    const removed = await client.lrem(processingKey, 0, eventId);
    await client.hdel(processingMetaKey, eventId);

    if (Number(removed || 0) > 0) {
      await client.rpush(queueKey, eventId);
      recovered.push(eventId);
    }
  }

  return {
    enabled: true,
    scanned: entries.length,
    recovered: recovered.length,
    eventIds: recovered,
  };
};

export const inspectStaleProcessingQueueEntries = async ({
  staleAfterSeconds,
  limit,
}: InspectStaleProcessingQueueInput): Promise<InspectStaleProcessingQueueResult> => {
  if (!isSyncRedisQueueEnabled()) {
    return {
      enabled: false,
      scanned: 0,
      staleCount: 0,
      oldestStaleAgeSeconds: 0,
      sampleEventIds: [],
    };
  }

  const maxLimit = Math.max(1, Math.min(Number(limit) || 25, 200));
  const staleAfterMs = Math.max(Number(staleAfterSeconds) || 300, 1) * 1000;
  const now = Date.now();
  const client = getRedisClient();
  const processingMetaKey = getProcessingMetaKey();

  await client.connect().catch(() => {});
  const processingMeta = await client.hgetall(processingMetaKey);
  const entries = Object.entries(processingMeta || {});
  const stale = entries
    .filter(([, timestamp]) => {
      const parsed = Number(timestamp);

      return Number.isFinite(parsed) && now - parsed >= staleAfterMs;
    })
    .sort((a, b) => Number(a[1]) - Number(b[1]));
  const oldest = stale[0];
  const oldestStaleAgeSeconds = oldest
    ? Math.max(0, Math.floor((now - Number(oldest[1])) / 1000))
    : 0;

  return {
    enabled: true,
    scanned: entries.length,
    staleCount: stale.length,
    oldestStaleAgeSeconds,
    sampleEventIds: stale.slice(0, maxLimit).map(([eventId]) => eventId),
  };
};

export const getSyncQueueVisibilityTimeoutSeconds = () => {
  return getQueueVisibilityTimeoutSeconds();
};

export const getSyncJobLockState = async (): Promise<SyncJobLockState> => {
  const enabled = isSyncJobDistributedLockEnabled();
  const key = getSyncJobLockKey();

  if (!enabled) {
    return {
      enabled: false,
      key,
      locked: false,
    };
  }

  const client = getRedisClient();
  await client.connect().catch(() => {});
  const [token, ttl] = await Promise.all([client.get(key), client.ttl(key)]);
  const locked = Boolean(token);

  return {
    enabled: true,
    key,
    locked,
    ttlSeconds: Number(ttl || 0),
    tokenPreview: token ? `${token.slice(0, 12)}...` : undefined,
  };
};

export const acquireSyncJobLock = async (): Promise<SyncJobLockHandle | null> => {
  if (!isSyncJobDistributedLockEnabled()) {
    return null;
  }

  const client = getRedisClient();
  const key = getSyncJobLockKey();
  const ttlSeconds = getSyncJobLockTtlSeconds();
  const token = `sync-job-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  await client.connect().catch(() => {});
  const result = await client.set(key, token, "EX", ttlSeconds, "NX");

  if (result !== "OK") {
    return null;
  }

  return {
    key,
    token,
    ttlSeconds,
  };
};

export const releaseSyncJobLock = async (
  lock: SyncJobLockHandle | null
): Promise<boolean> => {
  if (!lock || !isSyncJobDistributedLockEnabled()) {
    return false;
  }

  const client = getRedisClient();
  await client.connect().catch(() => {});
  const released = await client.eval(
    `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      end
      return 0
    `,
    1,
    lock.key,
    lock.token
  );

  return Number(released || 0) > 0;
};
