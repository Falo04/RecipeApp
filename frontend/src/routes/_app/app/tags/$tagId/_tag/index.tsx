import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { Api } from "@/api/api.tsx";
import RecipeTable from "@/components/recipe-table.tsx";
import { useTranslation } from "react-i18next";
import HeadingLayout from "@/components/layouts/heading-layout.tsx";
import SINGLE_TAG_CONTEXT from "@/context/tag.tsx";
import React, { Suspense } from "react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.tsx";
import { Button } from "@/components/ui/button.tsx";
import { MoreHorizontalIcon, PenBoxIcon, Trash2Icon } from "lucide-react";
import { EditTagDialog } from "@/components/dialogs/edit-tag.tsx";
import { DeleteTagDialog } from "@/components/dialogs/delete-tag.tsx";
import type { SimpleTag } from "@/api/generated";

/**
 * The properties for {@link RecipeOverviewForTag}
 */
export type RecipeOverviewForTagProps = object;

const LIMIT = 50;

/**
 * Shows all recipes that are tagged to this tag
 */
export default function RecipeOverviewForTag() {
    const [t] = useTranslation("tag");
    const [tg] = useTranslation();

    const navigate = useNavigate();
    const router = useRouter();

    const { tag } = React.useContext(SINGLE_TAG_CONTEXT);
    const [openEdit, setOpenEdit] = React.useState<SimpleTag>();
    const [openDelete, setOpenDelete] = React.useState<string | undefined>(undefined);

    const { search, page } = Route.useSearch();
    const data = Route.useLoaderData();
    if (!data) {
        return;
    }

    return (
        <HeadingLayout
            heading={t("heading.tags-recipes-title", { object: tag.name })}
            description={t("heading.tags-recipes-description")}
            headingChildren={
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
                        <DropdownMenuItem onClick={() => setOpenDelete(tag.uuid)}>
                            <Trash2Icon className={"me-2.5 size-4"} />
                            {t("button.delete")}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            }
        >
            <RecipeTable
                search={search}
                href={"/app/tags/$tagId"}
                params={{ tagId: tag.uuid }}
                data={data}
                page={page}
            />

            {openEdit && (
                <Suspense>
                    <EditTagDialog
                        tag={openEdit}
                        onClose={() => {
                            setOpenEdit(undefined);
                            router.invalidate();
                        }}
                    />
                </Suspense>
            )}
            {openDelete && (
                <Suspense>
                    <DeleteTagDialog
                        tag_uuid={openDelete}
                        onClose={async () => {
                            setOpenDelete(undefined);
                            await navigate({ to: "/app/tags", search: { search: "", page: 0 } });
                        }}
                    />
                </Suspense>
            )}
        </HeadingLayout>
    );
}

type RecipesByTagSearchProps = {
    /** The current page number we're on */
    page: number;
    /** The search term that should be used */
    search: string;
};

export const Route = createFileRoute("/_app/app/tags/$tagId/_tag/")({
    component: RecipeOverviewForTag,
    validateSearch: (search: Record<string, unknown>): RecipesByTagSearchProps => {
        const page = Number(search?.page ?? 1);

        return {
            page: page <= 0 ? 1 : page,
            search: (search.search as string) || "",
        };
    },
    loaderDeps: ({ search: { page, search } }) => ({ page, search }),
    loader: async ({ deps, params }) =>
        await Api.tags.getRecipesByTag(params.tagId, {
            limit: LIMIT,
            offset: (deps.page - 1) * LIMIT,
            filter_name: deps.search,
        }),
});
