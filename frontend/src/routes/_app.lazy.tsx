import { BaseLayout } from "@/components/layouts/base-layout";
import { TagsProvider } from "@/context/tags";
import { UserProvider } from "@/context/user";
import { createLazyFileRoute, Outlet } from "@tanstack/react-router";
import { BookText, CarrotIcon, SettingsIcon, Soup, TagIcon } from "lucide-react";
import { Suspense } from "react";
import BreadcrumbMenuBar from "@/components/layouts/BreadcrumbMenuBar.tsx";
import { IngredientProvider } from "@/context/ingredients.tsx";
import { useTranslation } from "react-i18next";
import { RecipesProvider } from "@/context/recipes.tsx";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarHeader,
    SidebarItem,
    SidebarMenu,
    SidebarMenuItem,
    type SidebarNavItem,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Heading, Subheading } from "@/components/ui/heading";

/**
 * The properties for {@link FoodMenu}
 */
export type FoodMenuProps = object;

export function FoodMenu() {
    const [tg] = useTranslation();

    const navMain: Array<SidebarNavItem> = [
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
    ];

    return (
        <BaseLayout
            sidebar={
                <Sidebar variant={"inset"}>
                    <SidebarHeader>
                        <SidebarMenu>
                            <SidebarMenuItem className={"flex items-center justify-center gap-2"}>
                                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                                    <Soup className="size-4" />
                                </div>
                                <Heading className="truncate font-semibold">{tg("menu.app-title")}</Heading>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarHeader>
                    <SidebarContent>
                        <SidebarGroup>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    {navMain.map(({ id, title, url, Icon }) => (
                                        <SidebarItem href={url} key={id}>
                                            <Icon className="size-4" />
                                            <Subheading className={"p-1"}>{title}</Subheading>
                                        </SidebarItem>
                                    ))}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>
                    </SidebarContent>
                    <SidebarFooter>
                        <Separator />
                        <SidebarMenu>
                            <SidebarItem href={"/app/settings"}>
                                <SettingsIcon className={"size-4"} />
                                <Subheading>{tg("menu.settings")}</Subheading>
                            </SidebarItem>
                        </SidebarMenu>
                    </SidebarFooter>
                </Sidebar>
            }
            header={<BreadcrumbMenuBar navItems={navMain} />}
        >
            <Suspense>
                <Outlet />
            </Suspense>
        </BaseLayout>
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
