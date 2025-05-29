import { useTranslation } from "react-i18next";
import { SidebarTrigger } from "@/components/ui/sidebar.tsx";
import type { LucideIcon } from "lucide-react";
import { Subheading } from "@/components/base/heading.tsx";

/**
 * The properties for {@link SiteHeader}
 */
export type SiteHeaderProps = {
    icon: LucideIcon;
    appTitle?: string;
};

/**
 * The header for closing the sidebar
 */
export default function SiteHeader(props: SiteHeaderProps) {
    const [tg] = useTranslation();
    return (
        <header className="flex h-12 shrink-0 items-center justify-between">
            <div className={"flex items-center justify-center gap-4"}>
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                    <props.icon className="size-4" />
                </div>
                <Subheading className="truncate font-semibold">{tg(`${props.appTitle}`)}</Subheading>
            </div>
            <SidebarTrigger />
        </header>
    );
}
