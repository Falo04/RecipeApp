import { createFileRoute, Link } from "@tanstack/react-router";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "@tanstack/react-form";
import type { SimpleRecipeWithTags } from "@/api/model/recipe.interface.ts";
import type { ColumnDef } from "@tanstack/react-table";
import { ErrorMessage, Text } from "@/components/ui/text.tsx";
import { Badge, badgeVariants } from "@/components/ui/badge.tsx";
import type { VariantProps } from "class-variance-authority";
import HeadingLayout from "@/components/layouts/heading-layout.tsx";
import { DataTable } from "@/components/ui/data-table.tsx";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover.tsx";
import { Button } from "@/components/ui/button.tsx";
import { CheckIcon, Info, PlusIcon, SearchIcon } from "lucide-react";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command.tsx";
import INGREDIENTS_CONTEXT from "@/context/ingredients.tsx";
import { Api } from "@/api/api.tsx";
import { toast } from "sonner";
import type { SimpleIngredient } from "@/api/model/ingredients.interface.ts";
import { Subheading } from "@/components/ui/heading.tsx";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip.tsx";

/**
 * The properties for {@link IngredientsSearchOverview}
 */
export type IngredientsSearchOverviewProps = object;

/**
 * The overview for searching recipes by ingredients
 */
export default function IngredientsSearchOverview() {
    const [t] = useTranslation("ingredients");
    const [tg] = useTranslation();

    const { ingredients } = React.useContext(INGREDIENTS_CONTEXT);

    const [recipes, setRecipes] = useState<SimpleRecipeWithTags[]>([]);
    const [open, setOpen] = React.useState(false);
    const [filteredIngredients, setFilteredIngredients] = React.useState(ingredients.list);

    const form = useForm({
        defaultValues: {
            search: [] as Array<SimpleIngredient>,
        },
        validators: {
            onSubmitAsync: async ({ value }) => {
                if (value.search.length === 0) {
                    return {
                        fields: {
                            search: t("error.search-empty"),
                        },
                    };
                }
                const res = await Api.ingredients.getRecipes({
                    uuids: { list: value.search.flatMap((i) => (i.name !== "" ? i.uuid : [])) },
                });
                if (res.error) {
                    toast.error(res.error.message);
                    return;
                }
                if (res.data) {
                    setRecipes(res.data.items);
                }
            },
        },
    });

    const columns: ColumnDef<SimpleRecipeWithTags>[] = useMemo(
        () => [
            {
                accessorKey: "name",
                header: () => <span>{tg("table.name")}</span>,
                cell: ({ row }) => (
                    <Link to={"/app/recipes/$recipeId"} params={{ recipeId: row.original.uuid }}>
                        <Text className="overflow-hidden text-ellipsis">{row.original.name}</Text>
                    </Link>
                ),
            },
            {
                accessorKey: "description",
                header: () => <span>{tg("table.description")}</span>,
                cell: ({ row }) => (
                    <Link to={"/app/recipes/$recipeId"} params={{ recipeId: row.original.uuid }}>
                        <Text className={"overflow-hidden text-ellipsis"}>{row.original.description}</Text>
                    </Link>
                ),
            },
            {
                accessorKey: "tags",
                header: () => <span>{tg("table.tags")}</span>,
                cell: ({ row }) => (
                    <div className="flex flex-wrap gap-1">
                        {row.original.tags.map((tag) => (
                            <Link to="/app/tags/$tagId/general" params={{ tagId: tag.uuid }} key={tag.uuid}>
                                <Badge
                                    variant={tag.color.toLowerCase() as VariantProps<typeof badgeVariants>["variant"]}
                                    key={tag.uuid}
                                >
                                    {tag.name}
                                </Badge>
                            </Link>
                        ))}
                    </div>
                ),
            },
            {
                accessorKey: "action",
                header: () => <div className="flex justify-end">{tg("table.action")}</div>,
                cell: ({ row }) => (
                    <div className={"flex justify-end pr-4"}>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Link to={"/app/recipes/$recipeId"} params={{ recipeId: row.original.uuid }}>
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
        <HeadingLayout heading={t("heading.overview-title")} description={t("heading.overview-description")}>
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    form.handleSubmit();
                }}
                className={"flex w-full gap-2"}
            >
                <form.Field name={"search"}>
                    {(fieldApi) => (
                        <div className={"relative flex-col gap-2"}>
                            <Popover open={open} onOpenChange={setOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"default"}
                                        role="combobox"
                                        aria-expanded={open}
                                        className={"w-fit"}
                                    >
                                        <PlusIcon /> {t("button.search")}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent side={"bottom"}>
                                    <Command>
                                        <CommandInput placeholder={t("button.select")} className="h-9" />
                                        <CommandList>
                                            <CommandEmpty>{t("label.ingredients-empty")}</CommandEmpty>
                                            <CommandGroup heading={t("heading.search-selected")}>
                                                {fieldApi.state.value.length !== 0 ? (
                                                    fieldApi.state.value.map((item, index) => (
                                                        <CommandItem
                                                            key={item.uuid}
                                                            value={item.name}
                                                            onSelect={() => {
                                                                fieldApi.removeValue(index);
                                                                setFilteredIngredients([...filteredIngredients, item]);
                                                            }}
                                                        >
                                                            <CheckIcon />
                                                            {item.name}
                                                        </CommandItem>
                                                    ))
                                                ) : (
                                                    <CommandItem>{t("command.empty")}</CommandItem>
                                                )}
                                            </CommandGroup>
                                            <CommandSeparator />
                                            <CommandGroup heading={t("heading.all-ingredients")}>
                                                {filteredIngredients.map((item) => (
                                                    <CommandItem
                                                        key={item.uuid}
                                                        value={item.name}
                                                        onSelect={() => {
                                                            fieldApi.pushValue(item);
                                                            setFilteredIngredients(
                                                                filteredIngredients.filter((i) => i.uuid !== item.uuid),
                                                            );
                                                        }}
                                                    >
                                                        {item.name}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                            {fieldApi.state.meta.errors.map((err) => (
                                <ErrorMessage key={err}>{err}</ErrorMessage>
                            ))}
                        </div>
                    )}
                </form.Field>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button className={"self-start"} type={"submit"} variant={"outline"} size={"icon"}>
                            <SearchIcon />
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{tg("tooltip.filter", { object: "filter" })}</p>
                    </TooltipContent>
                </Tooltip>
            </form>
            {recipes.length === 0 ? (
                <div className={"flex h-full w-full items-center justify-center"}>
                    <Subheading className={"text-center"} level={4}>
                        {t("heading.select-ingredients")}
                    </Subheading>
                </div>
            ) : (
                <DataTable filterTag={t("input.filter")} columns={columns} data={recipes} />
            )}
        </HeadingLayout>
    );
}

export const Route = createFileRoute("/_app/app/ingredients/")({
    component: IngredientsSearchOverview,
});
