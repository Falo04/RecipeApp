import type { QueryClient } from "@tanstack/react-query";
import {
    createRootRouteWithContext,
    type ErrorComponentProps,
    isRedirect,
    Navigate,
    Outlet,
} from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Heading } from "@/components/ui/heading.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Text } from "@/components/ui/text.tsx";

/**
 * The root error component
 */
function ErrorComponent(props: ErrorComponentProps) {
    const [t] = useTranslation("error-component");

    // A query whose session ran out redirects to the login
    if (isRedirect(props.error)) {
        return <Navigate {...props.error.options} />;
    }

    return (
        <div className={"flex h-screen w-full items-center justify-center"}>
            <div
                className={
                    "flex max-w-xl min-w-sm flex-col gap-6 rounded-lg border border-zinc-300 bg-white p-12 dark:border-zinc-800 dark:bg-zinc-900"
                }
            >
                <Heading>{String(props.error)}</Heading>
                <Text>{t("error.description")}</Text>

                <Button className={"w-full"} onClick={() => props.reset()}>
                    Try again
                </Button>

                <Button onClick={() => history.back()}>Back</Button>
            </div>
        </div>
    );
}

/** What every route gets in its context */
export type RouterContext = {
    /** The client caching every api request */
    queryClient: QueryClient;
};

export const Route = createRootRouteWithContext<RouterContext>()({
    component: Outlet,
    errorComponent: (err) => <ErrorComponent {...err} />,
});
