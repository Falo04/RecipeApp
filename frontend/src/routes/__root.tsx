import { createRootRoute, type ErrorComponentProps, Outlet } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Heading } from "@/components/ui/heading.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Text } from "@/components/ui/text.tsx";
import { ErrorContext } from "@/context/error-context.tsx";

/**
 * The root error component
 */
function ErrorComponent(props: ErrorComponentProps) {
    const [t] = useTranslation("error-component");

    return (
        <div className={"flex h-screen w-full items-center justify-center"}>
            <div
                className={
                    "flex max-w-xl min-w-sm flex-col gap-6 rounded-lg border border-zinc-300 bg-white p-12 dark:border-zinc-800 dark:bg-zinc-900"
                }
            >
                <Heading>{props.error.toString()}</Heading>
                <Text>{t("error.description")}</Text>

                <Button color={"blue"} className={"w-full"} onClick={() => props.reset()}>
                    Try again
                </Button>

                <Button onClick={() => history.back()}>Back</Button>
            </div>
        </div>
    );
}

export const Route = createRootRoute({
    component: () => (
        <>
            <ErrorContext />
            <Outlet />
        </>
    ),
    errorComponent: (err) => <ErrorComponent {...err} />,
});
