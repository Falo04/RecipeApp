import React from "react";
import { type SimpleTag, TagColors } from "@/api/model/tag.interface.ts";
import TAGS_CONTEXT from "@/context/tags.tsx";

/** Data provided by the {@link SINGLE_TAG_CONTEXT} */
export type SingleTagContext = {
    /** The currently available tag */
    tag: SimpleTag;

    /** Reload the tags' information */
    reset: () => void;
};

/** {@link React.Context} to access the tags */
const SINGLE_TAG_CONTEXT = React.createContext<SingleTagContext>({
    tag: {
        uuid: "",
        name: "",
        color: TagColors.Amber,
    },

    /**
     * Reset the tags
     */
    reset: () => {},
});
SINGLE_TAG_CONTEXT.displayName = "SingleTagContext";
export default SINGLE_TAG_CONTEXT;

/**
 * The properties for {@link SingleTagProvider}
 */
export type SingleTagProviderProps = {
    /** Identifier for the tag */
    uuid: string;

    /**
     * Children of the provider
     */
    children: React.ReactNode;
};

/**
 * The provider of a tag context
 */
export function SingleTagProvider(props: SingleTagProviderProps) {
    const [tag, setTag] = React.useState<SimpleTag | undefined>(undefined);

    const tagsContext = React.useContext(TAGS_CONTEXT);
    const setTagContext = () => setTag(tagsContext.tags.items.find((t) => t.uuid === props.uuid));

    if (!tag && tagsContext !== undefined) {
        setTagContext();
    }

    if (!tag) {
        return null;
    }

    return (
        <SINGLE_TAG_CONTEXT.Provider
            value={{
                tag,
                reset: setTagContext,
            }}
        >
            {props.children}
        </SINGLE_TAG_CONTEXT.Provider>
    );
}
