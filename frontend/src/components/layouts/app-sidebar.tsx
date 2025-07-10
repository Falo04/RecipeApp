import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar.tsx";
import { Link, useRouterState } from "@tanstack/react-router";
import { type LucideIcon, SettingsIcon } from "lucide-react";
import { Heading, Subheading } from "@/components/ui/heading.tsx";
import { useTranslation } from "react-i18next";
import React from "react";
import { RecipeSearch } from "@/components/recipe-search.tsx";
import { useIsMobile } from "@/hooks/use-mobile.ts";
import { Separator } from "@/components/ui/separator.tsx";

/**
 * Represents a single item within a navigation menu.
 */
export type NavItem = {
    id: string;
    title: string;
    url: string;
    Icon: LucideIcon;
};

/**
 * The properties for {@link AppSidebar}
 */
export interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
    appTitle: string;
    Icon: LucideIcon;
    navItems: NavItem[];
}

/**
 * The component for the app sidebar
 */
export default function AppSidebar({ appTitle, Icon, navItems, ...props }: AppSidebarProps) {
    const [tg] = useTranslation();
    const { setOpenMobile } = useSidebar();

    const pathName = useRouterState().location.pathname;
    const isMobile = useIsMobile();

    return (
        <Sidebar {...props}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem className={"flex items-center justify-center gap-2"}>
                        <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                            <Icon className="size-4" />
                        </div>
                        <Heading className="truncate font-semibold">{appTitle}</Heading>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    {!isMobile && (
                        <SidebarGroupContent>
                            <SidebarMenu>
                                <SidebarMenuItem>
                                    <RecipeSearch />
                                </SidebarMenuItem>
                            </SidebarMenu>
                        </SidebarGroupContent>
                    )}
                </SidebarGroup>
                <Separator />
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {navItems.map(({ Icon, title, url }) => (
                                <SidebarMenuItem key={title}>
                                    <SidebarMenuButton asChild isActive={pathName.includes(url)}>
                                        <Link to={url} onClick={() => setOpenMobile(false)}>
                                            <Icon className="size-4" />
                                            <Subheading>{title}</Subheading>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
                <Separator />
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton asChild isActive={pathName.includes("settings")}>
                            <Link to={"/app/settings"} onClick={() => setOpenMobile(false)}>
                                <SettingsIcon className={"size-4"} />
                                <Subheading>{tg("menu.settings")}</Subheading>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );
}
