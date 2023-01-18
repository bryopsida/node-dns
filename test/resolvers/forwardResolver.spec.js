import { ForwardResolver } from "../../src/resolvers/forwardResolver.js"

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
