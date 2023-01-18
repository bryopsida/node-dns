export class Resolver {
  constructor () {
    if (this.constructor === Resolver) {
      throw new Error("Abstract classes can't be instantiated.")
    }
  }

  static _validateOpts (opts) {
    if (!opts.type) throw new Error('opts.type must be defined')
    if (!opts.hostname) throw new Error('opts.hostname must be defined')
  }

  async resolve (opts) {
    throw new Error("Method 'say()' must be implemented.")
  }
}
