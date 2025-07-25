import { Api } from "@/api/api";
import type { Page } from "@/api/model/global.interface";
import type { SimpleTag } from "@/api/model/tag.interface";
import React, { useEffect } from "react";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner.tsx";

/**
 * Represents the context for managing and interacting with tags.
 * It contains the current list of tags and a function to reset the context.
 */
export type TagsContext = {
    tags: Page<SimpleTag>;

    reset: () => void;
};

/**
 * A React context provider for managing tag-related data.
 * This context offers a centralized location to manage and access
 * tag data such as items, limit, offset, and total count.
 *
 * It also includes a reset function for managing state.
 */
const TAGS_CONTEXT = React.createContext<TagsContext>({
    tags: {
        items: [],
        limit: 999,
        offset: 0,
        total: 0,
    },
    reset: () => {},
});
/**
 * Represents a context object with display name and other potential properties.
 * This class is designed to hold and manage contextual information.
 *
 * It provides a way to easily access and modify the display name of the context.
 */
TAGS_CONTEXT.displayName = "TagsContext";
export default TAGS_CONTEXT;

/**
 * Props for the TagsProvider component.
 *
 * This object defines the configuration options for the TagsProvider.
 * It allows you to pass in child components that will be rendered
 * within the provider.
 */
type TagsProviderProps = {
    children: React.ReactNode | Array<React.ReactNode>;
};

/**
 * Provides a context with tags data.
 * @param {TagsProviderProps} props Props passed to the provider.
 */
export function TagsProvider(props: TagsProviderProps) {
    const [tags, setTags] = React.useState<Page<SimpleTag> | "loading">("loading");
    let fetching = false;

    const fetchTags = async () => {
        if (fetching) return;
        fetching = true;

        const res = await Api.tags.getAll();
        if (res.error) {
            toast.error(res.error.message);
            return;
        }

        if (res.data) {
            setTags(res.data);
        }

        fetching = false;
    };

    useEffect(() => {
        fetchTags().then();
    }, []);

    if (tags === "loading") {
        return (
            <div className={"flex h-screen items-center justify-center"}>
                <Spinner />
            </div>
        );
    }

    return (
        <TAGS_CONTEXT.Provider
            value={{
                tags: tags,
                reset: fetchTags,
            }}
        >
            {props.children}
        </TAGS_CONTEXT.Provider>
    );
}
