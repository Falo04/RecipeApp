import { Link, useRouterState, type LinkProps, Outlet } from "@tanstack/react-router";
import React from "react";
import { cn } from "@/lib/utils.ts";
import { motion } from "framer-motion";

export type TabMenuProps = {
    children: React.ReactNode;
};

export function TabMenu(props: TabMenuProps) {
    return (
        <div className={"gap4 sticky top-0 flex h-full w-full flex-col gap-6"}>
            <nav className={"border-border flex gap-6 border-b"}>{props.children}</nav>
            <Outlet />
        </div>
    );
}

export type TabProps = {
    children: string;
    className?: string;
} & LinkProps;

export function Tab(props: TabProps) {
    const { children, className, ...others } = props;
    const lastPath = useRouterState().location.pathname.split("/").pop();
    const lastLinkPath = props.to?.split("/").pop();

    const isActive = lastLinkPath === lastPath;

    const linkClasses = cn(
        // Base layout
        "flex flex-col w-fit items-center justify-center py-2",
        // Border
        "border-b-2 border-transparent rounded-t-lg",
        className,
    );

    const textClasses = cn(
        // Base
        "font-medium flex gap-3",
        // Hover
        "hover:text-foreground",
        // Active
        isActive ? "text-foreground" : "text-muted-foreground",
    );

    return (
        <Link {...others} className={linkClasses}>
            <span className={textClasses}>{props.children}</span>
            {isActive && (
                <motion.div
                    layoutId={"current-tab-indicator"}
                    className={"bg-primary relative -bottom-2.5 h-0.5 w-full rounded-full"}
                />
            )}
        </Link>
    );
}
