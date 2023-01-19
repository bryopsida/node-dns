export class Cache {
  constructor () {
    if (this.constructor === Cache) {
      throw new Error("Abstract classes can't be instantiated.")
    }
  }

  async get (key, computer) {
    return Promise.reject('Method not implemented')
  }
}
