import { createFileRoute, Outlet } from "@tanstack/react-router";
import SINGLE_TAG_CONTEXT, { SingleTagProvider } from "@/context/tag.tsx";

/**
 * The properties for {@link SingleTagView}
 */
export type SingleTagViewProps = object;

/**
 * The Layout for a single tag
 */
export default function SingleTagView() {
    const { tagId } = Route.useParams();

    return (
        <SingleTagProvider uuid={tagId}>
            <SINGLE_TAG_CONTEXT.Consumer>{() => <Outlet />}</SINGLE_TAG_CONTEXT.Consumer>
        </SingleTagProvider>
    );
}

export const Route = createFileRoute("/_app/app/tags/$tagId/_tag")({
    component: SingleTagView,
});
