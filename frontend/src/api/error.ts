/** Body the webserver sends alongside a 4xx or 5xx status */
export type ApiErrorResponse = {
    /** ID of the opentelemetry trace this error originated in */
    trace_id: string;
};

/** A failed request, thrown by {@link customFetch} */
export class ApiError extends Error {
    constructor(
        /** The response's http status code */
        readonly status: number,
        /** The response's http status text */
        readonly statusText: string,
        /** The trace id to report to an admin, if the server sent one */
        readonly traceId?: string,
    ) {
        super(`${status} ${statusText || "Request failed"}`);
        this.name = "ApiError";
    }
}

/** Narrows an unknown error thrown by the api to an {@link ApiError} */
export function isApiError(error: unknown): error is ApiError {
    return error instanceof ApiError;
}

/** Reads the {@link ApiErrorResponse} out of an already parsed response body */
export function getTraceId(body: unknown): string | undefined {
    if (typeof body !== "object" || body === null) return undefined;
    const traceId = (body as Partial<ApiErrorResponse>).trace_id;
    return typeof traceId === "string" ? traceId : undefined;
}
