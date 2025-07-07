import { SidebarTrigger } from "@/components/ui/sidebar.tsx";
import { RecipeSearch } from "@/components/recipe-search.tsx";
import { useIsMobile } from "@/hooks/use-mobile";
import {
    Breadcrumb,
    BreadcrumbEllipsis,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbSeparator,
} from "../ui/breadcrumb";
import { useTranslation } from "react-i18next";
import type { NavItem } from "./navbar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.tsx";
import { Link, useRouterState } from "@tanstack/react-router";
import RECIPES_CONTEXT from "@/context/recipes.tsx";
import React from "react";
import TAGS_CONTEXT from "@/context/tags.tsx";

/**
 * The properties for {@link BreadcrumbMenuBar}
 */
export type SiteHeaderProps = {
    navItems: NavItem[];
};

/**
 * The header for closing the sidebar
 */
export default function BreadcrumbMenuBar(props: SiteHeaderProps) {
    const [tg] = useTranslation();
    const isMobile = useIsMobile();

    const recipesContext = React.useContext(RECIPES_CONTEXT);
    const tagsContext = React.useContext(TAGS_CONTEXT);

    const pathName = useRouterState().location.pathname;
    const path = pathName.split("/").slice(2);

    const entityName = React.useMemo(() => {
        if (path.length > 0 && path[0] !== "dashboard") {
            switch (path[0]) {
                case "recipes":
                    return recipesContext.recipes.items.find((r) => r.uuid === path[1])?.name || path[1];
                case "tags":
                    return tagsContext.tags.items.find((t) => t.uuid === path[1])?.name || path[1];
            }
        }
        return undefined;
    }, [path, recipesContext.recipes.items, tagsContext.tags.items]);

    const nav = React.useMemo(
        () => (path[0] && path[0] !== "dashboard" ? props.navItems.find((n) => n.id === path[0]) || null : null),
        [path],
    );

    const remainingPath = path.slice(2);

    return (
        <div className="flex items-center justify-between gap-4 p-2">
            <Breadcrumb>
                <BreadcrumbList>
                    {!isMobile && (
                        <>
                            <BreadcrumbLink asChild>
                                <Link to="">{tg("menu.dashboard")}</Link>
                            </BreadcrumbLink>
                            <BreadcrumbSeparator />
                        </>
                    )}
                    <BreadcrumbItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger className="flex items-center gap-1">
                                <BreadcrumbEllipsis className={"size-4"} />
                                <span className={"sr-only"}>{tg("sr-only.breadcrumb-menu")}</span>{" "}
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align={"start"}>
                                {props.navItems.map((navItem: NavItem) => (
                                    <DropdownMenuItem key={navItem.title}>
                                        <Link to={navItem.url}>{navItem.title}</Link>
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    {nav && (
                        <BreadcrumbLink asChild>
                            <Link to={nav.url}>{nav.title}</Link>
                        </BreadcrumbLink>
                    )}
                    {entityName && (
                        <>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>{entityName}</BreadcrumbItem>
                        </>
                    )}
                    {!isMobile &&
                        remainingPath.map((p) => (
                            <div key={p} className={"flex items-center gap-1"}>
                                <BreadcrumbSeparator />
                                <BreadcrumbItem>{tg(`tab.${p}`)}</BreadcrumbItem>
                            </div>
                        ))}
                </BreadcrumbList>
            </Breadcrumb>
            <div className={"flex gap-2"}>
                {isMobile && (
                    <>
                        <RecipeSearch />
                        <SidebarTrigger />
                    </>
                )}
            </div>
        </div>
    );
}
