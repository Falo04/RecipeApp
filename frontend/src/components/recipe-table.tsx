import React, { Suspense } from "react";
import { useTranslation } from "react-i18next";
import { Form, Input } from "./ui/form";
import { useNavigate, type LinkProps } from "@tanstack/react-router";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuSeparator,
    DropdownMenuLabel,
    DropdownMenuTrigger,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuItem,
} from "./ui/dropdown-menu";
import {
    CopyIcon,
    LayoutGridIcon,
    LayoutListIcon,
    MoreHorizontalIcon,
    PenBoxIcon,
    Settings2Icon,
    Trash2Icon,
} from "lucide-react";
import { Button } from "./ui/button";
import { Table, TableRow, TableHead, TableHeader, TableBody, TableCell } from "./ui/table";
import type { SimpleRecipeWithTags } from "@/api/model/recipe.interface.ts";
import { BadgeButton, badgeVariants } from "./ui/badge";
import type { VariantProps } from "class-variance-authority";
import TablePagination from "./ui/table-pagination";
import { DeleteRecipeDialog } from "@/components/dialogs/delete-recipe.tsx";
import type { Page } from "@/api/model/global.interface";
import { useForm } from "@tanstack/react-form";
import { Text } from "@/components/ui/text.tsx";

/**
 * The properties for {@link RecipeTable}
 */
export type RecipeTableProps = {
    /** Query param for searching recipe name */
    search: string;
    /** Where the filter/pagination should navigate to*/
    href: LinkProps["to"];
    /** Params for navigate */
    params?: LinkProps["params"];
    /** Search params for navigate */
    data: Page<SimpleRecipeWithTags>;
    /** Current page */
    page: number;
};

const LIMIT = 50;

/**
 * Table for recipes
 */
export default function RecipeTable(props: RecipeTableProps) {
    const [t] = useTranslation("recipe");
    const [tg] = useTranslation();

    const navigate = useNavigate();

    const [openDelete, setOpenDelete] = React.useState<string | undefined>();

    const form = useForm({
        defaultValues: {
            search: props.search,
        },
    });

    // @ts-ignore
    return (
        <>
            <div className={"flex items-start justify-between gap-4 lg:items-end"}>
                <Form onSubmit={form.handleSubmit}>
                    <form.Field
                        name={"search"}
                        validators={{
                            onChangeAsync: async ({ fieldApi }) => {
                                await navigate({
                                    to: props.href,
                                    search: { page: props.page, search: fieldApi.state.value },
                                    params: props.params,
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
                            <DropdownMenuLabel className={"flex items-center gap-2"}>
                                <LayoutGridIcon className="size-4" />
                                {t("filter.layout")}
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuRadioGroup value={"table"} className={"px-1 pb-1"}>
                                <DropdownMenuRadioItem value={"table"}>
                                    <LayoutListIcon className={"size-4"} />
                                    {t("filter.table")}
                                </DropdownMenuRadioItem>
                                <DropdownMenuRadioItem value={"grid"}>
                                    <LayoutGridIcon className={"size-4"} />
                                    {t("filter.grid")}
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
                    {props.data.items.map((recipe) => (
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
                                                    search: { page: 1, search: "" },
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
                currentPage={props.page}
                maxPages={props.data.total === 0 ? 1 : Math.ceil(props.data.total / LIMIT)}
                href={"/app/recipes"}
                getSearchParams={(newPage: number) => ({ page: newPage })}
            />

            {openDelete && (
                <Suspense>
                    <DeleteRecipeDialog recipe_uuid={openDelete} onClose={() => setOpenDelete(undefined)} />
                </Suspense>
            )}
        </>
    );
}
