import React from "react";
import { Link, type LinkProps } from "@tanstack/react-router";
import { Heading } from "@/components/ui/heading.tsx";
import { Text } from "@/components/ui/text.tsx";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb.tsx";
import { SidebarTrigger } from "@/components/ui/sidebar.tsx";
import { useIsMobile } from "@/hooks/use-mobile.ts";
import { cn } from "@/utils/utils.ts";

/**
 * A single entry of the breadcrumb trail
 */
export type BreadcrumbEntry = {
    /** The text shown for this entry */
    label: string;
    /** Where this entry links to, the last entry is never a link */
    href?: LinkProps["to"];
    /** Params for href */
    params?: LinkProps["params"];
    /** Search params for href */
    search?: LinkProps["search"];
};

/**
 * The properties for {@link HeadingLayout}
 */
export type HeadingLayoutProps = {
    /** The text for the heading */
    heading: string;
    /** The text for the description */
    description?: string;
    /** The breadcrumb trail shown above the heading */
    breadcrumbs?: Array<BreadcrumbEntry>;
    /** Additional children that will be displayed next to the heading, e.g. actions */
    headingChildren?: React.ReactNode;
    /** Everything below the heading */
    children?: React.ReactNode;
    /** Set additional classes */
    className?: string;
};

/**
 * A layout that includes breadcrumbs and a top level heading with a description and optional actions
 */
export default function HeadingLayout(props: HeadingLayoutProps) {
    const isMobile = useIsMobile();
    const breadcrumbs = props.breadcrumbs ?? [];

    return (
        <div className={cn("flex w-full flex-col gap-6 py-4", props.className)}>
            <div className={"flex flex-col gap-2"}>
                {(isMobile || breadcrumbs.length > 0) && (
                    <div className={"flex items-center gap-2"}>
                        {isMobile && <SidebarTrigger className={"-ms-1.5"} />}
                        <Breadcrumb className={"min-w-0"}>
                            <BreadcrumbList>
                                {breadcrumbs.map((entry, idx) => {
                                    const isLast = idx === breadcrumbs.length - 1;
                                    return (
                                        <React.Fragment key={idx}>
                                            {idx > 0 && <BreadcrumbSeparator />}
                                            <BreadcrumbItem className={"min-w-0"}>
                                                {isLast || entry.href === undefined ? (
                                                    <BreadcrumbPage className={"truncate"}>
                                                        {entry.label}
                                                    </BreadcrumbPage>
                                                ) : (
                                                    <BreadcrumbLink
                                                        className={"truncate"}
                                                        render={
                                                            <Link
                                                                to={entry.href}
                                                                params={entry.params}
                                                                search={entry.search}
                                                            />
                                                        }
                                                    >
                                                        {entry.label}
                                                    </BreadcrumbLink>
                                                )}
                                            </BreadcrumbItem>
                                        </React.Fragment>
                                    );
                                })}
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                )}
                <div className={"flex items-start justify-between gap-4"}>
                    <div className={"flex min-w-0 flex-col gap-1"}>
                        <Heading className={"text-2xl"}>{props.heading}</Heading>
                        {props.description && <Text>{props.description}</Text>}
                    </div>
                    {props.headingChildren !== undefined && (
                        <div className={"flex shrink-0 items-center gap-2"}>{props.headingChildren}</div>
                    )}
                </div>
            </div>
            <div className={"flex w-full flex-col gap-4"}>{props.children}</div>
        </div>
    );
}
