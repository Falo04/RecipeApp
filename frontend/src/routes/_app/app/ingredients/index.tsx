import { createFileRoute } from "@tanstack/react-router";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "@tanstack/react-form";
import type { SimpleRecipeWithTags } from "@/api/model/recipe.interface.ts";
import { ErrorMessage } from "@/components/ui/text.tsx";
import HeadingLayout from "@/components/layouts/heading-layout.tsx";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover.tsx";
import { Button } from "@/components/ui/button.tsx";
import { CarrotIcon, CheckIcon, SearchIcon } from "lucide-react";
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip.tsx";
import RecipeTable from "@/components/recipe-table.tsx";
import type { Page } from "@/api/model/global.interface.ts";

/**
 * The properties for {@link IngredientsSearchOverview}
 */
export type IngredientsSearchOverviewProps = object;

const LIMIT = 50;

/**
 * The overview for searching recipes by ingredients
 */
export default function IngredientsSearchOverview() {
    const [t] = useTranslation("ingredients");
    const [tg] = useTranslation();

    const { page, search } = Route.useSearch();

    const { ingredients } = React.useContext(INGREDIENTS_CONTEXT);

    const [recipes, setRecipes] = useState<Page<SimpleRecipeWithTags>>({
        items: [],
        limit: LIMIT,
        offset: 0,
        total: 0,
    });
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
                    filter_uuids: { list: value.search.flatMap((i) => (i.name !== "" ? i.uuid : [])) },
                    filter_name: search,
                    limit: LIMIT,
                    offset: (page - 1) * LIMIT,
                });
                if (res.error) {
                    toast.error(res.error.message);
                    return;
                }
                if (res.data) {
                    setRecipes(res.data);
                }
            },
        },
    });

    return (
        <HeadingLayout
            classNameHeader={"md:flex-row flex-col"}
            heading={t("heading.overview-title")}
            description={t("heading.overview-description")}
            headingChildren={
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        form.handleSubmit();
                    }}
                    className={"flex w-full gap-2"}
                >
                    <form.Field name={"search"}>
                        {(fieldApi) => (
                            <div className={"relative flex flex-col items-start gap-1"}>
                                <Popover open={open} onOpenChange={setOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"default"}
                                            role="combobox"
                                            aria-expanded={open}
                                            className={"self-end"}
                                        >
                                            <CarrotIcon /> {t("button.search")}
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
                                                                    setFilteredIngredients([
                                                                        ...filteredIngredients,
                                                                        item,
                                                                    ]);
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
                                                                    filteredIngredients.filter(
                                                                        (i) => i.uuid !== item.uuid,
                                                                    ),
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
                            <p>{t("tooltip.filter")}</p>
                        </TooltipContent>
                    </Tooltip>
                </form>
            }
        >
            <RecipeTable search={search} href={"/app/ingredients"} data={recipes} page={page} />
        </HeadingLayout>
    );
}

type RecipeByIngredientsSearchProps = {
    /** The current page number we're on */
    page: number;
    /** The search term that should be used */
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
