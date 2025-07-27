import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import HeadingLayout from "@/components/layouts/heading-layout";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table.tsx";
import { Text } from "@/components/ui/text.tsx";
import { BadgeButton, badgeVariants } from "@/components/ui/badge.tsx";
import type { VariantProps } from "class-variance-authority";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu.tsx";
import {
    CopyIcon,
    LayoutGridIcon,
    LayoutListIcon,
    MoreHorizontalIcon,
    PenBoxIcon,
    PlusIcon,
    Settings2Icon,
    Trash2Icon,
} from "lucide-react";
import { useForm } from "@tanstack/react-form";
import { Api } from "@/api/api.tsx";
import { toast } from "sonner";
import { Form, Input } from "@/components/ui/form.tsx";
import TablePagination from "@/components/ui/table-pagination.tsx";
import { useIsMobile } from "@/hooks/use-mobile.ts";
import React, { Suspense } from "react";
import { DeleteRecipeDialog } from "@/components/dialogs/delete-recipe.tsx";

/**
 * The properties for {@link FoodOverview}
 */
export type FoodOverviewProps = object;

const LIMIT = 50;

/**
 * Renders a food overview table.
 */
export function FoodOverview() {
    const [t] = useTranslation("recipe");
    const [tg] = useTranslation();

    const [openDelete, setOpenDelete] = React.useState<string | undefined>();

    const navigate = useNavigate();
    const isMobile = useIsMobile();

    const { search, page } = Route.useSearch();
    const data = Route.useLoaderData();
    if (!data) {
        return;
    }

    const form = useForm({
        defaultValues: {
            search: search,
        },
    });

    return (
        <HeadingLayout
            heading={t("heading.overview-title")}
            description={t("heading.overview-description")}
            headingChildren={
                <Link to={"/app/recipes/create"}>
                    <Button>
                        {isMobile ? (
                            <div className={"flex items-center gap-1"}>
                                <PlusIcon size={"size-4"} /> {t("button.create-short")}
                            </div>
                        ) : (
                            t("button.create")
                        )}
                    </Button>
                </Link>
            }
        >
            <div className={"flex items-start justify-between gap-4 lg:items-end"}>
                <Form onSubmit={form.handleSubmit}>
                    <form.Field
                        name={"search"}
                        validators={{
                            onChangeAsync: async ({ fieldApi }) => {
                                await navigate({
                                    to: `/app/recipes`,
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

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant={"outline"}>
                            <Settings2Icon className={"me-1.5 size-4 opacity-80"} />
                            {t("filter.view")}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenu>
                            <DropdownMenuLabel>{t("filter.layout")}</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuRadioGroup value={"table"}>
                                <DropdownMenuRadioItem value={"table"}>
                                    <LayoutListIcon className={"size-4"} />
                                    <Button variant={"ghost"}>{t("filter.table")}</Button>
                                </DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value={"grid"}>
                                    <LayoutGridIcon className={"size-4"} />
                                    <Button variant={"ghost"}>{t("filter.grid")}</Button>
                                </DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup>
                        </DropdownMenu>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <Table>
                <TableHeader className={"sticky top-0"}>
                    <TableRow>
                        <TableHead>{tg("table.name")}</TableHead>
                        <TableHead>{tg("table.description")}</TableHead>
                        <TableHead>{tg("table.tags")}</TableHead>
                        <TableHead className={"w-0"}>
                            <span className={"sr-only"}>{tg("accessibility.actions")}</span>
                        </TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.items.map((recipe) => (
                        <TableRow
                            key={recipe.uuid}
                            onClick={async (e) => {
                                const target = e.target as HTMLElement;
                                if (!target.closest("[data-nolink]") && e.currentTarget.contains(target)) {
                                    await navigate({
                                        to: "/app/recipes/$recipeId",
                                        params: { recipeId: recipe.uuid },
                                    });
                                }
                            }}
                        >
                            <TableCell>
                                <Text>{recipe.name}</Text>
                            </TableCell>
                            <TableCell>
                                <Text>{recipe.description}</Text>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-wrap gap-1">
                                    {recipe.tags.map((tag) => (
                                        <BadgeButton
                                            key={tag.uuid}
                                            data-nolink
                                            variant={
                                                tag.color.toLowerCase() as VariantProps<typeof badgeVariants>["variant"]
                                            }
                                            onClick={async () => {
                                                await navigate({
                                                    to: "/app/tags/$tagId",
                                                    params: { tagId: tag.uuid },
                                                });
                                            }}
                                        >
                                            {tag.name}
                                        </BadgeButton>
                                    ))}
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className={"-ms-3 flex items-center justify-end"}>
                                    <DropdownMenu modal={false}>
                                        <DropdownMenuTrigger asChild data-nolink>
                                            <Button variant={"ghost"} size={"icon"}>
                                                <span className={"sr-only"}>{tg("accessibility.open-menu")}</span>
                                                <MoreHorizontalIcon className={"w-5"} />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align={"end"}>
                                            <DropdownMenuItem
                                                onSelect={async () => {
                                                    await navigate({
                                                        to: "/app/recipes/$recipeId/update",
                                                        params: { recipeId: recipe.uuid },
                                                    });
                                                }}
                                            >
                                                <PenBoxIcon className={"me-2.5 size-4"} />
                                                {t("button.edit")}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => {}}>
                                                <CopyIcon className={"me-2.5 size-4"} />
                                                {t("button.copy")}
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onSelect={() => setOpenDelete(recipe.uuid)}>
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

            {openDelete && (
                <Suspense>
                    <DeleteRecipeDialog recipe_uuid={openDelete} onClose={() => setOpenDelete(undefined)} />
                </Suspense>
            )}
        </HeadingLayout>
    );
}

type RecipeOverviewSearchProps = {
    /** The current page number we're on */
    page: number;
    /** The search term that should be used */
    search: string;
};

export const Route = createFileRoute("/_app/app/recipes/")({
    component: FoodOverview,
    validateSearch: (search: Record<string, unknown>): RecipeOverviewSearchProps => {
        const page = Number(search?.page ?? 1);

        return {
            page: page <= 0 ? 1 : page,
            search: (search.search as string) || "",
        };
    },
    loaderDeps: ({ search: { page, search } }) => ({ page, search }),
    loader: async ({ deps }) => {
        const res = await Api.recipe.getAll({
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
