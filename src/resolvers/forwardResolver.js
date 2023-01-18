import { Resolver } from './resolver'
import { Resolver as NodeResolver } from 'node:dns/promises'

export class ForwardResolver extends Resolver {
  constructor(opts) {
    super(opts)
    if(!opts.servers) throw new Error('opts.servers must be defined')
    this._resolver = new NodeResolver()
    this._resolver.setServers(opts.servers)
  }
  async resolve (opts) {
    try {
      Resolver._validateOpts(opts)
      return this._resolver.resolve(opts.hostname, opts.type)
    } catch (err) {
      return Promise.reject(err)
    }
  }
}
