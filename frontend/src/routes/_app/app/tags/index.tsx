import type { SimpleTag } from "@/api/model/tag.interface";
import HeadingLayout from "@/components/layouts/heading-layout";
import { DataTable } from "@/components/ui/data-table.tsx";
import { CreateTagDialog } from "@/components/dialogs/create-tag";
import { Badge, badgeVariants } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import TAGS_CONTEXT from "@/context/tags";
import type { ColumnDef } from "@tanstack/react-table";
import type { VariantProps } from "class-variance-authority";
import React, { Suspense } from "react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip.tsx";
import { Text } from "@/components/ui/text.tsx";

/**
 * The properties for {@link TagsOverview}
 */
export type TagsOverviewProps = {};

/**
 * Renders a tag overview table.
 *
 * @param _props
 */
export function TagsOverview(_props: TagsOverviewProps) {
    const [t] = useTranslation("tag");
    const [tg] = useTranslation();

    const tagContext = React.useContext(TAGS_CONTEXT);

    const [openCreateTag, setOpenCreateTag] = React.useState(false);

    const columns: ColumnDef<SimpleTag>[] = useMemo(
        () => [
            {
                accessorKey: "name",
                header: () => <span>{tg("table.name")}</span>,
                cell: ({ row }) => (
                    <Link to={"/app/tags/$tagId/general"} params={{ tagId: row.original.uuid }}>
                        <Text className="hover:text-foreground overflow-hidden text-ellipsis">{row.original.name}</Text>
                    </Link>
                ),
            },
            {
                accessorKey: "color",
                header: () => <span>{tg("table.color")}</span>,
                cell: ({ row }) => (
                    <Badge variant={row.original.color.toLowerCase() as VariantProps<typeof badgeVariants>["variant"]}>
                        {row.original.color}
                    </Badge>
                ),
            },
            {
                accessorKey: "action",
                header: () => <div className="flex justify-end">{tg("table.action")}</div>,
                cell: ({ row }) => (
                    <div className={"flex justify-end pr-4"}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Link to={"/app/tags/$tagId/general"} params={{ tagId: row.original.uuid }}>
                                    <Info className={"size-4"} />
                                </Link>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{tg("tooltip.info")}</p>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                ),
            },
        ],
        [],
    );

    return (
        <HeadingLayout
            heading={t("heading.overview-title")}
            headingChildren={<Button onClick={() => setOpenCreateTag(true)}>{t("button.create")}</Button>}
        >
            <DataTable filterTag={t("input.filter")} data={tagContext.tags.items} columns={columns} />

            {openCreateTag && (
                <Suspense>
                    <CreateTagDialog
                        onClose={() => {
                            setOpenCreateTag(false);
                        }}
                    />
                </Suspense>
            )}
        </HeadingLayout>
    );
}

export const Route = createFileRoute("/_app/app/tags/")({
    component: TagsOverview,
});
