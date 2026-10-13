import type React from "react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar.tsx";

/**
 * The BaseLayout
 */
export function BaseLayout({
    sidebar,
    children,
}: React.PropsWithChildren<{
    sidebar: React.ReactNode;
}>) {
    return (
        <SidebarProvider>
            {sidebar}

            <SidebarInset>
                <div className={"flex flex-1 flex-col"}>
                    <div className="@container/main relative flex flex-1 flex-col gap-2">
                        <div className={"mx-auto flex h-full w-full max-w-6xl flex-1 flex-col px-4"}>{children}</div>
                    </div>
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
