import React from "react";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { cn } from "@/utils/utils.ts";

/**
 * The properties for {@link HeadingLayout}
 */
export type HeadingLayoutProps = {
    /** The text for the heading */
    heading: string;
    /** The text for the description */
    description: string;
    /** Additional children that will be displayed in the heading */
    headingChildren?: Array<React.ReactNode> | React.ReactNode;
    /** Everything below the heading */
    children?: React.ReactNode;
    /** Set additional classes */
    className?: string;
    /** Additional classes for CardHeader */
    classNameHeader?: string;
};

/**
 * A layout that includes a top level heading
 */
export default function HeadingLayout(props: HeadingLayoutProps) {
    return (
        <Card className={props.className}>
            <CardHeader className={cn(props.classNameHeader)}>
                <CardTitle className={"text-2xl"}>{props.heading}</CardTitle>
                <CardDescription>{props.description}</CardDescription>
                {props.headingChildren !== undefined ? (
                    <CardAction>{props.headingChildren}</CardAction>
                ) : undefined}
            </CardHeader>
            <CardContent className={"flex w-full flex-col gap-4"}>{props.children}</CardContent>
        </Card>
    );
}
