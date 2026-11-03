import { createFileRoute, useNavigate } from "@tanstack/react-router";
import RecipeTable from "@/components/recipe-table.tsx";
import { useTranslation } from "react-i18next";
import HeadingLayout from "@/components/layouts/heading-layout.tsx";
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
import { useGetAllRecipes, useGetAllTags } from "@/api/generated";
import type { SimpleTag } from "@/api/generated/model";

/**
 * The properties for {@link RecipeOverviewForTag}
 */
export type RecipeOverviewForTagProps = object;

/**
 * Shows all recipes that are tagged to this tag
 */
export default function RecipeOverviewForTag() {
    const [t] = useTranslation("tag");
    const [tg] = useTranslation();

    const navigate = useNavigate();

    const { tagId } = Route.useParams();
    const { data: tag } = useGetAllTags({ query: { select: (tags) => tags.list.find((t) => t.uuid === tagId) } });
    const [openEdit, setOpenEdit] = React.useState<SimpleTag>();
    const [openDelete, setOpenDelete] = React.useState<string | undefined>(undefined);

    const { search, page } = Route.useSearch();
    const { data: recipes = [] } = useGetAllRecipes({
        query: { select: (res) => res.list.filter((recipe) => recipe.tags.some((t) => t.uuid === tagId)) },
    });
    if (!tag) {
        return;
    }

    return (
        <HeadingLayout
            breadcrumbs={[
                { label: tg("menu.tags"), href: "/app/tags", search: { page: 1, search: "" } },
                { label: tag.name },
            ]}
            heading={t("heading.tags-recipes-title", { object: tag.name })}
            description={t("heading.tags-recipes-description")}
            headingChildren={
                <DropdownMenu modal={false}>
                    <DropdownMenuTrigger render={<Button variant={"ghost"} size={"icon"} />} data-nolink>
                        <span className={"sr-only"}>{tg("accessibility.open-menu")}</span>
                        <MoreHorizontalIcon className={"w-5"} />
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
                recipes={recipes}
                page={page}
            />

            {openEdit && (
                <Suspense>
                    <EditTagDialog tag={openEdit} onClose={() => setOpenEdit(undefined)} />
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
});
