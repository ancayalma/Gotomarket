
import { systemLogger } from "@/lib/logger";

/**
 * A lightweight internal task queue for background processing in Next.js.
 * This is an in-memory solution suitable for non-critical, fast background tasks.
 * For heavy-duty background jobs, an external system like BullMQ/Redis is recommended.
 */

type TaskHandler = (data: any) => Promise<void>;

class InternalTaskQueue {
    private handlers: Map<string, TaskHandler> = new Map();

    register(type: string, handler: TaskHandler) {
        this.handlers.set(type, handler);
        systemLogger.info(`[TASK_QUEUE] Registered handler for ${type}`);
    }

    async enqueue(type: string, data: any) {
        const handler = this.handlers.get(type);
        if (!handler) {
            systemLogger.warn(`[TASK_QUEUE] No handler registered for task type: ${type}`);
            return;
        }

        // We use setImmediate to ensure the response can be sent back to the client/webhook source
        // without waiting for the task to finish.
        setImmediate(async () => {
            try {
                systemLogger.info(`[TASK_QUEUE] Starting background task: ${type}`);
                const startTime = Date.now();
                await handler(data);
                const duration = Date.now() - startTime;
                systemLogger.info(`[TASK_QUEUE] Completed task: ${type} in ${duration}ms`);
            } catch (error) {
                systemLogger.error(`[TASK_QUEUE] Error in background task ${type}:`, error);
            }
        });
    }
}

// Global instance to persist across HMR in dev mode
const taskQueue = (globalThis as any).__TASK_QUEUE ?? new InternalTaskQueue();
if (process.env.NODE_ENV !== 'production') {
    (globalThis as any).__TASK_QUEUE = taskQueue;
}

export { taskQueue };

// Example: Registering default handlers
// taskQueue.register('PROCESS_WEBHOOK', async (data) => { ... });
