import React from "react";
import { Heading } from "./heading";
import { clsx } from "clsx";
import { Text } from "./text";
import { Button } from "../ui/button";
import { Edit, X } from "lucide-react";

/**
 * The properties for {@link SubmenuLayout}
 */
export type SubmenuLayoutProps = {
    /** The text for the heading */
    heading: string;

    /** Optional description text under the heading */
    headingDescription?: string;

    /** Additional children that will be displayed in the heading */
    headingChildren?: Array<React.ReactNode> | React.ReactNode;

    /** Everything below the heading */
    children?: React.ReactNode;

    /** Set additional classes */
    className?: string;

    /** The link back to main menu */
    navigate: () => void;

    /** The button to open the edit page */
    editButton?: () => void;
};

/**
 * A layout that defines the submenu with a button to get back to the parent menu
 */
export default function SubmenuLayout(props: SubmenuLayoutProps) {
    return (
        <div className={clsx("flex h-full w-full flex-col gap-4", props.className)}>
            <div
                className={clsx(
                    // Base
                    "flex w-full flex-wrap items-end justify-between gap-4",
                    // Colors
                    "border-zinc-950/10 dark:border-white/10",
                )}
            >
                <div className={"flex w-full flex-col gap-3"}>
                    <div className={"flex justify-between"}>
                        <Heading>{props.heading} </Heading>
                        <div className="flex">
                            {props.editButton && (
                                <Button onClick={() => props.editButton?.()} variant={"ghost"} className={"w-fit"}>
                                    <Edit className={"size-6"} />
                                </Button>
                            )}
                            <Button onClick={() => props.navigate()} variant={"ghost"} className={"w-fit"}>
                                <X className={"size-6"} />
                            </Button>
                        </div>
                    </div>
                    {props.headingDescription && <Text>{props.headingDescription}</Text>}
                </div>
                {props.headingChildren !== undefined ? (
                    <div className={"flex justify-end gap-4"}>{props.headingChildren}</div>
                ) : undefined}
            </div>
            {props.children}
        </div>
    );
}
