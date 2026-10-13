import { BaseLayout } from "@/components/layouts/base-layout";
import { createLazyFileRoute, type LinkProps, Outlet } from "@tanstack/react-router";
import { BookText, CarrotIcon, type LucideIcon, SettingsIcon, Soup, TagIcon } from "lucide-react";
import { Suspense, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarItem,
    SidebarMenu,
    SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Heading, Subheading } from "@/components/ui/heading";
import { useGetMe } from "@/api/generated";
import WS from "@/api/websockets";
import { Spinner } from "@/components/ui/spinner.tsx";

/**
 * The properties for {@link FoodMenu}
 */
export type FoodMenuProps = object;

export interface SidebarNavItem {
    id: string;
    title: string;
    url: LinkProps["to"];
    Icon: LucideIcon;
}

/**
 *
 */
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
                <Sidebar>
                    <SidebarHeader className={"mt-4"}>
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
                            <SidebarGroupLabel>{tg("menu.tool-label")}</SidebarGroupLabel>
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
                        <SidebarGroup>
                            <SidebarGroupLabel>{tg("menu.personal-label")}</SidebarGroupLabel>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    <SidebarItem href={"/app/settings"}>
                                        <SettingsIcon className={"size-4"} />
                                        <Subheading>{tg("menu.settings")}</Subheading>
                                    </SidebarItem>
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>
                    </SidebarContent>
                </Sidebar>
            }
        >
            <Suspense>
                <Outlet />
            </Suspense>
        </BaseLayout>
    );
}

/**
 * Waits for the logged-in account and keeps the websocket open while it is there
 */
function AppLayout() {
    const { data: account } = useGetMe();

    useEffect(() => {
        if (!account) return;

        WS.connect();
        return () => WS.disconnect();
    }, [account?.uuid]);

    if (!account) {
        return (
            <div className={"flex h-screen items-center justify-center"}>
                <Spinner />
            </div>
        );
    }

    return <FoodMenu />;
}

export const Route = createLazyFileRoute("/_app")({
    component: AppLayout,
});
