import { BaseLayout } from "@/components/base/base-layout";
import { TagsProvider } from "@/context/tags";
import { UserProvider } from "@/context/user";
import { createLazyFileRoute, Outlet } from "@tanstack/react-router";
import { BookText, Soup, TagIcon } from "lucide-react";
import { Suspense } from "react";
import AppSidebar from "@/components/base/app-sidebar.tsx";
import SideHeader from "@/components/base/side-header.tsx";

/**
 * The properties for {@link FoodMenu}
 */
export type FoodMenuProps = {};

const data = {
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
 * The FoodMenu
 */
export default function FoodMenu(_props: FoodMenuProps) {
    return (
        <BaseLayout
            sidebar={
                <AppSidebar variant={"inset"} appTitle={data.title} Icon={data.mainIcon} navItems={data.navMain} />
            }
            sideHeader={<SideHeader appTitle={data.title} icon={data.mainIcon} />}
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
