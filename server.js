import { createSocket } from 'dgram';
import { Resolver } from 'node:dns'
import Pino from 'pino'

const logger = new Pino()

const server = createSocket('udp4')


// server is ready to receive
server.on('listening', (msg, info) => {
    logger.info('Server is ready to receive messages')
})

// server message handler
server.on('message', (msg, info) => {
    logger.info('Server received a dns query, %s, %s', JSON.stringify(msg), JSON.stringify(info))
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
