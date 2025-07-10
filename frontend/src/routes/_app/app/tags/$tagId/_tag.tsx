import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import SINGLE_TAG_CONTEXT, { SingleTagProvider } from "@/context/tag.tsx";
import { Tab, TabMenu } from "@/components/ui/tab-menu.tsx";

/**
 * The properties for {@link SingleTagView}
 */
export type SingleTagViewProps = object;

/**
 * The Layout for a single tag
 */
export default function SingleTagView() {
    const [tg] = useTranslation();

    const { tagId } = Route.useParams();

    return (
        <SingleTagProvider uuid={tagId}>
            <SINGLE_TAG_CONTEXT.Consumer>
                {() => (
                    <TabMenu>
                        <Tab to={"/app/tags/$tagId/general"} params={{ tagId }}>
                            {tg("tab.general")}
                        </Tab>
                        <Tab to={"/app/tags/$tagId/recipe"} params={{ tagId }}>
                            {tg("tab.recipe")}
                        </Tab>
                    </TabMenu>
                )}
            </SINGLE_TAG_CONTEXT.Consumer>
        </SingleTagProvider>
    );
}

export const Route = createFileRoute("/_app/app/tags/$tagId/_tag")({
    component: SingleTagView,
});
