import { SidebarTrigger } from "@/components/ui/sidebar.tsx";
import type { LucideIcon } from "lucide-react";
import { Subheading } from "@/components/ui/heading.tsx";
import { RecipeSearch } from "@/components/recipe-search.tsx";
import { Link } from "@tanstack/react-router";

/**
 * The properties for {@link Header}
 */
export type SiteHeaderProps = {
    icon: LucideIcon;
    appTitle?: string;
};

/**
 * The header for closing the sidebar
 */
export default function Header(props: SiteHeaderProps) {
    return (
        <header className="flex h-12 shrink-0 items-center justify-between px-2">
            <Link to={"/app/recipes"} className={"flex items-center justify-center gap-4"}>
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                    <props.icon className="size-4" />
                </div>
                <Subheading className="truncate font-semibold">{props.appTitle}</Subheading>
            </Link>
            <div className={"flex gap-2"}>
                <RecipeSearch />
                <SidebarTrigger />
            </div>
        </header>
    );
}
