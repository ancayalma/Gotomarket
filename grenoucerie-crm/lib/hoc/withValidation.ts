import { NextResponse } from "next/server";
import { ZodSchema, ZodError } from "zod";
import { systemLogger } from "@/lib/logger";

/**
 * HOC for Zod Validation in API Routes.
 * Validates the request body against a schema.
 */
export function withValidation<T>(
    schema: ZodSchema<T>,
    handler: (req: Request, validatedData: T, ...args: any[]) => Promise<Response>
) {
    return async (req: Request, ...args: any[]): Promise<Response> => {
        try {
            // Only validate POST, PUT, PATCH bodies. 
            // GET might need query validation eventually, but body is main focus for SOC2.
            if (["POST", "PUT", "PATCH"].includes(req.method)) {
                // Clone the request because .json() can only be called once
                const clone = req.clone();
                const body = await clone.json();
                
                const result = schema.safeParse(body);
                
                if (!result.success) {
                    systemLogger.warn("[VALIDATION_FAILED]", {
                        path: new URL(req.url).pathname,
                        errors: result.error.issues,
                    });
                    
                    return NextResponse.json(
                        { 
                            error: "Validation failed", 
                            details: result.error.issues.map((e: any) => ({
                                path: e.path.join('.'),
                                message: e.message
                            }))
                        }, 
                        { status: 400 }
                    );
                }

                return handler(req, result.data, ...args);
            }

            // For GET/DELETE or methods where we dont validate body (standard handler behavior)
            // Note: We might want a separate HOC for query params if needed.
            return (handler as any)(req, undefined, ...args);

        } catch (error) {
            systemLogger.error("[WITH_VALIDATION_ERROR]", error);
            return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
        }
    };
}
