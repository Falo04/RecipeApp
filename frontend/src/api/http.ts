import { redirect } from "@tanstack/react-router";

import { ApiError, getTraceId } from "@/api/error";

/**
 * The fetch orval generates every endpoint against, configured as the mutator
 * in `orval.config.ts`.
 *
 * @param url Path of the endpoint, relative to the api's base url
 * @param options Request options assembled by the generated endpoint
 */
export async function customFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(url, {
        credentials: "same-origin",
        ...options,
    });

    const body = await readBody(response);

    if (response.status === 401) {
        throw redirect({ to: "/login", replace: true });
    }

    if (!response.ok) {
        throw new ApiError(response.status, response.statusText, getTraceId(body));
    }

    return body as T;
}

/**
 * Reads a response body.
 *
 * Handlers returning nothing answer with a 200 and an empty body, which is not
 * valid json, so an empty body becomes `undefined` rather than an error.
 *
 * @param response The response to read
 */
async function readBody(response: Response): Promise<unknown> {
    const text = await response.text();
    if (text.length === 0) return undefined;

    try {
        return JSON.parse(text) as unknown;
    } catch {
        if (response.ok) {
            throw new ApiError(response.status, "Response was not valid json");
        }
        return undefined;
    }
}
