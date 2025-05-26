import type React from "react";
import { Toaster } from "sonner";

/**
 * The BaseLayout
 */
export function BaseLayout({
    navbar,
    children,
}: React.PropsWithChildren<{
    navbar: React.ReactNode;
}>) {
    return (
        <div className="relative isolate flex h-svh w-full flex-col overflow-hidden bg-white max-lg:flex-col lg:bg-zinc-100 dark:bg-zinc-900 dark:lg:bg-zinc-950">
            <div className="mx-auto w-full max-w-6xl">{navbar}</div>

            <div className="dark:lg:rind-white/10 m-2 flex grow p-3 md:p-8 lg:rounded-lg lg:bg-white lg:shadow-xs lg:ring-1 lg:ring-zinc-950/5 dark:lg:bg-zinc-900">
                <div className="mx-auto w-full lg:max-w-6xl">{children}</div>
            </div>

            <div className="absolute">
                <Toaster richColors expand={true} />
            </div>
        </div>
    );
}
