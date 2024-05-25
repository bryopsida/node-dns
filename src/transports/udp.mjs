import { EventEmitter } from 'node:events'
import { createSocket } from 'node:udp'
import { promisify } from 'node:util'

export class UDPServer extends EventEmitter {
  #server
  #address
  #port
  #bind
  #close
  #messageTransformer

  constructor (opts) {
    super()
    this.#server = createSocket({
      ipv6Only: false,
      type: 'udp6',
      reuseAddr: true,
      signal: opts.abortSignal
    })
    this.#address = opts.address
    this.#port = opts.port
    this.#messageTransformer = opts.transformer
    this.#bind = promisify(this.#server.bind)
    this.#close = promisify(this.#server.close)
    this.#server.on('error', this.#handleError.bind(this))
    this.#server.on('listening', this.#handleListening.bind(this))
    this.#server.on('message', this.#handleMessage.bind(this))
  }

  #handleError (err) {
    // TODO: normalize
    this.emit('error', err)
  }

  #handleListening () {
    // TODO: emit info/trace level data that we entered a listening state
  }

  async #handleMessage (msg, rinfo) {
    if (this.#messageTransformer) {
      this.emit('message', await this.#messageTransformer(msg, rinfo))
    } else {
      this.emit('message', msg)
    }
  }

  async listen () {
    return this.#bind({
      address: this.#address,
      port: this.#port
    })
  }

  async close () {
    return this.#close()
  }
}
