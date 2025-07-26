import { type SidebarNavItem, SidebarTrigger } from "@/components/ui/sidebar.tsx";
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.tsx";
import { Link, useRouterState } from "@tanstack/react-router";
import React from "react";
import SINGLE_RECIPE_CONTEXT from "@/context/recipe.tsx";
import SINGLE_TAG_CONTEXT from "@/context/tag.tsx";

/**
 * The properties for {@link BreadcrumbMenuBar}
 */
export type SiteHeaderProps = {
    navItems: SidebarNavItem[];
};

/**
 * The header for closing the sidebar
 */
export default function BreadcrumbMenuBar(props: SiteHeaderProps) {
    const [tg] = useTranslation();
    const isMobile = useIsMobile();

    const recipeContext = React.useContext(SINGLE_RECIPE_CONTEXT);
    const tagContext = React.useContext(SINGLE_TAG_CONTEXT);

    const pathName = useRouterState().location.pathname;
    const path = pathName.split("/").slice(2);

    const entityName = React.useMemo(() => {
        if (path.length > 0 && path[0] !== "dashboard") {
            switch (path[0]) {
                case "recipes":
                    return recipeContext.recipe.name;
                case "tags":
                    return tagContext.tag.name;
            }
        }
        return undefined;
    }, [path, recipeContext.recipe.name, tagContext.tag.name]);

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
                                {props.navItems.map((items) => (
                                    <DropdownMenuItem key={items.title}>
                                        <Link to={items.url}>{items.title}</Link>
                                    </DropdownMenuItem>
                                ))}
                                <DropdownMenuItem>
                                    <Link to={"/app/settings"}>{tg("menu.settings")}</Link>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    {path[0] === "settings" && (
                        <BreadcrumbLink asChild>
                            <Link to={"/app/settings"}>{tg("menu.settings")}</Link>
                        </BreadcrumbLink>
                    )}
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
