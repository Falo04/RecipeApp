import { BaseLayout } from "@/components/layouts/base-layout";
import { TagsProvider } from "@/context/tags";
import { UserProvider } from "@/context/user";
import { createLazyFileRoute, Outlet } from "@tanstack/react-router";
import { BookText, CarrotIcon, Soup, TagIcon } from "lucide-react";
import { Suspense } from "react";
import AppSidebar from "@/components/layouts/app-sidebar.tsx";
import Header from "@/components/layouts/header.tsx";
import { IngredientProvider } from "@/context/ingredients.tsx";
import { useTranslation } from "react-i18next";

/**
 * The properties for {@link FoodMenu}
 */
export type FoodMenuProps = {};

/**
 * The root layout for the application
 */
export default function FoodMenu(_props: FoodMenuProps) {
    const [tg] = useTranslation();
    const app_meta_data = {
        title: tg("sidebar.app-title"),
        mainIcon: Soup,
        navMain: [
            {
                title: tg("sidebar.recipes"),
                url: "/app/recipes",
                Icon: BookText,
            },
            {
                title: tg("sidebar.tags"),
                url: "/app/tag",
                Icon: TagIcon,
            },
            {
                title: tg("sidebar.ingredients"),
                url: "/app/ingredients",
                Icon: CarrotIcon,
            },
        ],
    };
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
                <IngredientProvider>
                    <FoodMenu />
                </IngredientProvider>
            </TagsProvider>
        </UserProvider>
    ),
});
