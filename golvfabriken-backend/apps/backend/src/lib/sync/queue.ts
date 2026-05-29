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
  const popped = await client.lpop(getQueueKey(), count);

  if (!popped) {
    return [];
  }

  return Array.isArray(popped) ? popped : [popped];
};

export const requeueSyncEventIds = async (eventIds: string[]) => {
  if (!isSyncRedisQueueEnabled() || !eventIds.length) {
    return;
  }

  const client = getRedisClient();
  await client.connect().catch(() => {});
  await client.rpush(getQueueKey(), ...eventIds);
};

export const getSyncQueueDepth = async (): Promise<{
  enabled: boolean;
  key: string;
  depth: number;
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
  await client.connect().catch(() => {});
  const depth = await client.llen(key);

  return {
    enabled: true,
    key,
    depth: Number(depth || 0),
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
