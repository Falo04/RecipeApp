import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Api } from "@/api/api";
import type { RecipeSearchResponse } from "@/api/model/recipe.interface";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Search } from "lucide-react";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command.tsx";
import { useIsMobile } from "@/hooks/use-mobile";
import { Spinner } from "@/components/ui/spinner.tsx";

/**
 * The properties for {@link RecipeSearch}
 */
export type RecipeSearchProps = {};

/**
 * Provides a recipe search component with suggestions.
 */
export function RecipeSearch(_props: RecipeSearchProps) {
    const [t] = useTranslation("recipe");
    const navigate = useNavigate();
    const isMobile = useIsMobile();

    const [query, setQuery] = useState("");
    const [open, setOpen] = useState(false);
    const [suggestions, setSuggestions] = useState<RecipeSearchResponse[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (query.length < 3) {
            setSuggestions([]);
            return;
        }
        if (loading) return;
        setLoading(true);
        Api.recipe.search({ name: query }).then((res) => {
            if (res.error) {
                toast.error(res.error.message);
                return;
            }
            if (res.data) {
                setSuggestions(res.data.list);
            }
        });
        setLoading(false);
    }, [query]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild className={"p-0 md:p-4"}>
                <Button
                    variant={"secondary"}
                    role={"combobox"}
                    aria-expanded={open}
                    size={"icon"}
                    className={"md:w-full"}
                >
                    <Search />
                    {!isMobile && t("search.recipes")}
                </Button>
            </PopoverTrigger>
            <PopoverContent className={"p-2"}>
                <Command>
                    <CommandInput
                        value={query}
                        onValueChange={setQuery}
                        placeholder={t("search.recipes")}
                        className={"h-9"}
                    />
                    <CommandList>
                        <CommandEmpty>{t("search.recipes-empty")}</CommandEmpty>
                        <CommandGroup>{loading && <Spinner />}</CommandGroup>
                        <CommandGroup>
                            {suggestions.map((recipe) => (
                                <CommandItem
                                    key={recipe.uuid}
                                    value={recipe.name}
                                    onSelect={() => {
                                        navigate({
                                            to: "/app/recipes/$recipeId",
                                            params: { recipeId: recipe.uuid },
                                        });
                                        setOpen(false);
                                        setQuery("");
                                        return;
                                    }}
                                >
                                    {recipe.name}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
