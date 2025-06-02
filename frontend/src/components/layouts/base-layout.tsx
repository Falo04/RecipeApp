import type React from "react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar.tsx";
import { useIsMobile } from "@/hooks/use-mobile.ts";

/**
 * The BaseLayout
 */
export function BaseLayout({
    sidebar,
    sideHeader,
    children,
}: React.PropsWithChildren<{
    sidebar: React.ReactNode;
    sideHeader: React.ReactNode;
}>) {
    const isMobile = useIsMobile();
    return (
        <SidebarProvider>
            {sidebar}

            <SidebarInset>
                <div className={"flex flex-1 flex-col"}>
                    <div className="@container/main flex flex-1 flex-col gap-2">
                        <div className={"mx-auto flex w-full flex-1 flex-col lg:max-w-5xl"}>
                            {isMobile && <div className={"bg-sidebar px-4 py-2"}>{sideHeader}</div>}
                            <div className="h-full px-6 py-6 lg:py-10">{children}</div>
                        </div>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
