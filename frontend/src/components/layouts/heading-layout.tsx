import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";

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
                <div className={"flex flex-row justify-between gap-2"}>
                    <div className={"flex flex-col items-start"}>
                        <CardTitle className={"text-2xl"}>{props.heading}</CardTitle>
                        <CardDescription>{props.description}</CardDescription>
                    </div>
                    {props.headingChildren !== undefined ? (
                        <div className={"flex justify-end gap-4"}>{props.headingChildren}</div>
                    ) : undefined}
                </div>
            </CardHeader>
            <CardContent className={"flex w-full flex-col gap-4"}>{props.children}</CardContent>
        </Card>
    );
}
