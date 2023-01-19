import { Redis } from 'ioredis'
import { PullThroughCache } from '../../src/data/redis/pullThrough.js'
import { ForwardResolver } from '../../src/resolvers/forwardResolver.js'
import { GenericContainer } from 'testcontainers'

const TEST_DNS_SERVER = process.env.TEST_DNS_SERVER ?? '8.8.8.8'

describe('resolvers', () => {
  describe('ForwardResolver', () => {
    describe('resolve()', () => {
      it('should resolve an A record', async () => {
        const resolver = new ForwardResolver({
          servers: [TEST_DNS_SERVER]
        })
        const result = await resolver.resolve({
          type: 'A',
          hostname: '127.0.0.1.nip.io'
        })
        expect(result).toBeDefined()
        expect(result.some((h) => h === '127.0.0.1')).toBeTruthy()
      })
      it('should resolve when cache is down', async () => {
        const redis = new Redis()
        const resolver = new ForwardResolver({
          servers: [TEST_DNS_SERVER],
          cache: new PullThroughCache({
            redisClient: redis,
            redisPrefix: 'test'
          })
        })
        const result = await resolver.resolve({
          type: 'A',
          hostname: '127.0.0.1.nip.io'
        })
        expect(result).toBeDefined()
        expect(result.some((h) => h === '127.0.0.1')).toBeTruthy()
        redis.quit()
      })
      it('should resolve from cache when item exists', async () => {
        const redisContainer = await new GenericContainer('redis')
          .withStartupTimeout(120000)
          .withExposedPorts(6379)
          .start()
        const redisClient = new Redis(redisContainer.getMappedPort(6379), redisContainer.getHost())
        const resolver = new ForwardResolver({
          servers: [TEST_DNS_SERVER],
          cache: new PullThroughCache({
            redisClient,
            redisPrefix: 'test'
          })
        })

        // set a value
        await redisClient.set('test:127.0.0.1.nip.io:A', '0.0.0.0')
        const result = await resolver.resolve({
          type: 'A',
          hostname: '127.0.0.1.nip.io'
        })
        expect(result).toEqual('0.0.0.0')
        redisClient.quit()
        await redisContainer.stop()
      })
      it('should resolve from upstream when item does not exist', async () => {
        const redisContainer = await new GenericContainer('redis')
          .withStartupTimeout(120000)
          .withExposedPorts(6379)
          .start()
        const redisClient = new Redis(redisContainer.getMappedPort(6379), redisContainer.getHost())
        const resolver = new ForwardResolver({
          servers: [TEST_DNS_SERVER],
          cache: new PullThroughCache({
            redisClient,
            redisPrefix: 'test'
          })
        })

        const result = await resolver.resolve({
          type: 'A',
          hostname: '127.0.0.1.nip.io'
        })
        expect(result).toEqual(['127.0.0.1'])
        redisClient.quit()
        await redisContainer.stop()
      })
      it('should reject on invalid args', async () => {
        const resolver = new ForwardResolver({
          servers: [TEST_DNS_SERVER]
        })
        expect(() => {
          return resolver.resolve()
        }).rejects.toThrow()
      })
    })
  })
})
