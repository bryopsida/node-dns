import { Resolver } from './resolver'

export class ForwardResolver extends Resolver {
  async resolve (opts) {
    try {
      Resolver._validateOpts(opts)
    } catch (err) {
      return Promise.reject(err)
    }
  }
}
