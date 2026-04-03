import pino from 'pino';

// SOC2 CC7.2: Structured secure environment logging
const isDev = process.env.NODE_ENV !== "production";

// Singleton pattern: prevent pino-pretty transport worker duplication on Next.js hot-reloads
// Without this, each reload creates a new worker piping to stdout, leaking EventEmitter listeners
const globalForLogger = globalThis as unknown as { __pino_logger?: pino.Logger };

export const logger: pino.Logger = globalForLogger.__pino_logger ?? pino({
    level: process.env.LOG_LEVEL || "info",
    transport: isDev ? {
        target: 'pino-pretty',
        options: {
            colorize: true,
            ignore: 'pid,hostname',
            translateTime: 'SYS:standard'
        }
    } : undefined,
});

if (isDev) globalForLogger.__pino_logger = logger;

export const systemLogger = {
    error: (context: string, error?: any) => {
        const errObj = error || (typeof context !== 'string' ? context : new Error(context));
        const ctxMsg = typeof context === 'string' ? context : 'ERROR';

        if (isDev) {
            logger.error({ err: errObj }, ctxMsg);
        } else {
            const sanitizedError = {
                message: errObj?.message || (typeof errObj === 'string' ? errObj : 'An unexpected error occurred'),
                name: errObj?.name,
                code: errObj?.code
            };
            logger.error({ err: sanitizedError }, ctxMsg);
        }
    },
    info: (context: string, data?: any) => {
        const ctxMsg = typeof context === 'string' ? context : 'INFO';
        const infoData = data || (typeof context !== 'string' ? context : {});
        logger.info(infoData, ctxMsg);
    },
    warn: (context: string, data?: any) => {
        const ctxMsg = typeof context === 'string' ? context : 'WARN';
        const warnData = data || (typeof context !== 'string' ? context : {});
        logger.warn(warnData, ctxMsg);
    }
};
