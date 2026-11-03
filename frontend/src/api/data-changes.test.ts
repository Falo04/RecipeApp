import {
    MutationObserver,
    QueryObserver,
    type MutationKey,
    type QueryClient,
    type QueryKey,
} from "@tanstack/react-query";
import { describe, expect, test } from "vitest";

import { getGetMeQueryKey } from "@/api/generated/account/account";
import { getGetAllIngredientsQueryKey } from "@/api/generated/ingredients/ingredients";
import {
    getGetAllRecipesQueryKey,
    getGetRecipeQueryKey,
    getUpdateRecipeMutationKey,
} from "@/api/generated/recipes/recipes";
import { getGetAllTagsQueryKey } from "@/api/generated/tags/tags";
import { refreshOnDataChanges } from "@/api/data-changes";
import { createQueryClient } from "@/api/query-client";
import { WebSocketManager } from "@/api/websockets";

const RECIPES = getGetAllRecipesQueryKey();
const RECIPE = getGetRecipeQueryKey("4b1c7a52-0d1e-4f8e-9a51-2f3c8e7d6b10");
const TAGS = getGetAllTagsQueryKey();
const INGREDIENTS = getGetAllIngredientsQueryKey();
const ME = getGetMeQueryKey();

/** Puts data for every key into the cache, as if it had been fetched */
function cache(client: QueryClient, ...keys: ReadonlyArray<QueryKey>) {
    for (const key of keys) client.setQueryData(key, "cached");
}

/** Whether the cached data under the key has been marked as outdated */
function isOutdated(client: QueryClient, key: QueryKey): boolean {
    return client.getQueryState(key)?.isInvalidated === true;
}

/** Resolves to the value after a moment, like a request would */
function later<T>(value: T): Promise<T> {
    return new Promise((resolve) => setTimeout(() => resolve(value), 10));
}

/** Runs a mutation under the key that succeeds right away */
async function mutate(client: QueryClient, mutationKey: MutationKey) {
    await new MutationObserver(client, { mutationKey, mutationFn: async () => undefined }).mutate();
}

/**
 * Every mutation key orval generated, under the name of the function that builds it.
 *
 * The generated index re-exports the same functions, hence the map to drop duplicates.
 */
const GENERATED_MUTATION_KEYS = [
    ...new Map(
        Object.values(
            import.meta.glob<Record<string, unknown>>(["./generated/**/*.ts", "!./generated/model/**"], {
                eager: true,
            }),
        ).flatMap((exports) =>
            Object.entries(exports).filter(
                (entry): entry is [string, () => MutationKey] =>
                    /^get\w+MutationKey$/.test(entry[0]) && typeof entry[1] === "function",
            ),
        ),
    ),
];

describe("after a mutation", () => {
    test("updating a recipe outdates recipe queries but not tag queries", async () => {
        const client = createQueryClient();
        cache(client, RECIPES, RECIPE, TAGS);

        await mutate(client, getUpdateRecipeMutationKey());

        expect(isOutdated(client, RECIPES)).toBe(true);
        expect(isOutdated(client, RECIPE)).toBe(true);
        expect(isOutdated(client, TAGS)).toBe(false);
    });

    test("waits until the outdated queries on screen have been refetched", async () => {
        const client = createQueryClient();
        cache(client, RECIPES);
        const onScreen = new QueryObserver(client, { queryKey: RECIPES, queryFn: () => later("fresh") });
        const unsubscribe = onScreen.subscribe(() => {});

        await mutate(client, getUpdateRecipeMutationKey());

        expect(client.getQueryData(RECIPES)).toBe("fresh");
        unsubscribe();
    });

    test("a mutation nobody said anything about outdates every query", async () => {
        const client = createQueryClient();
        cache(client, RECIPES, TAGS, INGREDIENTS);

        await mutate(client, ["someNewMutation"]);

        expect(isOutdated(client, RECIPES)).toBe(true);
        expect(isOutdated(client, TAGS)).toBe(true);
        expect(isOutdated(client, INGREDIENTS)).toBe(true);
    });
});

describe("every mutation orval generated", () => {
    test("was found", () => {
        expect(GENERATED_MUTATION_KEYS.length).toBeGreaterThan(0);
    });

    test.each(GENERATED_MUTATION_KEYS)("%s says which data it changes", async (_name, getMutationKey) => {
        const client = createQueryClient();
        cache(client, ME);

        await mutate(client, getMutationKey());

        // No mutation changes the logged-in user, only the fallback for unlisted ones outdates it
        expect(isOutdated(client, ME)).toBe(false);
    });
});

describe("when the server reports a data change", () => {
    test("a tag change outdates tag queries only", () => {
        const client = createQueryClient();
        const server = new WebSocketManager();
        refreshOnDataChanges(client, server);
        cache(client, RECIPES, TAGS, INGREDIENTS);

        server.emitEvent("message", "TagsChanged");

        expect(isOutdated(client, TAGS)).toBe(true);
        expect(isOutdated(client, RECIPES)).toBe(false);
        expect(isOutdated(client, INGREDIENTS)).toBe(false);
    });

    test("reconnecting outdates every query, since changes reported meanwhile were missed", () => {
        const client = createQueryClient();
        const server = new WebSocketManager();
        refreshOnDataChanges(client, server);
        cache(client, RECIPES, TAGS, INGREDIENTS);

        server.emitEvent("state.connected", undefined);

        expect(isOutdated(client, RECIPES)).toBe(true);
        expect(isOutdated(client, TAGS)).toBe(true);
        expect(isOutdated(client, INGREDIENTS)).toBe(true);
    });
});
