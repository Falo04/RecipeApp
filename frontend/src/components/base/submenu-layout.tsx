import React from "react";
import { Heading } from "./heading";
import { clsx } from "clsx";
import { Text } from "./text";
import { useNavigate, type LinkProps } from "@tanstack/react-router";
import { Button } from "../ui/button";
import { ArrowBigLeftIcon, ArrowLeftIcon, ArrowLeftSquareIcon, ArrowLeftToLine, X } from "lucide-react";

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
  hrefBack: LinkProps["href"];
};

/**
 * A layout that defines the submenu with a button to get back to the parent menu
 */
export default function SubmenuLayout(props: SubmenuLayoutProps) {
  const navigate = useNavigate();

  return (
    <div className={clsx("flex flex-col gap-6", props.className)}>
      <div
        className={clsx(
          // Base
          "flex w-full flex-wrap items-end justify-between gap-4",
          // Colors
          "border-zinc-950/10 dark:border-white/10",
        )}
      >
        <div className={"flex flex-col gap-3 w-full"}>
          <div className={"flex justify-between"}>
            <Heading>{props.heading}</Heading>
            <Button onClick={() => navigate({ to: props.hrefBack })} variant={"ghost"} className={"w-fit"}><X className={"size-6"} /></Button>
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
