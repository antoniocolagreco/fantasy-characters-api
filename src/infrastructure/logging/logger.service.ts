import pino from 'pino'

export const logger = pino({
    level: process.env.LOG_LEVEL ?? 'info',
    redact: ['req.body.password', 'req.headers.authorization'],
})

export default logger
