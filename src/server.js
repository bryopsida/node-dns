import { createSocket } from 'dgram'
import { Resolver } from 'node:dns/promises'
import { decode, encode } from 'dns-packet'
import Pino from 'pino'

const logger = new Pino()
const server = createSocket('udp4')
const upstreamResolver = new Resolver()
upstreamResolver.setServers(process.env.UPSTREAM_DNS_SERVER != null ? process.env.UPSTREAM_DNS_SERVER.split(',') : ['8.8.8.8'])

// server is ready to receive
server.on('listening', (msg, info) => {
  logger.info('Server is ready to receive messages')
})

// server message handler
server.on('message', async (msg, info) => {
  const dnsPacket = decode(msg)
  for (const question of dnsPacket.questions) {
    logger.info('Looking up answer for %s requested by %s', question.name, info.address)
    const result = await upstreamResolver.resolve(question.name, question.type)
    logger.info('Answer for %s is %s', question.name, result)
    dnsPacket.answers.push({
      name: question.name,
      type: question.type,
      class: question.class,
      data: result[0],
      ttl: 500
    })
  }
  const responsePacket = encode(dnsPacket)
  server.send(responsePacket, info.port, info.address, (err) => {
    if (err) {
      logger.error('Failed to send answer to %s:%s', info.address, info.port)
    } else {
      logger.info('Sent answer to %s:%s', info.address, info.port)
    }
  })
})

// error handler
server.on('error', (err) => {
  logger.error(err, 'Server encountered an err: %s', err)
})

// kick it off
server.bind(53, '0.0.0.0')

const resolver = new Resolver()
resolver.setServers(['127.0.0.1'])
setInterval(() => {
  // send data
  resolver.resolve4('google.com').then((addresses) => {
    logger.info('Resolved addresses succesfully: %s', addresses)
  }).catch((err) => {
    logger.error(err, 'Failed to resolve addresses: %s', err)
  })
}, 10000)
