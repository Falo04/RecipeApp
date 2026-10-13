import { createFileRoute, Outlet } from "@tanstack/react-router";

/**
 * The properties for {@link SingleTagView}
 */
export type SingleTagViewProps = object;

/**
 * The Layout for a single tag
 */
export default function SingleTagView() {
    return <Outlet />;
}

export const Route = createFileRoute("/_app/app/tags/$tagId/_tag")({
    component: SingleTagView,
});
