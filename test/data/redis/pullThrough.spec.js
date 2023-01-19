import { GenericContainer } from 'testcontainers'
import Redis from 'ioredis'
import { PullThroughCache } from '../../../src/data/redis/pullThrough'

describe('data', () => {
  describe('redis', () => {
    describe('pullThrough', () => {
      describe('get()', () => {
        let redisContainer = null
        let redisClient = null
        let cache = null
        beforeEach(async () => {
          redisContainer = await new GenericContainer('redis')
            .withExposedPorts(6379)
            .withStartupTimeout(120000)
            .start()

          redisClient = new Redis(
            redisContainer.getMappedPort(6379),
            redisContainer.getHost())
          cache = new PullThroughCache({
            redisClient,
            redisPrefix: 'test'
          })
        })
        afterEach(async () => {
          if (redisContainer) {
            await redisContainer.stop()
          }
          if (redisClient) {
            redisClient.disconnect()
          }
        })
        it('should return a value from redis', async () => {
          await redisClient.set('test:test1', 'test-val')
          const result = await cache.get('test1', () => {
            return Promise.resolve('test-val2')
          })
          expect(result).toEqual('test-val')
        })
        it('should return a computed value when value not in redis', async () => {
          const result = await cache.get('test1', () => {
            return Promise.resolve('test-val2')
          })
          expect(result).toEqual('test-val2')
        })
        it('should store computed value into redis for next fetch', async () => {
          const result = await cache.get('test1', () => {
            return Promise.resolve('test-val2')
          })
          expect(result).toEqual('test-val2')
          const resultFromRedis = await redisClient.get('test:test1')
          expect(resultFromRedis).toEqual('test-val2')
        })
        it('should set a reasonable ttl for the cache entry', async () => {
          await cache.get('test1', () => {
            return Promise.resolve('test-val2')
          })
          const expiration = await redisClient.ttl('test:test1')
          expect(expiration).toEqual(300)
        })
      })
    })
  })
})
