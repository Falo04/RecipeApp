import type { MutationKey, QueryClient } from "@tanstack/react-query";

import type { WebSocketManager, WsServerMsg } from "@/api/websockets";

/**
 * A notice that one kind of data changed, without naming which record.
 *
 * The server sends one over the websocket for every committed write.
 */
export type DataChange = WsServerMsg;

/** The url prefixes of the queries each data change makes outdated */
const OUTDATED_BY: Record<DataChange, string> = {
    RecipesChanged: "/api/frontend/v1/recipes",
    TagsChanged: "/api/frontend/v1/tags",
    IngredientsChanged: "/api/frontend/v1/ingredients",
};

/**
 * What a mutation changes.
 *
 * Either the data changes the server reports for it, or `"after-websocket"` for
 * one whose effects land in the database after the server already answered.
 * Refetching right away would load the old data again, so those wait for the
 * websocket to report their data changes instead.
 */
type MutationEffect = ReadonlyArray<DataChange> | "after-websocket";

/**
 * What each mutation changes, keyed by the name orval gives it.
 *
 * Mirrors the data changes the server broadcasts for each write. A recipe
 * write may create ingredients, which isn't worth finding out for one refetch.
 */
const CHANGED_BY: Record<string, MutationEffect> = {
    createRecipe: ["RecipesChanged", "IngredientsChanged"],
    updateRecipe: ["RecipesChanged", "IngredientsChanged"],
    deleteRecipe: ["RecipesChanged"],
    createTag: ["TagsChanged"],
    // Recipes embed their tags
    updateTag: ["TagsChanged", "RecipesChanged"],
    deleteTag: ["TagsChanged", "RecipesChanged"],
    // Generated as a mutation, but only reads
    getRecipesByTag: [],
    logout: [],
};

/**
 * Refetches the queries each data change the server reports makes outdated.
 *
 * @param queryClient The client whose cache the data changes outdate
 * @param websocket The connection the server reports data changes over
 */
export function refreshOnDataChanges(queryClient: QueryClient, websocket: WebSocketManager) {
    websocket.addEventListener("message", (change) => void refresh(queryClient, [change]));

    // Data changes reported while the socket was down are lost, so refetch everything
    websocket.addEventListener("state.connected", () => void queryClient.invalidateQueries());
}

/**
 * Refetches the queries a successful mutation made outdated.
 *
 * @param queryClient The client whose cache the mutation outdated
 * @param mutationKey The key of the mutation that succeeded
 * @returns Resolves once the outdated queries in use have been refetched
 */
export async function refreshAfterMutation(queryClient: QueryClient, mutationKey: MutationKey | undefined) {
    const [name] = mutationKey ?? [];
    const changes: MutationEffect | undefined = typeof name === "string" ? CHANGED_BY[name] : undefined;

    // Not knowing what a mutation changed, anything may be outdated
    if (changes === undefined) return queryClient.invalidateQueries();
    if (changes === "after-websocket") return;

    await refresh(queryClient, changes);
}

/**
 * Refetches the queries the data changes made outdated.
 *
 * @param queryClient The client whose cache the changes outdated
 * @param changes The data changes that happened
 */
function refresh(queryClient: QueryClient, changes: ReadonlyArray<DataChange>): Promise<void> {
    const prefixes = changes.map((change) => OUTDATED_BY[change]);
    return queryClient.invalidateQueries({
        predicate: ({ queryKey: [url] }) =>
            typeof url === "string" && prefixes.some((prefix) => url.startsWith(prefix)),
    });
}
