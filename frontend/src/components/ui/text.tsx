import clsx from "clsx";
import React from "react";

export function Text({ className, ...props }: React.ComponentPropsWithoutRef<"p">) {
    return (
        <p
            data-slot="text"
            {...props}
            className={clsx(className, "text-sm/6 text-zinc-500 sm:text-base/6 dark:text-zinc-400")}
        />
    );
}
