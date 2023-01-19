import { Cache } from './cache'

export class PullThroughCache extends Cache {
  constructor (opts) {
    super()
    if (!opts.redisClient) throw new Error('opts.redisClient must be provided')
    if (!opts.redisPrefix) throw new Error('opts.redisPrefix must be provided')
    this._redisClient = opts.redisClient
    this._redisPrefix = opts.redisPrefix
  }

  async get (key, computer) {
    const totalKey = `${this._redisPrefix}:${key}`
    const result = await this._redisClient.get(totalKey)
    if (!result) {
      const computedResult = await computer()
      await this._redisClient.set(totalKey, computedResult, 'EX', 300)
      return computedResult
    } else {
      return result
    }
  }
}
