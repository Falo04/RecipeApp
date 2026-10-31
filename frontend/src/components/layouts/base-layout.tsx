import type React from "react";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar.tsx";

/**
 * The BaseLayout
 *
 * On desktop the sidebar sits directly on the page background and the content
 * lives in a raised panel next to it. On mobile a small navbar with a menu
 * button replaces the sidebar.
 */
export function BaseLayout({
    sidebar,
    header,
    children,
}: React.PropsWithChildren<{
    sidebar: React.ReactNode;
    /** Content shown next to the menu button in the mobile navbar */
    header?: React.ReactNode;
}>) {
    return (
        <SidebarProvider>
            {sidebar}

            <SidebarInset>
                <header className={"flex items-center gap-2 border-b px-4 py-2.5 md:hidden"}>
                    <SidebarTrigger />
                    <div className={"min-w-0 flex-1"}>{header}</div>
                </header>

                <div className="@container/main flex flex-1 flex-col p-6 lg:p-10">
                    <div className={"mx-auto flex w-full max-w-6xl flex-1 flex-col"}>{children}</div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
