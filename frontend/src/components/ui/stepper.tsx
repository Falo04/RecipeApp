import React from "react";
import { Subheading } from "@/components/ui/heading.tsx";
import { Text } from "@/components/ui/text.tsx";
import { cn } from "@/lib/utils.ts";
import { CheckIcon, type LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useIsMobile } from "@/hooks/use-mobile.ts";

/**
 * The properties for {@link Stepper}
 */
export type StepperProps = {
    /** All steps that should be shown */
    steps: Array<StepperSteps>;
    /** The class names */
    className?: string;
};

/**
 * The steps for the Stepper
 */
export type StepperSteps = {
    /** Icon inside the bubble, if not provided just a check|pending icon */
    icon?: LucideIcon;
    /** Title for this step */
    title: string;
    /** Description for this step */
    description?: string | React.ReactNode;
    /** State which the step is in */
    state: "finished" | "pending" | "active";
    /** Indicates if the step has an error */
    errorState: boolean;
};

/**
 * A stepper component
 */
function StepperHorizontal(props: StepperProps) {
    const [tg] = useTranslation();
    const isMobile = useIsMobile();

    const bubbleActiveClass = cn(
        // Layout
        "relative z-10 flex size-8 items-center justify-center rounded-full",
        // Colors
        "border-primary/90 bg-sidebar border-2",
    );

    const bubblePendingClass = cn(
        // Layout
        "relative z-10 flex size-8 items-center justify-center rounded-full",
        // Colors
        "bg-sidebar border-sidebar-ring border-2",
    );

    return (
        <nav className={props.className}>
            <ol className="overflow-hidden">
                {props.steps.map((step, index) => (
                    <li className={"relative ms-2 mb-8 lg:ms-6"} key={index}>
                        {/* connection */}
                        {index !== props.steps.length - 1 && (
                            <div
                                className={cn(
                                    "absolute top-9 left-4 mt-0.5 -ml-px h-full w-0.5",
                                    step.state === "finished" ? "bg-primary" : "bg-border",
                                )}
                            />
                        )}
                        <div className={"relative flex gap-4"}>
                            {/* Bubble with Icon */}
                            <span className={"flex h-9 items-center pt-2"}>
                                <span
                                    className={
                                        "bg-primary relative z-10 flex size-8 items-center justify-center rounded-full"
                                    }
                                >
                                    {step.icon ? (
                                        step.state === "finished" ? (
                                            <step.icon className={"text-foreground size-5"} />
                                        ) : step.state === "active" ? (
                                            <span className={bubbleActiveClass}>
                                                <step.icon className={"text-primary size-5 animate-pulse"} />
                                            </span>
                                        ) : (
                                            <span className={bubblePendingClass}>
                                                <step.icon className={"size-5 rounded-full bg-transparent"} />
                                            </span>
                                        )
                                    ) : step.state === "finished" ? (
                                        <CheckIcon className={"text-foreground size-5"} />
                                    ) : step.state === "active" ? (
                                        <span className={bubbleActiveClass}>
                                            <span className={"bg-primary/90 size-2.5 animate-pulse rounded-full"} />
                                        </span>
                                    ) : (
                                        <span className={bubblePendingClass}>
                                            <span className={"size-2.5 rounded-full bg-transparent"} />
                                        </span>
                                    )}
                                    {step.errorState && (
                                        <span
                                            className={
                                                "border-destructive bg-sidebar absolute z-20 flex size-8 items-center justify-center rounded-full border-2"
                                            }
                                        >
                                            <span
                                                className={
                                                    "bg-destructive-foreground size-2.5 animate-pulse rounded-full"
                                                }
                                            />
                                        </span>
                                    )}
                                </span>
                            </span>
                            {!isMobile && (
                                <div className={"flex flex-col justify-center"}>
                                    <Subheading level={3}>{step.title}</Subheading>
                                    {step.errorState ? (
                                        <span className={"text-destructive-foreground text-sm text-nowrap"}>
                                            {tg("error.stepper-message")}
                                        </span>
                                    ) : (
                                        step.description && <Text>{step.description}</Text>
                                    )}
                                </div>
                            )}
                        </div>
                    </li>
                ))}
            </ol>
        </nav>
    );
}

/**
 * A stepper component
 */
function StepperVertical(props: StepperProps) {
    const [tg] = useTranslation();
    const isMobile = useIsMobile();

    const bubbleActiveClass = cn(
        // Layout
        "relative z-10 flex size-8 items-center justify-center rounded-full",
        // Colors
        "border-primary/90 bg-sidebar border-2",
    );

    const bubblePendingClass = cn(
        // Layout
        "relative z-10 flex size-8 items-center justify-center rounded-full",
        // Colors
        "bg-sidebar border-sidebar-ring border-2",
    );

    return (
        <nav className={props.className}>
            <ol className="flex justify-center overflow-hidden">
                {props.steps.map((step, index) => (
                    <li className={"relative mr-8 mb-2 lg:ms-6"} key={index}>
                        {/* connection */}
                        {index !== props.steps.length - 1 && (
                            <div
                                className={cn(
                                    "absolute top-4 left-8 mt-0.5 -ml-px h-0.5 w-full",
                                    step.state === "finished" ? "bg-primary" : "bg-border",
                                )}
                            />
                        )}
                        <div className={"relative flex gap-4"}>
                            {/* Bubble with Icon */}
                            <span className={"flex h-9 items-center pt-2"}>
                                <span
                                    className={
                                        "bg-primary relative z-10 flex size-8 items-center justify-center rounded-full"
                                    }
                                >
                                    {step.icon ? (
                                        step.state === "finished" ? (
                                            <step.icon className={"text-foreground size-5"} />
                                        ) : step.state === "active" ? (
                                            <span className={bubbleActiveClass}>
                                                <step.icon className={"text-primary size-5 animate-pulse"} />
                                            </span>
                                        ) : (
                                            <span className={bubblePendingClass}>
                                                <step.icon className={"size-5 rounded-full bg-transparent"} />
                                            </span>
                                        )
                                    ) : step.state === "finished" ? (
                                        <CheckIcon className={"text-foreground size-5"} />
                                    ) : step.state === "active" ? (
                                        <span className={bubbleActiveClass}>
                                            <span className={"bg-primary/90 size-2.5 animate-pulse rounded-full"} />
                                        </span>
                                    ) : (
                                        <span className={bubblePendingClass}>
                                            <span className={"size-2.5 rounded-full bg-transparent"} />
                                        </span>
                                    )}
                                    {step.errorState && (
                                        <span
                                            className={
                                                "border-destructive bg-sidebar absolute z-20 flex size-8 items-center justify-center rounded-full border-2"
                                            }
                                        >
                                            <span
                                                className={
                                                    "bg-destructive-foreground size-2.5 animate-pulse rounded-full"
                                                }
                                            />
                                        </span>
                                    )}
                                </span>
                            </span>
                            {!isMobile && (
                                <div className={"flex flex-col justify-center"}>
                                    <Subheading level={3}>{step.title}</Subheading>
                                    {step.errorState ? (
                                        <span className={"text-destructive-foreground text-sm text-nowrap"}>
                                            {tg("error.stepper-message")}
                                        </span>
                                    ) : (
                                        step.description && <Text>{step.description}</Text>
                                    )}
                                </div>
                            )}
                        </div>
                    </li>
                ))}
            </ol>
        </nav>
    );
}

export { StepperVertical, StepperHorizontal };
