import { createFileRoute } from "@tanstack/react-router";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "@tanstack/react-form";
import { ErrorMessage, Text } from "@/components/ui/text.tsx";
import HeadingLayout from "@/components/layouts/heading-layout.tsx";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { CarrotIcon, CheckIcon, SearchIcon, X } from "lucide-react";
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
import RecipeTable from "@/components/recipe-table.tsx";
import type { PageForSimpleRecipeWithTags, SimpleIngredient } from "@/api/generated";
import { Form } from "@/components/ui/form.tsx";
import { Separator } from "@/components/ui/separator.tsx";

export type IngredientsSearchOverviewProps = object;

const LIMIT = 50;

export default function IngredientsSearchOverview() {
    const [t] = useTranslation("ingredients");

    const { page, search } = Route.useSearch();
    const { ingredients } = React.useContext(INGREDIENTS_CONTEXT);

    const [recipes, setRecipes] = useState<PageForSimpleRecipeWithTags | null>(null);
    const [open, setOpen] = React.useState(false);

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
                    filter_uuids: { list: value.search.flatMap((i) => (i.name !== "" ? i.uuid : [])) },
                    filter_name: search,
                    limit: LIMIT,
                    offset: (page - 1) * LIMIT,
                });
                setRecipes(res);
            },
        },
    });

    return (
        <HeadingLayout heading={t("heading.overview-title")} description={t("heading.overview-description")}>
            <Form onSubmit={form.handleSubmit} className="flex flex-col gap-0">
                <form.Field name="search">
                    {(fieldApi) => {
                        const selected = fieldApi.state.value;
                        const available = ingredients.filter((i) => !selected.some((s) => s.uuid === i.uuid));

                        return (
                            <div className="flex flex-col gap-3">
                                <div className="flex flex-wrap items-end gap-3">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-sm font-medium">{t("heading.all-ingredients")}</label>
                                        <Popover open={open} onOpenChange={setOpen}>
                                            <PopoverTrigger
                                                render={
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        role="combobox"
                                                        aria-expanded={open}
                                                    />
                                                }
                                            >
                                                <CarrotIcon className="size-4" />
                                                {t("button.select")}
                                            </PopoverTrigger>
                                            <PopoverContent className="w-72 p-0">
                                                <Command>
                                                    <CommandInput placeholder={t("button.select")} />
                                                    <CommandList>
                                                        <CommandEmpty>{t("label.ingredients-empty")}</CommandEmpty>
                                                        {selected.length > 0 && (
                                                            <CommandGroup heading={t("heading.search-selected")}>
                                                                {selected.map((item, index) => (
                                                                    <CommandItem
                                                                        key={item.uuid}
                                                                        value={item.name}
                                                                        onSelect={() => fieldApi.removeValue(index)}
                                                                    >
                                                                        <CheckIcon className="size-4 shrink-0 text-green-500" />
                                                                        {item.name}
                                                                    </CommandItem>
                                                                ))}
                                                            </CommandGroup>
                                                        )}
                                                        {selected.length > 0 && available.length > 0 && (
                                                            <CommandSeparator />
                                                        )}
                                                        {available.length > 0 && (
                                                            <CommandGroup heading={t("heading.all-ingredients")}>
                                                                {available.map((item) => (
                                                                    <CommandItem
                                                                        key={item.uuid}
                                                                        value={item.name}
                                                                        onSelect={() => {
                                                                            fieldApi.pushValue(item);
                                                                        }}
                                                                    >
                                                                        {item.name}
                                                                    </CommandItem>
                                                                ))}
                                                            </CommandGroup>
                                                        )}
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                    </div>

                                    <Button type="submit">
                                        <SearchIcon className="size-4" />
                                        {t("tooltip.filter")}
                                    </Button>
                                </div>

                                {selected.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {selected.map((item, index) => (
                                            <Badge key={item.uuid} variant="secondary">
                                                {item.name}
                                                <button
                                                    type="button"
                                                    className="hover:opacity-70"
                                                    onClick={() => fieldApi.removeValue(index)}
                                                >
                                                    <X className="size-3" />
                                                </button>
                                            </Badge>
                                        ))}
                                    </div>
                                )}

                                {fieldApi.state.meta.errors.map((err) => (
                                    <ErrorMessage key={err}>{err}</ErrorMessage>
                                ))}
                            </div>
                        );
                    }}
                </form.Field>

                {recipes ? (
                    <RecipeTable search={search} href={"/app/ingredients"} data={recipes} page={page} />
                ) : (
                    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border py-12 text-center">
                        <CarrotIcon className="text-muted-foreground size-10" />
                        <Text>{t("heading.overview-description")}</Text>
                    </div>
                )}
            </Form>
        </HeadingLayout>
    );
}

type RecipeByIngredientsSearchProps = {
    page: number;
    search: string;
};

export const Route = createFileRoute("/_app/app/ingredients/")({
    component: IngredientsSearchOverview,
    validateSearch: (search: Record<string, unknown>): RecipeByIngredientsSearchProps => {
        const page = Number(search?.page ?? 1);

        return {
            page: page <= 0 ? 1 : page,
            search: (search.search as string) || "",
        };
    },
    loaderDeps: ({ search: { page, search } }) => ({ page, search }),
});
