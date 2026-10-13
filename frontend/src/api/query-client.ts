import { QueryClient } from "@tanstack/react-query";
import { isRedirect } from "@tanstack/react-router";

import { isApiError } from "@/api/error";
import WS, { type WsServerMsg } from "@/api/websockets";

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

/** The url prefixes of the queries each websocket message makes outdated */
const OUTDATED_BY: Record<WsServerMsg, ReadonlyArray<string>> = {
    RecipesChanged: ["/api/frontend/v1/recipes"],
    // Recipes embed their tags and ingredients
    TagsChanged: ["/api/frontend/v1/tags", "/api/frontend/v1/recipes"],
    IngredientsChanged: ["/api/frontend/v1/ingredients", "/api/frontend/v1/recipes"],
};

/**
 * Refetches the queries a websocket message reports as changed.
 *
 * @param queryClient The client whose cache the messages invalidate
 */
export function invalidateOnWebsocketMessages(queryClient: QueryClient) {
    WS.addEventListener("message", (message) => {
        const prefixes = OUTDATED_BY[message];
        void queryClient.invalidateQueries({
            predicate: ({ queryKey: [url] }) =>
                typeof url === "string" && prefixes.some((prefix) => url.startsWith(prefix)),
        });
    });

    // Messages sent while the socket was down are lost, so refetch everything
    WS.addEventListener("state.connected", () => void queryClient.invalidateQueries());
}
