import { jest } from "@jest/globals";
import { setTimeout as delay } from "node:timers/promises";
import { RedisClientType, createClient } from "redis";

import config from "@argos-ci/config";

import { createRedisLock } from "./lock.js";

function createResolvablePromise() {
  const promise = new Promise((r) => {
    setTimeout(() => {
      promise.resolve = r;
    });
  }) as Promise<any> & { resolve: (value: any) => void };
  return promise;
}

describe("redis-lock", () => {
  let client: RedisClientType;

  beforeEach(async () => {
    client = createClient({ url: config.get("redis.url") });
    await client.connect();
    await client.del("lock.x");
  });

  afterEach(async () => {
    await client.quit();
  });

  it("takes lock", async () => {
    const lock = createRedisLock(client);
    const p1 = createResolvablePromise();
    const spy1 = jest.fn();
    const spy2 = jest.fn();
    lock.acquire("x", async () => p1).then(spy1);
    lock.acquire("x", async () => "second", { retryDelay: 30 }).then(spy2);
    await delay(10);
    expect(spy1).not.toHaveBeenCalled();
    expect(spy2).not.toHaveBeenCalled();
    p1.resolve("first");
    await delay(10);
    expect(spy1).toHaveBeenCalledWith("first");
    expect(spy2).not.toHaveBeenCalledWith("second");
    await delay(50);
    expect(spy2).toHaveBeenCalledWith("second");
  });
});
