import React from "react";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";

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
};

/**
 * A layout that includes a top level heading
 */
export default function HeadingLayout(props: HeadingLayoutProps) {
    return (
        <Card className={props.className}>
            <CardHeader>
                <CardTitle className={"text-2xl"}>{props.heading}</CardTitle>
                <CardDescription>{props.description}</CardDescription>
                {props.headingChildren !== undefined ? (
                    <CardAction className={"flex justify-end gap-4"}>{props.headingChildren}</CardAction>
                ) : undefined}
            </CardHeader>
            <CardContent className={"flex w-full flex-col gap-4"}>{props.children}</CardContent>
        </Card>
    );
}
