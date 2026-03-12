/**
 * Standardized API response envelope for all /api/v1/ endpoints.
 */

export interface PaginationMeta {
    total: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
}

export interface ApiSuccessResponse<T = any> {
    data: T;
    meta?: PaginationMeta;
}

export interface ApiErrorResponse {
    error: {
        code: string;
        message: string;
        details?: any[];
    };
}

/**
 * Return a successful JSON response with standardized envelope.
 */
export function apiSuccess<T>(data: T, meta?: PaginationMeta, status: number = 200) {
    const body: ApiSuccessResponse<T> = { data };
    if (meta) body.meta = meta;
    return Response.json(body, { status });
}

/**
 * Return a paginated list response.
 */
export function apiPaginatedSuccess<T>(
    data: T[],
    total: number,
    page: number,
    pageSize: number,
    status: number = 200
) {
    return apiSuccess(data, {
        total,
        page,
        pageSize,
        hasMore: page * pageSize < total,
    }, status);
}

/**
 * Return an error JSON response with standardized envelope.
 */
export function apiError(
    code: string,
    message: string,
    status: number = 400,
    details?: any[]
) {
    const body: ApiErrorResponse = {
        error: { code, message },
    };
    if (details) body.error.details = details;
    return Response.json(body, { status });
}

/**
 * Parse pagination params from URL search params.
 * Defaults: page=1, pageSize=25, max pageSize=100
 */
export function parsePagination(url: URL) {
    const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(url.searchParams.get("pageSize") || "25", 10)));
    const skip = (page - 1) * pageSize;
    return { page, pageSize, skip };
}
