import pino from 'pino'

const isDevelopment = process.env.NODE_ENV !== 'production'

const baseConfig = {
    level: process.env.LOG_LEVEL ?? 'info',
    redact: ['req.body.password', 'req.headers.authorization'],
}

const developmentConfig = {
    ...baseConfig,
    transport: {
        target: 'pino-pretty',
        options: {
            colorize: true,
            translateTime: 'HH:MM:ss',
            ignore: 'pid,hostname',
            singleLine: true,
        },
    },
}

export const logger = isDevelopment ? pino(developmentConfig) : pino(baseConfig)

export default logger
