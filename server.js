import { createSocket } from 'dgram';
import { Resolver } from 'node:dns/promises'
import {decode} from 'dns-packet';
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
    for(const question of dnsPacket.questions) {
        logger.info('Looking up answer for %s requested by %s', question.name, info.address)
        const result = await upstreamResolver.resolve(question.name, question.type)
        logger.info('Answer for %s is %s', question.name, result)
        dnsPacket.answers.push({})
    }
    logger.info('Server received a dns query %s %s', dnsPacket.opcode, dnsPacket.questions.map((question) => question.name).join(',', ))
})

// error handler
server.on('error', (err) => {
    logger.error('Server encountered an err')
})

//kick it off
server.bind(53, '0.0.0.0')


const resolver = new Resolver()
resolver.setServers(['127.0.0.1'])
setInterval(() => {
    // send data
    resolver.resolve4('google.com', (err) => {
        if(err) {
            logger.error(err, 'Error while doing test resolve')
        } else {
            logger.info('Test resolve worked')
        }
    })
}, 10000)
