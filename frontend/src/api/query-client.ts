import { QueryClient } from "@tanstack/react-query";
import { isRedirect } from "@tanstack/react-router";

import { isApiError } from "@/api/error";

/**
 * Builds the query client the whole app shares.
 */
export function createQueryClient(): QueryClient {
    return new QueryClient({
        defaultOptions: {
            queries: {
                throwOnError: true,
                retry: retryUnlessTheRequestWasWrong,
                staleTime: 30_000,
            },
            mutations: {
                throwOnError: true,
                retry: false,
            },
        },
    });
}

/**
 * Retries a failed request unless the server already said what is wrong with it
 *
 * @param failureCount How often the request failed so far
 * @param error The error the last attempt failed with
 */
function retryUnlessTheRequestWasWrong(failureCount: number, error: Error): boolean {
    if (isRedirect(error)) return false;
    if (isApiError(error) && error.status < 500) return false;
    return failureCount < 2;
}
