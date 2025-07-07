import { BaseLayout } from "@/components/layouts/base-layout";
import { TagsProvider } from "@/context/tags";
import { UserProvider } from "@/context/user";
import { createLazyFileRoute, Outlet } from "@tanstack/react-router";
import { BookText, CarrotIcon, Soup, TagIcon } from "lucide-react";
import { Suspense } from "react";
import AppSidebar from "@/components/layouts/app-sidebar.tsx";
import BreadcrumbMenuBar from "@/components/layouts/BreadcrumbMenuBar.tsx";
import { IngredientProvider } from "@/context/ingredients.tsx";
import { useTranslation } from "react-i18next";
import { RecipesProvider } from "@/context/recipes.tsx";

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
        title: tg("menu.app-title"),
        mainIcon: Soup,
        navMain: [
            {
                id: "recipes",
                title: tg("menu.recipes"),
                url: "/app/recipes",
                Icon: BookText,
            },
            {
                id: "tags",
                title: tg("menu.tags"),
                url: "/app/tags",
                Icon: TagIcon,
            },
            {
                id: "ingredients",
                title: tg("menu.ingredients"),
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
            header={<BreadcrumbMenuBar navItems={app_meta_data.navMain} />}
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
            <RecipesProvider>
                <TagsProvider>
                    <IngredientProvider>
                        <FoodMenu />
                    </IngredientProvider>
                </TagsProvider>
            </RecipesProvider>
        </UserProvider>
    ),
});
