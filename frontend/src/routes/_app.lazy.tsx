import { BaseLayout } from "@/components/layouts/base-layout";
import { TagsProvider } from "@/context/tags";
import { UserProvider } from "@/context/user";
import { createLazyFileRoute, Outlet } from "@tanstack/react-router";
import { BookText, Soup, TagIcon } from "lucide-react";
import { Suspense } from "react";
import AppSidebar from "@/components/layouts/app-sidebar.tsx";
import Header from "@/components/layouts/header.tsx";

/**
 * The properties for {@link FoodMenu}
 */
export type FoodMenuProps = {};

export const app_meta_data = {
    title: "Recipe App",
    mainIcon: Soup,
    navMain: [
        {
            title: "recipes",
            url: "/app/recipes",
            Icon: BookText,
        },
        {
            title: "tags",
            url: "/app/tag",
            Icon: TagIcon,
        },
    ],
};

/**
 * The root layout for the application
 */
export default function FoodMenu(_props: FoodMenuProps) {
    return (
        <BaseLayout
            sidebar={
                <AppSidebar
                    variant={"inset"}
                    appTitle={app_meta_data.title}
                    Icon={app_meta_data.mainIcon}
                    navItems={app_meta_data.navMain}
                />
            }
            sideHeader={<Header appTitle={app_meta_data.title} icon={app_meta_data.mainIcon} />}
            children={
                <Suspense>
                    <Outlet />
                </Suspense>
            }
        ></BaseLayout>
    );
}

export const Route = createLazyFileRoute("/_app")({
    component: () => (
        <UserProvider>
            <TagsProvider>
                <FoodMenu />
            </TagsProvider>
        </UserProvider>
    ),
});
