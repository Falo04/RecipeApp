import HeadingLayout from "@/components/layouts/heading-layout";
import { CreateTagDialog } from "@/components/dialogs/create-tag";
import { Button } from "@/components/ui/button";
import React, { Suspense } from "react";
import { useTranslation } from "react-i18next";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { MoreHorizontalIcon, PenBoxIcon, Trash2Icon } from "lucide-react";
import { Text } from "@/components/ui/text.tsx";
import { Api } from "@/api/api.tsx";
import { toast } from "sonner";
import { useForm } from "@tanstack/react-form";
import { Form, Input } from "@/components/ui/form.tsx";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.tsx";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table.tsx";
import TablePagination from "@/components/ui/table-pagination.tsx";
import type { SimpleTag } from "@/api/model/tag.interface.ts";
import { EditTagDialog } from "@/components/dialogs/edit-tag.tsx";
import { DeleteTagDialog } from "@/components/dialogs/delete-tag";
import { Badge, badgeVariants } from "@/components/ui/badge.tsx";
import type { VariantProps } from "class-variance-authority";

/**
 * The properties for {@link TagsOverview}
 */
export type TagsOverviewProps = object;

const LIMIT = 50;

/**
 * Renders a tag overview table.
 */
export function TagsOverview() {
    const [t] = useTranslation("tag");
    const [tg] = useTranslation();

    const navigate = useNavigate();

    const { search, page } = Route.useSearch();
    const data = Route.useLoaderData();
    if (!data) {
        return;
    }

    const [openCreate, setOpenCreate] = React.useState(false);
    const [openEdit, setOpenEdit] = React.useState<SimpleTag>();
    const [openDelete, setOpenDelete] = React.useState<string | undefined>(undefined);

    const form = useForm({
        defaultValues: {
            search: search,
        },
    });

    return (
        <HeadingLayout
            heading={t("heading.overview-title")}
            description={t("headiner.overview-description")}
            headingChildren={<Button onClick={() => setOpenCreate(true)}>{t("button.create")}</Button>}
        >
            <Form onSubmit={form.handleSubmit}>
                <form.Field
                    name={"search"}
                    validators={{
                        onChangeAsync: async ({ fieldApi }) => {
                            await navigate({
                                to: `/app/tags`,
                                search: {
                                    page: 1,
                                    search: fieldApi.state.value,
                                },
                            });
                        },
                        onChangeAsyncDebounceMs: 500,
                    }}
                >
                    {(fieldApi) => (
                        <div>
                            <Input
                                value={fieldApi.state.value}
                                onChange={(e) => fieldApi.handleChange(e.target.value)}
                                placeholder={t("label.placeholder")}
                                className={"w-44 lg:w-72"}
                            />
                        </div>
                    )}
                </form.Field>
            </Form>
            <Table>
                <TableHeader className={"sticky top-0"}>
                    <TableRow>
                        <TableHead>{tg("table.name")}</TableHead>
                        <TableHead>{tg("table.color")}</TableHead>
                        <TableHead className={"w-0"}>
                            <span className={"sr-only"}>{tg("accessibility.actions")}</span>
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.items.map((tag) => (
                        <TableRow
                            key={tag.uuid}
                            onClick={async (e) => {
                                const target = e.target as HTMLElement;
                                if (!target.closest("[data-nolink]") && e.currentTarget.contains(target)) {
                                    await navigate({
                                        to: "/app/tags/$tagId",
                                        params: { tagId: tag.uuid },
                                    });
                                }
                            }}
                        >
                            <TableCell>
                                <Text>{tag.name}</Text>
                            </TableCell>
                            <TableCell>
                                <Badge
                                    variant={tag.color.toLowerCase() as VariantProps<typeof badgeVariants>["variant"]}
                                >
                                    {tag.color}
                                </Badge>
                            </TableCell>
                            <TableCell>
                                <div className={"-ms-3 flex items-center justify-end"}>
                                    <DropdownMenu modal={false}>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant={"ghost"} size={"icon"} data-nolink>
                                                <span className={"sr-only"}>{tg("accessibility.open-menu")}</span>
                                                <MoreHorizontalIcon className={"w-5"} />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align={"end"}>
                                            <DropdownMenuItem
                                                onClick={() =>
                                                    setOpenEdit({
                                                        uuid: tag.uuid,
                                                        name: tag.name,
                                                        color: tag.color,
                                                    })
                                                }
                                            >
                                                <PenBoxIcon className={"me-2.5 size-4"} />
                                                {t("button.edit")}
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={() => setOpenDelete(tag.uuid)}>
                                                <Trash2Icon className={"me-2.5 size-4"} />
                                                {t("button.delete")}
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            <TablePagination
                currentPage={page}
                maxPages={data.total === 0 ? 1 : Math.ceil(data.total / LIMIT)}
                href={"/app/recipes"}
                getSearchParams={(newPage: number) => ({ page: newPage })}
            />

            {openCreate && (
                <Suspense>
                    <CreateTagDialog
                        onClose={() => {
                            setOpenCreate(false);
                        }}
                    />
                </Suspense>
            )}
            {openEdit && (
                <Suspense>
                    <EditTagDialog tag={openEdit} onClose={() => setOpenEdit(undefined)} />
                </Suspense>
            )}
            {openDelete && (
                <Suspense>
                    <DeleteTagDialog tag_uuid={openDelete} onClose={() => setOpenDelete(undefined)} />
                </Suspense>
            )}
        </HeadingLayout>
    );
}

/**
 * Search props for tag overview
 */
type TagOverviewSearchProps = {
    /** The current page number we're on */
    page: number;
    /** The search term that should be used */
    search: string;
};

export const Route = createFileRoute("/_app/app/tags/")({
    component: TagsOverview,
    validateSearch: (search: Record<string, unknown>): TagOverviewSearchProps => {
        const page = Number(search?.page ?? 1);

        return {
            page: page <= 0 ? 1 : page,
            search: (search.search as string) || "",
        };
    },
    loaderDeps: ({ search: { page, search } }) => ({ page, search }),
    loader: async ({ deps }) => {
        const res = await Api.tags.getAll({
            limit: LIMIT,
            offset: (deps.page - 1) * LIMIT,
            filter_name: deps.search,
        });

        if (res.error) {
            toast.error(res.error.message);
            return;
        }

        return res.data;
    },
});
