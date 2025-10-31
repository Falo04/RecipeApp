import React from "react";
import { cn } from "@/utils/utils.ts";

export function Text({ className, ...props }: React.ComponentPropsWithoutRef<"p">) {
    return (
        <p data-slot="text" {...props} className={cn(className, "text-muted-foreground text-sm/6 sm:text-base/6")} />
    );
}

export function ErrorMessage({ className, ...props }: React.ComponentPropsWithoutRef<"p">) {
    return (
        <p data-slot="text" {...props} className={cn(className, "text-destructive-foreground text-sm text-nowrap")} />
    );
}
